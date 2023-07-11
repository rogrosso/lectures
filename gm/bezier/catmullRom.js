// common
import {
    axes, 
    polynomialCurve, 
    controlPolygon, 
    controlPoints, 
    labels, 
    lineGenerator, 
    cpGenerator
} from '../common/draw.js'
import { bezierCurve } from './bezier.js'
import { colorsDos as colors } from '../common/colors.js'

const width = 500 // canvas  width
const height = 500 // canvas height
const cStrokeWidth = 1.5 // curve line width
const pStrokeWidth = 1.5 // control polygon line width
const nStrokeColor = '#2f4f4f' // color of stroke for nodes
const nStrokeWidth = 1.5 // width of stroke for nodes
const selNodeColor = '#00ffff' // color for selected nodes
const nodeRadius = 5 // radius for unselected nodes
const selNodeRadius = 8 // radius for selected nodes
// d3 margin convention
const margin = { top: 35, bottom: 25, left: 40, right: 20}
const innerWidth = width - margin.left - margin.right
const innerHeight = height - margin.top - margin.bottom

// canvas
const svg = d3.selectAll("#d3js_canvas")
    .append('svg')
    .attr('width', width)
    .attr('height', height)

// Scales and Axes
const xRange = [0, innerWidth]
const yRange = [0, innerHeight]
const xDomain = [0,1]
const yDomain = [1,0]
const xScale = d3.scaleLinear()
        .domain(xDomain)
        .range(xRange)
const yScale = d3.scaleLinear()
        .domain(yDomain)
        .range(yRange)
const aConfig = {
    selection: svg,
    xScale,
    yScale,
    xPos: margin.left,
    yPos: margin.top,
    className: 'axesBasisChange'
}
const axisG = axes(aConfig)

// Polynomial curve
const curvesG = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
const polygonsG = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
const ctPointsG = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

// Catmull-Rom interpolation
const bzCurve = []
const ctPolyg = []
const ctPoint = []
const cpLabel = []
const nConfig = { // control points: n for node
    className: 'controlPoint-B',
    nodeRadius,
    fillColor: colors[0],
    strokeColor: nStrokeColor,
    strokeWidth: nStrokeWidth,
    dragstarted, 
    dragged, 
    dragend
}
const textOffsetX = 10
const textOffsetY = 10
const tConfig = {
    xOffset: textOffsetX, 
    yOffset: textOffsetY, 
    fontSize: 14, 
    fColor: '#635F5D', 
    className: 'nodeName'
}
function draw(cPoints, t) {
    catmullRom(cPoints, t)
    for (let i = 0; i < cPoints.length; i++) {
        const color = colors[i]
        bzCurve.push( polynomialCurve(curvesG, bezierCurve(cPoints[i],0, 1, 100), cStrokeWidth, colors[i], 'bezierCurve_b' + i) )
        ctPolyg.push( controlPolygon(polygonsG, cPoints[i], pStrokeWidth, colors[i], 'controlPolygon_b' + i) )
        nConfig.fillColor = colors[i]
        ctPoint.push( controlPoints(ctPointsG, cPoints[i], nConfig) )
        tConfig.fColor = colors[i]
        cpLabel.push( labels(ctPointsG, cPoints[i], tConfig) )
    }
}
function redraw(cPoints, t) {
    catmullRom(cPoints, t)
    for (let i = 0; i < cPoints.length; i++) {
        const samples = bezierCurve(cPoints[i])
        bzCurve[i].attr('d', lineGenerator(bezierCurve(cPoints[i], 0, 1, 100))) 
        ctPolyg[i].attr('d', cpGenerator(cPoints[i])) 
        ctPoint[i]
            .attr('cx', d => d.x)    
            .attr('cy', d => d.y)    
        cpLabel[i]
            .attr('x', d => d.x + textOffsetX)
            .attr('y', d => d.y + textOffsetY)  
    }
}
function computeControlPoints(i, t, p) 
{
    if (i != 0) {
        const alpha = (t[i+1] - t[i]) / (3.0 * (t[i+1] - t[i-1]))
        p[i][1].x = p[i][0].x + alpha * (p[i][3].x - p[i - 1][0].x)
        p[i][1].y = p[i][0].y + alpha * (p[i][3].y - p[i - 1][0].y)
    }
    if (i != p.length - 1) {
        const alpha = -(t[i+1] - t[i]) / (3.0 * (t[i+2] - t[i]))
        p[i][2].x = p[i+1][0].x + alpha * (p[i+1][3].x - p[i][0].x)
        p[i][2].y = p[i+1][0].y + alpha * (p[i+1][3].y - p[i][0].y)
    }
    if (i == 0) {
        p[i][1].x = 0.5 * (p[i][0].x + p[i][2].x)
        p[i][1].y = 0.5 * (p[i][0].y + p[i][2].y)
    }
    if (i == p.length - 1) {
        p[i][2].x = 0.5 * (p[i][3].x + p[i][1].x)
        p[i][2].y = 0.5 * (p[i][3].y + p[i][1].y)
    }
}

