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
import { colorsDos as colors } from '../common/colors.js'
import { rationalBezierCurve } from '../bezier/bezier.js'

// Problem
const points = [
    {x: 0.05,y: 0.72, id: 1, drag: true, name: 'b0'},
    {x: 0.25,y: 0.88, id: 2, drag: true, name: 'b1'},
    {x: 0.56,y: 0.83, id: 3, drag: true, name: 'b2'},
    {x: 0.77,y: 0.50, id: 4, drag: true, name: 'b3'},
    {x: 0.66,y: 0.20, id: 5, drag: true, name: 'b4'},
    {x: 0.32,y: 0.06, id: 6, drag: true, name: 'b5'}
]
const weights = [1,1,1,1,1,1]
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
const degree = points.length - 1

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

const bezierG = polynomialCurve(
    curvesG, 
    rationalBezierCurve(points, weights, s, t, N), 
    cStrokeWidth, 
    colors[0], 
    'rational-bezier-curve'
    )
const ctrPolG = controlPolygon(polygonsG, points, pStrokeWidth, colors[1], 'ctrPolygon')
const ctrPotG = controlPoints(ctPointsG, points, nConfig)
const labelsG = labels(ctPointsG, points, tConfig)


function redraw() {
    const samplesB = rationalBezierCurve(points, weights, s, t, N)
    bezierG
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
for (let i = 1; i <= degree; i++) {
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

const cText = `
// Rational de Casteljau algorithm
function rationalDeCasteljau(points, weights, s, t, u) {
    const w = weights.map( e => e )
    const b = points.map( (p,i) => { return {x: w[i] * p.x, y: w[i] * p.y} } ) //[]
    const n = points.length - 1;
    for (let j = 1; j <= n; j++) {
        for (let i = 0; i <= n-j; i++) {
            b[i].x = ((t-u) * b[i].x + (u-s) * b[i+1].x) / (t-s)
            b[i].y = ((t-u) * b[i].y + (u-s) * b[i+1].y) / (t-s)
            w[i] = ((t-u) * w[i] + (u-s) * w[i+1]) / (t-s)
      }
    }
    return { x: b[0].x / w[0], y: b[0].y / w[0] }
}
`
const hlPre = d3.select('#hl-code').append('pre')
const hlCod = hlPre.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cText)