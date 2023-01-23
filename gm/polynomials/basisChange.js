import * as d3 from 'd3'
// common
import {axes, polynomialCurve, controlPolygon, controlPoints, labels, lineGenerator, cpGenerator} from 'draw'
import {bezierCurve} from 'bezier'
import gaussEliminationFactory from 'gaussEliminationFactory'

// Problem
// control points of a Bezier curve, that is 
// a polynomial curve given in terms of a basis
// with the Bernstein polynomials
const points = [
    [0.1,  0.1],
    [0.25, 0.8],
    [0.7,  0.9],
    [0.85, 0.2]
]

// we assume degree n = 3
function bernstein2Monomial(b) {
    const A = [
        [1,-3, 3,-1],
        [0, 3,-6, 3],
        [0, 0, 3,-3],
        [0, 0, 0, 1]
    ]
    const a = new Array(4).fill(0).map( e => new Array(2).fill(0))
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            a[i][0] += A[j][i] * b[j][0]
            a[i][1] += A[j][i] * b[j][1]
        }
    }
    return a
}

// we assume degree n = 3
function monomial2Bernstein(a) {
    const A = [
        [1,-3, 3,-1],
        [0, 3,-6, 3],
        [0, 0, 3,-3],
        [0, 0, 0, 1]
    ]
    const g = gaussEliminationFactory()
    const Ainv = g.inverse(A)
    const b = new Array(4).fill(0).map( e => new Array(2).fill(0))
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            b[i][0] += Ainv[j][i] * a[j][0]
            b[i][1] += Ainv[j][i] * a[j][1]
        }
    }
    return b
}


///////////////////////////////////////////////////////////////////////////////
// Exercise
///////////////////////////////////////////////////////////////////////////////
const a = bernstein2Monomial(points) // coefficients in monimial basis
const b = monomial2Bernstein(a) // coefficients in Bernstein basis
const cPoints = b.map( (p,index) => { return {x: p[0], y: p[1], index: index, name: 'b'+index } })

const width = 500 // canvas  width
const height = 500 // canvas height
const bColor =   '#5F7186' //'#144847'  
const pColor = '#A0B700' //'#006400'
//const colMonomial = '#E3BA22' //'#A0B700'
const cStrokeWidth = 1.5 // curve line width
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
const s = 0
const t = 1
const N = 100
cPoints.forEach (p => {
    p.x = xScale(p.x)
    p.y = yScale(p.y)
})
const bezierG = polynomialCurve(curvesG, bezierCurve(cPoints, s, t, N), cStrokeWidth, bColor, 'bezier-curve')

// control polygon
const polygonG = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
const cpolygG = controlPolygon(polygonG, cPoints, cStrokeWidth, pColor, 'control-polygon') 

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
const cpointsG = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
const nodesG = controlPoints(cpointsG, cPoints, nConfig)

const textOffsetX = 10
const textOffsetY = 10
const tConfig = {
    xOffset: textOffsetX, 
    yOffset: textOffsetY, 
    fontSize: 14, 
    fColor: '#635F5D', 
    className: 'nodeName'
}
const labelsG = labels(cpointsG, cPoints, tConfig) 

function redraw() {
    //const r = bernstein2Monomial(points) // coefficients in monimial basis
    //const s = monomial2Bernstein(a) // coefficients in Bernstein basis
    //const pts = b.map( (p,index) => { return {x: p[0], y: p[1], index: index, name: 'b'+index } })  
    const samplesB = bezierCurve(cPoints, s, t, N)
    bezierG
        .attr('d', lineGenerator(samplesB))    
    cpolygG
        .attr('d', cpGenerator(cPoints))
    nodesG
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
    labelsG
        .attr('x', d => d.x + textOffsetX)
        .attr('y', d => d.y + textOffsetY)    
}
function dragstarted(event, d) {
    redraw()
    if (d.drag === false) return
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


const cText = `
// we assume degree n = 3
// Bezier control points from monomial representation
function bernstein2Monomial(b) {
    const A = [
        [1,-3, 3,-1],
        [0, 3,-6, 3],
        [0, 0, 3,-3],
        [0, 0, 0, 1]
    ]
    const a = new Array(4).fill(0).map( e => new Array(2).fill(0))
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            a[i][0] += A[j][i] * b[j][0]
            a[i][1] += A[j][i] * b[j][1]
        }
    }
    return a
}
// we assume degree n = 3
// Monomial representation from control points of the Bezier curve
function monomial2Bernstein(a) {
    const A = [
        [1,-3, 3,-1],
        [0, 3,-6, 3],
        [0, 0, 3,-3],
        [0, 0, 0, 1]
    ]
    const Ainv = inverse(A)
    const b = new Array(4).fill(0).map( e => new Array(2).fill(0))
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            b[i][0] += Ainv[j][i] * a[j][0]
            b[i][1] += Ainv[j][i] * a[j][1]
        }
    }
    return b
}
`
const hlPre = d3.select('#hl-code').append('pre')
const hlCod = hlPre.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cText)