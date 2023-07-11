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
import { bSplineCurve, knotVector } from './bsplines.js'

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

const sels = { curveG, ctPolG, ctPtsG, ctLabG }
function redraw(sels, t, points) {
    const { curveG, ctPolG, ctPtsG, ctLabG } = sels
    const N = 100
    const offset = 1
    curveG.attr('d', lineGenerator(bSplineCurve(points, degree,t, N))) 
    ctPolG.attr('d', cpGenerator(points)) 
    ctPtsG
        .attr('cx', d => d.x)    
        .attr('cy', d => d.y)    
    ctLabG
        .attr('x', d => d.x + textOffsetX)
        .attr('y', d => d.y + textOffsetY)  

}

function dragstarted(event, d) {
    if (d.drag === false) return
    redraw(sels, t, points)
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
    redraw(sels, t, points)
}
function dragend(event, d) {
    redraw(sels, t, points)
    d3.select(this)
        .attr('r', nodeRadius)
        .attr('fill', nodeColor)
        .attr('stroke', nStrokeColor)
        .attr('stroke-width', nStrokeWidth)
}

const degrSlider = d3.select('#bspline_degree_slider').on('input', function() {
    degree = +this.value
    d3.select('#degree_value').text(degree)
    d3.select('#bspline_degree_slider').property('value', degree)
    // update gui
    if (mu > degree){
        mu = degree
        d3.select('#multiplicity_value').text(mu)
        d3.select('#bspline_multiplicity_slider').property('value', mu)
    }
    d3.select('#bspline_multiplicity_slider').property('max', degree)
    t = knotVector(degree, m, mu, eFlag, uFlag, 1)
    redraw(sels, t, points)
})
const multSlider = d3.select('#bspline_multiplicity_slider').on('input', function() {
    mu = +this.value
    d3.select('#multiplicity_value').text(mu)
    d3.select('#bspline_multiplicity_slider').property('value', mu)
    t = knotVector(degree, m, mu, eFlag, uFlag, 1)
    redraw(sels, t, points)
})
const uniformCheckbox = d3.select('#uniform_knot').on('change', function() {
    uFlag = this.checked
    t = knotVector(degree, m, mu, eFlag, uFlag, 1)
    redraw(sels, t, points)
})
const endPtCheckbox = d3.select('#endpoint_interpolation').on('change', function() {
    eFlag = this.checked
    t = knotVector(degree, m, mu, eFlag, uFlag, 1)
    redraw(sels, t, points)
})

const cText = `
//********************************************************************************************
// deBohr algorithm: recursive
function deBoorRecursive(points, n, t, k, i, u) {
    if (k === 0) {
      return points[i]
    } else {
        const a = (t[i + n + 1 - k] - u) / (t[i + n + 1 - k] - t[i])
        const b = (u - t[i]) / (t[i + n + 1 - k] - t[i])
        let d0 = deBoorRecursive(n, k - 1, i - 1, t, u, points)
        let d1 = deBoorRecursive(n, k - 1, i, t, u, points)
        return [a * d0[0] + b * d1[0], a * d0[1] + b * d1[1]]
    }
}
//********************************************************************************************
// deBohr algorithm: iterative
function deBoorIterative (points, n, t, j, u) {
    const f = []
    for (let i = 0; i <= n; ++i) {
        f.push({ x: points[j-n + i].x, y: points[j-n + i].y })
    }
    for (let k = 1; k <= n; ++k) {
        for (let i = n; i >= k; --i) {
            const a = (t[j + i + 1 - k] - u) / (t[j + i + 1 - k] - t[j + i - n])
            const b = (u - t[j + i - n]) / (t[j + i + 1 - k] - t[j + i - n])
            f[i].x = a * f[i-1].x + b * f[i].x
            f[i].y = a * f[i-1].y + b * f[i].y
        }
    }
    return f[n]
}
`
const hlPre = d3.select('#hl-code').append('pre')
const hlCod = hlPre.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cText)