import * as d3 from 'd3'
// common
import {axes, polynomialCurve, controlPolygon, controlPoints, labels, lineGenerator, cpGenerator} from 'draw'
import {bezierCurve} from 'bezier'
import { colorsDos as colors } from 'colors'

// Problem
let u = 1/3
const points = [
    { x: 0.1,  y: 0.1, drag: true, id: 0, name: 'b0' }, 
    { x: 0.25, y: 0.8, drag: true, id: 1, name: 'b1' }, 
    { x: 0.7,  y: 0.9, drag: true, id: 2, name: 'b2' }, 
    { x: 0.85, y: 0.2, drag: true, id: 3, name: 'b3' }
    ]

const width = 500 // canvas  width
const height = 500 // canvas height
const bColor =   '#5F7186' // color of Bezier curve
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
const s = 0
const t = 1
const N = 100
const cPoints = []
const n = points.length - 1
for (let l = 0; l <= n; l++) {
    cPoints.push([])
    for (let i = 0; i <= n - l; i++) {
        cPoints[l].push({x: 0, y: 0, level: l, name: 'b_'+ l + i, drag: false})
    }
    cPoints[0].forEach(p => p.drag = true)
}
points.forEach( p => {
    p.x = xScale(p.x)
    p.y = yScale(p.y)
})
deCasteljauPoints(cPoints, points, s, t, u)

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

const bezierG = polynomialCurve(curvesG, bezierCurve(cPoints[0], s, t, N), cStrokeWidth, bColor, 'bezier-curve')
const dcPolygonsG = []
const dcCtrPointG = []
const dcLabelsG = []
for (let l = 0; l < n; l++) {
    const ctrPolG = controlPolygon(polygonsG, cPoints[l], pStrokeWidth, colors[l], 'ctrPoly'+l)
    dcPolygonsG.push(ctrPolG)
    nConfig.fillColor = colors[l]
    nConfig.className = nConfig.className + '-' + l
    const ctrPotG = controlPoints(ctPointsG, cPoints[l], nConfig)
    dcCtrPointG.push(ctrPotG)
    tConfig.fColor = colors[l]
    tConfig.className = tConfig.className + '-' + l
    const labelsG = labels(ctPointsG, cPoints[l], tConfig)
    dcLabelsG.push(labelsG)
}
nConfig.fillColor = colors[n]
nConfig.className = nConfig.className + '-' + n
dcCtrPointG.push(controlPoints(ctPointsG, cPoints[n], nConfig))
tConfig.fColor = colors[n]
tConfig.className = tConfig.className + '-' + n
dcLabelsG.push(labels(ctPointsG, cPoints[n], tConfig))

function redraw() {
    deCasteljauPoints(cPoints, cPoints[0], s, t, u)
    const samplesB = bezierCurve(cPoints[0], s, t, N)
    bezierG
        .attr('d', lineGenerator(samplesB))    
    for (let i = 0; i < n; i++) {
        dcPolygonsG[i]
            .attr('d', cpGenerator(cPoints[i]) )
    }
    for (let i = 0; i <= n; i++) {
        dcCtrPointG[i]
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
        dcLabelsG[i]
            .attr('x', d => d.x + textOffsetX)
            .attr('y', d => d.y + textOffsetY)   
    } 
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
function update() {
    d3.select('#u-value').text(u.toFixed(2))
    d3.select('#deCasteljau_u_slider').property('value', u)
    redraw(u)
}

const uSlider = d3.select('#deCasteljau_u_slider').on('input', function() {
    u = +this.value
    update()
})

function deCasteljauPoints(c, points, s, t, u) {
    const n = points.length - 1
    const b = new Array(n+1).fill(0).map( entry => new Array(2).fill(0))
    points.forEach( (p, i) => {
        b[i][0] = p.x
        b[i][1] = p.y
        c[0][i].x = p.x
        c[0][i].y = p.y
    })
    for (let j = 1; j <= n; j++) {
      for (let i = 0; i <= n-j; i++) {
        b[i][0] = ((t-u) * b[i][0] + (u-s) * b[i+1][0]) / (t-s)
        b[i][1] = ((t-u) * b[i][1] + (u-s) * b[i+1][1]) / (t-s)
        c[j][i].x = b[i][0]
        c[j][i].y = b[i][1]
      }
    }
}



const cText = `
// de Casteljau algorithm
function deCasteljau(points, s, t, u) {
    const b = points.map( e => [e.x, e.y])
    const n = points.length - 1;
    for (let j = 1; j <= n; j++) {
        for (let i = 0; i <= n-j; i++) {
            b[i][0] = ((t-u) * b[i][0] + (u-s) * b[i+1][0]) / (t-s)
            b[i][1] = ((t-u) * b[i][1] + (u-s) * b[i+1][1]) / (t-s)
        }
    }
    return b[0]
}
`
const hlPre = d3.select('#hl-code').append('pre')
const hlCod = hlPre.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cText)