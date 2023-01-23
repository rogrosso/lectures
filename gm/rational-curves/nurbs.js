import * as d3 from 'd3'
// common
import {axes, polynomialCurve, controlPolygon, controlPoints, labels, lineGenerator, cpGenerator} from 'draw'
import { nurbsCurve, knotVector } from 'bsplines'
import { colorsDos as colors } from 'colors'

// Problem
/*
const points = [
    {x: 0.05,y: 0.72, id: 1, drag: true, name: 'b0'},
    {x: 0.25,y: 0.88, id: 2, drag: true, name: 'b1'},
    {x: 0.56,y: 0.83, id: 3, drag: true, name: 'b2'},
    {x: 0.77,y: 0.50, id: 4, drag: true, name: 'b3'},
    {x: 0.66,y: 0.20, id: 5, drag: true, name: 'b4'},
    {x: 0.32,y: 0.06, id: 6, drag: true, name: 'b5'}
]
*/
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
const weights = [1,1,1,1,1,1,1,1,1]
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
    className: 'axes'
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
const N = 100
const m = points.length
const degree = 3
const offset = 1
const uFlag = true
const mu = 1
let eFlag = false
let t = knotVector(degree, m, mu, eFlag, uFlag, offset)

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
    className: 'control-point'
}

const nurbsG = polynomialCurve(
    curvesG, 
    nurbsCurve(points, weights, degree, t, N),
    cStrokeWidth, 
    colors[0], 
    'rational-bspline-curve'
    )
const ctrPolG = controlPolygon(polygonsG, points, pStrokeWidth, colors[1], 'ctrPolygon')
const ctrPotG = controlPoints(ctPointsG, points, nConfig)
const labelsG = labels(ctPointsG, points, tConfig)


function redraw() {
    const samplesB = nurbsCurve(points, weights, degree, t, N)
    nurbsG
        .attr('d', lineGenerator(samplesB))    
    ctrPolG
        .attr('d', cpGenerator(points) )
    ctrPotG
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
    labelsG
        .attr('x', d => d.x + textOffsetX)
        .attr('y', d => d.y + textOffsetY)   
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
const wSliders = []
for (let i = 1; i < (m-1); i++) {
    const valName = '#w'+i+'-value'
    const idName = '#rationalBezier_w'+i
    wSliders.push(
        d3.select(idName).on('input', function() {
            weights[i] = +this.value
            d3.select(valName).text(weights[i].toFixed(0))
            redraw()
        })
    )
}
const endPtCheckbox = d3.select('#endpoint_interpolation').on('change', function() {
    eFlag = this.checked
    t = knotVector(degree, m, mu, eFlag, uFlag, 1)
    redraw()
})


const cText = `
// Rational de Boor algorithm
function rationalDeBoor(n,j,t,u,points, weights) {
    const f = []
    const w = []
    for (let i = 0; i <= n; ++i) {
        const weight = weights[j-n+i]
        w.push( weight )
        f.push({x: weight * points[j-n + i].x, y: weight * points[j-n + i].y})
    }
    for (let k = 1; k <= n; ++k) {
        for (let i = n; i >= k; --i) {
            const a = (t[j + i + 1 - k] - u) / (t[j + i + 1 - k] - t[j + i - n])
            const b = (u - t[j + i - n]) / (t[j + i + 1 - k] - t[j + i - n])
            f[i].x = a * f[i-1].x + b * f[i].x
            f[i].y = a * f[i-1].y + b * f[i].y
            w[i] = a * w[i-1] + b * w[i]
        }
    }
    return { x: f[n].x / w[n], y: f[n].y / w[n] }
}
`
const hlPre = d3.select('#hl-code').append('pre')
const hlCod = hlPre.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cText)