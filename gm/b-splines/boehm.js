// common
import { 
    axes, 
    polynomialCurve, 
    controlPolygon,
    controlPoints,
    labels,
    lineGenerator, 
    cpGenerator } from '../common/draw.js'
import { colorsDos as colors } from '../common/colors.js'
import { bSplineCurve, knotVector, boehm } from './bsplines.js'

const width = 500 // canvas  width
const height = 500 // canvas height
const cStrokeWidth = 1.5 // curve line width
const pStrokeWidth = 1.5 // control polygon line width
const nodeColor =  '#f5deb3' // node fill color
const nodeColorB = '#FF7F50' // node fill color, Boehm
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
    className: 'axesMultipleKnot',
    fontSize: 12
}
const aG = axes(aConfig)

const points = [
    {x: 0.05, y: 0.72, id: 0, drag: true, name: 'd0'},
    {x: 0.25, y: 0.88, id: 1, drag: true, name: 'd1'},
    {x: 0.56, y: 0.83, id: 2, drag: true, name: 'd2'},
    {x: 0.77, y: 0.50, id: 3, drag: true, name: 'd3'},
    {x: 0.75, y: 0.20, id: 4, drag: true, name: 'd4'},
    {x: 0.62, y: 0.06, id: 5, drag: true, name: 'd5'},
    {x: 0.41, y: 0.46, id: 6, drag: true, name: 'd6'},
    {x: 0.27, y: 0.47, id: 7, drag: true, name: 'd7'},
    {x: 0.10, y: 0.25, id: 8, drag: true, name: 'd8'}
    ]
points.forEach( p => {
    p.x = xScale(p.x)
    p.y = yScale(p.y)
})
const N = 100
let eFlag = false // endpoint interpolation
let uFlag = false // uniform knot vector
let mu = 1 // multiplicity
let degree = 3
const m = points.length 
let t = knotVector(degree, m, mu, eFlag, uFlag, 1)
const bsplineG = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
const ctPolygG = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
const ctPointG = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
const ctLabelG = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

// Input B-spline curve
const curveG = polynomialCurve(
    bsplineG, 
    bSplineCurve(points, degree, t, N), 
    cStrokeWidth, 
    colors[0], 
    'B-Spline-Curve')
const ctPolG = controlPolygon(ctPolygG, points, cStrokeWidth, colors[1], 'control-polygon')
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
const ctPtsG = controlPoints(ctPointG, points, nConfig) 
const textOffsetX = 10
const textOffsetY = 10
const tConfig = {
    xOffset: textOffsetX, 
    yOffset: textOffsetY, 
    fontSize: 12, 
    fColor: '#635F5D', 
    className: 'nodeName'
}
const ctLabG = labels(ctLabelG, points, tConfig) 

// Add a knot and compute new B-spline curve
const index = Math.floor((m - degree) / 3) + degree
const z = (t[index+1] + t[index]) / 2
const { knots, bPoints } = boehm(points, degree, t, z)
bPoints.forEach( (p, index) => {
    p.index = index + m
    p.drag = true
    p.name = 'd' + index
})
const curveGBoehm = polynomialCurve(
    bsplineG, 
    bSplineCurve(bPoints, degree, knots, N), 
    cStrokeWidth, 
    colors[2], 
    'B-Spline-Curve-Boehm')
const ctPolGBoehm = controlPolygon(ctPolygG, bPoints, cStrokeWidth, colors[3], 'control-polygon')
const nConfigB = { // control points: n for node
    className: 'controlPointBoehm',
    nodeRadius,
    fillColor: nodeColorB,
    strokeColor: nStrokeColor,
    strokeWidth: nStrokeWidth,
    dragstarted, 
    dragged, 
    dragend
}
const ctPtsGBoehm = controlPoints(ctPointG, bPoints, nConfigB) 
const textOffsetXBoehm = 10
const textOffsetYBoehm = 0
const tConfigB = {
    xOffset: textOffsetXBoehm, 
    yOffset: textOffsetYBoehm, 
    fontSize: 12, 
    fColor: '#5F9EA0', 
    className: 'nodeName'
}
const ctLabGBoehm = labels(ctLabelG, bPoints, tConfigB) 


const sels = { curveG, curveGBoehm, ctPolG, ctPolGBoehm, ctPtsG, ctPtsGBoehm, ctLabG, ctLabGBoehm }
function redraw(sels, t, knots, points, bPoints, N) {
    const { 
        curveG, 
        curveGBoehm, 
        ctPolG, 
        ctPolGBoehm, 
        ctPtsG, 
        ctPtsGBoehm, 
        ctLabG, 
        ctLabGBoehm 
    } = sels
    const offset = 1
    curveG.attr('d', lineGenerator(bSplineCurve(points, degree, t, N))) 
    curveGBoehm.attr('d', lineGenerator(bSplineCurve(bPoints, degree, knots, N))) 

    ctPolG.attr('d', cpGenerator(points)) 
    ctPolGBoehm.attr('d', cpGenerator(bPoints)) 

    ctPtsG
        .attr('cx', d => d.x)    
        .attr('cy', d => d.y)    
    ctPtsGBoehm
        .attr('cx', d => d.x)    
        .attr('cy', d => d.y)        
    ctLabG
        .attr('x', d => d.x + textOffsetX)
        .attr('y', d => d.y + textOffsetY)  
    ctLabGBoehm
        .attr('x', d => d.x + textOffsetXBoehm)
        .attr('y', d => d.y + textOffsetYBoehm)  
}

function dragstarted(event, d) {
    if (d.drag === false) return
    redraw(sels, t, knots, points, bPoints, N)
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
    redraw(sels, t, knots, points, bPoints, N)
}
function dragend(event, d) {
    redraw(sels, t, knots, points, bPoints, N)
    d3.select(this)
        .attr('r', nodeRadius)
        .attr('fill', nodeColor)
        .attr('stroke', nStrokeColor)
        .attr('stroke-width', nStrokeWidth)
}


const cText = `
//********************************************************************************************
// Boehm algorithm
export function boehm(points, n, t, z) {
    const m = points.length
    if (t[n] > z || z > t[m]) {
        return {knot: t, bPoints: points} // z is outside B-Spline's support
    } else { // new know vector
        let j = -1
        let knots = []
        t.forEach( (k,i) => {
            if (z < k && j < 0) {
                j = (i-1)
                knots.push(z)
            }
            knots.push(k)
        })
        const bPoints = new Array(points.length+1).fill(null).map((p, index) => {
            return {
                x: 0, 
                y: 0
            } 
        })
        bPoints.forEach( (p,i) => {
            if (i <= j - n) {
                p.x = points[i].x
                p.y = points[i].y
            } else if (j+1 <= i) {
                p.x = points[i-1].x
                p.y = points[i-1].y
            } else {
                const a = (t[i + n] - z) / (t[i + n] - t[i])
                const b = (z - t[i]) / (t[i + n] - t[i])
                p.x = a * points[i - 1].x + b * points[i].x
                p.y = a * points[i - 1].y + b * points[i].y
            }
        })
        return { knots, bPoints }
    }
} // Boehm()
`
const hlPre = d3.select('#hl-code').append('pre')
const hlCod = hlPre.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cText)