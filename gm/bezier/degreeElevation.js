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
import { bezierCurve, degreeElevation } from './bezier.js'
import { colorsDos as colors } from '../common/colors.js'

const width = 500 // canvas  width
const height = 500 // canvas height
const cStrokeWidth = 1.5 // curve line width
const pStrokeWidth = 1.5 // control polygon line width
const nodeColor =  '#f5deb3'
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

// Geometry
let u = 1/3
const points = [
    { x: 0.1,  y: 0.1, drag: true, id: 0, name: 'b0' }, 
    { x: 0.25, y: 0.8, drag: true, id: 1, name: 'b1' }, 
    { x: 0.7,  y: 0.9, drag: true, id: 2, name: 'b2' }, 
    { x: 0.85, y: 0.2, drag: true, id: 3, name: 'b3' }
    ]
const s = 0
const t = 1
const N = 100
points.forEach( p => {
    p.x = xScale(p.x)
    p.y = yScale(p.y)
})

const nConfig = { // control points: n for node
    className: 'controlPoint',
    nodeRadius,
    fillColor: nodeColor,
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
const ptsOut = degreeElevation(points)
ptsOut.forEach ( p => p.drag = true)
const bezierInG  = polynomialCurve(curvesG, bezierCurve(points, s, t, N), cStrokeWidth, colors[0], 'bezier-curve-left')
const bezierOutG = polynomialCurve(curvesG, bezierCurve(ptsOut, s, t, N), cStrokeWidth, colors[1], 'bezier-curve-right')
const dcPolygonsG = []
const dcCtrPointG = []
const dcLabelsG = []
// control polygons
dcPolygonsG.push(controlPolygon(polygonsG, points, pStrokeWidth, colors[2], 'ctrPoly-In'))
dcPolygonsG.push(controlPolygon(polygonsG, ptsOut, pStrokeWidth, colors[3], 'ctrPoly-Out'))
nConfig.fillColor = colors[5]
nConfig.className = nConfig.className + '-In'
dcCtrPointG.push(controlPoints(ctPointsG, points, nConfig))
nConfig.fillColor = colors[6]
nConfig.className = nConfig.className + '-Out'
dcCtrPointG.push(controlPoints(ctPointsG, ptsOut, nConfig))
tConfig.fColor = colors[5]
tConfig.className = tConfig.className + '-In'
tConfig.yOffset = -8
dcLabelsG.push(labels(ctPointsG, points, tConfig))
tConfig.fColor = colors[6]
tConfig.className = tConfig.className + '-Out'
tConfig.yOffset = 10
dcLabelsG.push(labels(ctPointsG, ptsOut, tConfig))

function redraw() {
    bezierInG
        .attr('d', lineGenerator(bezierCurve(points, s, t, N)))    
    bezierOutG
        .attr('d', lineGenerator(bezierCurve(ptsOut, s, t, N)))    
    dcPolygonsG[0].attr('d', cpGenerator(points))
    dcPolygonsG[1].attr('d', cpGenerator(ptsOut))
    dcCtrPointG.forEach( g => {
        g
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
    })
    dcLabelsG.forEach( (g, index) => {
        if (index === 0) {
            g
                .attr('x', d => d.x + textOffsetX)
                .attr('y', d => d.y + -8)
        } else {
            g
                .attr('x', d => d.x + textOffsetX)
                .attr('y', d => d.y + 10)
        }   
    })
}
function dragstarted(event, d) {
    if (d.drag === false) return
    redraw()
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
    redraw()
}
function dragend(event, d) {
    redraw()
    d3.select(this)
        .attr('r', nodeRadius)
        .attr('fill', nodeColor)
        .attr('stroke', nStrokeColor)
        .attr('stroke-width', nStrokeWidth)
}

function deCasteljauPoints(c, points, s, t, u) {
    const n = points.length - 1
    const b = new Array(n+1).fill(0).map( entry => new Array(2).fill(0))
    points.forEach( (p, i) => {
        b[i][0] = p.x
        b[i][1] = p.y
        c[0][i].x = p.x
        c[0][i].y = p.y
        c[0][i].name = 'b'+0+i
    })
    for (let j = 1; j <= n; j++) {
      for (let i = 0; i <= n-j; i++) {
        b[i][0] = ((t-u) * b[i][0] + (u-s) * b[i+1][0]) / (t-s)
        b[i][1] = ((t-u) * b[i][1] + (u-s) * b[i+1][1]) / (t-s)
        c[j][i].x = b[i][0]
        c[j][i].y = b[i][1]
        c[j][i].name = 'b'+j+i
      }
    }
}

const cText = `
// Degree Elevation
function degreeElevation(points) {
    const n = points.length - 1
    const b = []
    b.push({x: points[0].x, y: points[0].y, drag: true, id: 4, name: 'b*0', level: 1})
    for (let i = 1; i <= n; ++i)
    {
        b.push( {
           x: i / (n+1) * points[i-1].x + (1 - i/(n+1)) * points[i].x,
           y: i / (n+1) * points[i-1].y + (1 - i/(n+1)) * points[i].y,
           id: 4 + i,
           name: 'b*'+ i,
           level: 1
        })
    }
    b.push({ x: points[n].x, y: points[n].y, id: 4 + n + 1, name: 'b*' + (n+1), level: 1 })

    return b
}
`
const hlPre = d3.select('#hl-code').append('pre')
const hlCod = hlPre.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cText)