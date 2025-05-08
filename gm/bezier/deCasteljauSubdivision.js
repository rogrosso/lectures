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
import {bezierCurve} from './bezier.js'
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

deCasteljauPoints(cPoints,points, s, t, u)
const ptLeft = []
const ptRight = []
for (let i = 0; i <= n; i++) {
    ptLeft.push(cPoints[i][0])
    ptRight.push(cPoints[n-i][i])
}
const bezierLeftG  = polynomialCurve(curvesG, bezierCurve(ptLeft, s, t, N), cStrokeWidth, colors[0], 'bezier-curve-left')
const bezierRightG = polynomialCurve(curvesG, bezierCurve(ptRight, s, t, N), cStrokeWidth, colors[1], 'bezier-curve-right')
const dcPolygonsG = []
const dcCtrPointG = []
const dcLabelsG = []
// control polygons
dcPolygonsG.push(controlPolygon(polygonsG, cPoints[0], pStrokeWidth, colors[2], 'ctrPoly-C'))
dcPolygonsG.push(controlPolygon(polygonsG, ptLeft, pStrokeWidth, colors[3], 'ctrPoly-left'))
dcPolygonsG.push(controlPolygon(polygonsG, ptRight, pStrokeWidth, colors[4], 'ctrPoly-left'))
nConfig.fillColor = colors[5]
nConfig.className = nConfig.className + '-C'
dcCtrPointG.push(controlPoints(ctPointsG, cPoints[0], nConfig))
nConfig.fillColor = colors[6]
nConfig.className = nConfig.className + '-left'
dcCtrPointG.push(controlPoints(ctPointsG, ptLeft, nConfig))
nConfig.fillColor = colors[7]
nConfig.className = nConfig.className + '-right'
dcCtrPointG.push(controlPoints(ctPointsG, ptRight, nConfig))
tConfig.fColor = colors[5]
tConfig.className = tConfig.className + '-C'
dcLabelsG.push(labels(ctPointsG, [cPoints[0][1], cPoints[0][2]], tConfig))
tConfig.fColor = colors[6]
tConfig.className = tConfig.className + '-left'
dcLabelsG.push(labels(ctPointsG, ptLeft, tConfig))
tConfig.fColor = colors[7]
tConfig.className = tConfig.className + '-right'
dcLabelsG.push(labels(ctPointsG, ptRight, tConfig))

function redraw() {
    deCasteljauPoints(cPoints, cPoints[0], s, t, u)
    bezierLeftG
        .attr('d', lineGenerator(bezierCurve(ptLeft, s, t, N)))    
    bezierRightG
        .attr('d', lineGenerator(bezierCurve(ptRight, s, t, N)))    
    dcPolygonsG[0]
        .attr('d', cpGenerator(cPoints[0]))
    dcPolygonsG[1]
        .attr('d', cpGenerator(ptLeft))
    dcPolygonsG[2]
        .attr('d', cpGenerator(ptRight))
    dcCtrPointG.forEach( g => {
        g
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
    })
    dcLabelsG.forEach( g => {
        g
            .attr('x', d => d.x + textOffsetX)
            .attr('y', d => d.y + textOffsetY)   
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
// compute and names all control points at all levels
// of the de Casteljau algorithm
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
`
const hlPre = d3.select('#hl-code').append('pre')
const hlCod = hlPre.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cText)