const points = [
    { x: 1/12,  y: 1/12,  id: 0, drag: true, name: 'p0' }, 
    { x: 4/12,  y: 6/12,  id: 1, drag: true, name: 'p1' }, 
    { x: 7/12,  y: 3/12,  id: 2, drag: true, name: 'p2' }, 
    { x: 11/12, y: 7/12,  id: 3, drag: true, name: 'p3' }, 
    { x: 9/12,  y: 11/12, id: 4, darg: true, name: 'p4' }
]
const t = [0]
for(let i = 1; i < points.length; ++i) {
    let norm = Math.sqrt(
        (points[i].x - points[i-1].x)*(points[i].x - points[i-1].x) +
        (points[i].y - points[i-1].y)*(points[i].y - points[i-1].y))
    t.push(t[i-1] + norm)
}
const cPoints = []
points.forEach( p => {
    p.x = xScale(p.x)
    p.y = yScale(p.y)
})
for (let i = 0; i < points.length - 1; i++) {
    const cp = []
    cp.push(points[i])
    cp.push({x: 0,  y: 0,  id: 33 + 2*i + 1, drag: false, name: 'p' + i + 1})
    cp.push({x: 0,  y: 0,  id: 33 + 2*i + 2, drag: false, name: 'p' + i + 2})
    cp.push(points[i+1])
    cPoints.push(cp)
}

function catmullRom(cPoints, t) {
    for(let i = 0; i < cPoints.length; i++) {
        const x2 = (cPoints[i][3].x-cPoints[i][0].x) ** 2
        const y2 = (cPoints[i][3].y-cPoints[i][0].y) ** 2
        t[i+1] = t[i] + Math.sqrt( x2 + y2 )
    }
    for (let i = 0; i < cPoints.length; i++) {
        computeControlPoints(i, t, cPoints)
    }
}

draw(cPoints, t)



function dragstarted(event, d) {
    if (d.id !== 4 && d.drag === false) return
    redraw(cPoints, t)
    d3.select(this)
        .attr('r', selNodeRadius)
        .attr('fill', selNodeColor)
        .attr('stroke', '#ff00ff')
        .attr('stroke-width', 3)
}
function dragged(event, d) {
    if (d.drag === false) return
    event.subject.x = event.x
    event.subject.y = event.y
    redraw(cPoints, t)
}
function dragend(event, d) {
    redraw(cPoints, t)
    d3.select(this)
        .attr('r', nodeRadius)
        .attr('fill', d => colors[d.id])
        .attr('stroke', nStrokeColor)
        .attr('stroke-width', nStrokeWidth)
}

const cText = `
function computeControlPoints(i, t, p) 
{
    if (i != 0) {
        const alpha = (t[i+1] - t[i]) / (3.0 * (t[i+1] - t[i-1]))
        p[i][1].x = p[i][0].x + alpha * (p[i][3].x - p[i - 1][0].x)
        p[i][1].y = p[i][0].y + alpha * (p[i][3].y - p[i - 1][0].y)
    }
    if (i != p.length - 1) {
        const alpha = -(t[i+1] - t[i]) / (3.0 * (t[i+2] - t[i]))
        p[i][2].x = p[i+1][0].x + alpha * (p[i+1][3].x - p[i][0].x)
        p[i][2].y = p[i+1][0].y + alpha * (p[i+1][3].y - p[i][0].y)
    }
    if (i == 0) {
        p[i][1].x = 0.5 * (p[i][0].x + p[i][2].x)
        p[i][1].y = 0.5 * (p[i][0].y + p[i][2].y)
    }
    if (i == p.length - 1) {
        p[i][2].x = 0.5 * (p[i][3].x + p[i][1].x)
        p[i][2].y = 0.5 * (p[i][3].y + p[i][1].y)
    }
}
// compute knot vector to be chordal
function catmullRom(cPoints, t) {
    for(let i = 0; i < cPoints.length; i++) {
        const x2 = (cPoints[i][3].x-cPoints[i][0].x) ** 2
        const y2 = (cPoints[i][3].y-cPoints[i][0].y) ** 2
        t[i+1] = t[i] + Math.sqrt( x2 + y2 )
    }
    for (let i = 0; i < cPoints.length; i++) {
        computeControlPoints(i, t, cPoints)
    }
}
`
const hlPre = d3.select('#hl-code').append('pre')
const hlCod = hlPre.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cText)