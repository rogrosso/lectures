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
import { bezierCurve } from '../bezier/bezier.js'

const width = 500 // canvas  width
const height = 500 // canvas height
const bColor = colors[0]
const cColor = colors[1]
const tColor = colors[2]
const cStrokeWidth = 1.5 // curve line width
const pStrokeWidth = 1.5 // control polygon line width
const nodeColorB =  colors[0]
const nodeColorC =  colors[1]
const nodeColorT = colors[2]
const nStrokeColor = '#2f4f4f' // color of stroke for nodes
const nStrokeWidth = 1.5 // width of stroke for nodes
const selNodeColor = '#00ffff' // color for selected nodes
const nodeRadius = 5 // radius for unselected nodes
const selNodeRadius = 8 // radius for selected nodes
const labelColorb = colors[3]
const labelColorc = colors[4]
const labelColort = colors[5]
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

const degree = 3
let beta1 = 1
let beta2 = 1
const bPoints = [   
    {x: 0.05, y: 0.8,  id: 1, drag: true, name: 'b0', side: 1},
    {x: 0.1,  y: 0.35, id: 2, drag: true, name: 'b1', side: 1},
    {x: 0.2,  y: 0.2,  id: 3, drag: true, name: 'b2', side: 1},
    {x: 0.35, y: 0.2,  id: 4, drag: true, name: 'b3', side: 1}
]
const cPoints = [
    {x: 0.35, y: 0.2,  id: 5, drag: true,  name: 'c0', side: 2},
    {x: 0.6,  y: 0.45, id: 6, drag: false, name: 'c1', side: 2},
    {x: 0.8,  y: 0.5,  id: 7, drag: false, name: 'c2', side: 2},
    {x: 0.95, y: 0.95, id: 8, drag: true,  name: 'c3', side: 2}
]
let t = { x: 0, y: 0, id: 9, drag: false, name: 't', side: 0}
const aframe = [bPoints[2], t, cPoints[1]]

bPoints.forEach( p => {
    p.x = xScale(p.x)
    p.y = yScale(p.y)
})
cPoints.forEach( p => {
    p.x = xScale(p.x)
    p.y = yScale(p.y)
})
const N = 100 // sampling
const t0 = 0
const t1 = 1
const t2 = 2
const nConfig = { // control points: n for node
    className: 'controlPoint-B',
    nodeRadius,
    fillColor: nodeColorB,
    strokeColor: nStrokeColor,
    strokeWidth: nStrokeWidth,
    dragstarted, 
    dragged, 
    dragend
}
const textOffsetXb = -21
const textOffsetYb = 15
const textOffsetXc = 5
const textOffsetYc = 15
const textOffsetXt = 10
const textOffsetYt = 10
const tConfig = {
    xOffset: textOffsetXb, 
    yOffset: textOffsetYb, 
    fontSize: 14, 
    fColor: labelColorb, 
    className: 'nodeName'
}
continuity(degree, bPoints, cPoints, t, beta1, beta2)
const bCurve = polynomialCurve(curvesG, bezierCurve(bPoints, t0, t1, N), cStrokeWidth, bColor, 'bezierCurve_left') 
const cCurve = polynomialCurve(curvesG, bezierCurve(cPoints, t1, t2, N), cStrokeWidth, cColor, 'bezierCurve_right') 
const bPolyg = controlPolygon(polygonsG, bPoints, pStrokeWidth, bColor, 'controlPolygon_left')
const cPolyg = controlPolygon(polygonsG, cPoints, pStrokeWidth, cColor, 'controlPolygon_right')
const tPolyg = controlPolygon(polygonsG, aframe, pStrokeWidth, tColor, 'controlPolygon_aframe')
nConfig.fillColor = nodeColorB
nConfig.className = 'controlPoint-B'
const bPoint = controlPoints(ctPointsG, bPoints, nConfig) 
nConfig.fillColor = nodeColorC
nConfig.className = 'controlPoint-C'
const cPoint = controlPoints(ctPointsG, cPoints, nConfig) 
nConfig.fillColor = nodeColorT
nConfig.className = 'controlPoint-t'
const tPoint = controlPoints(polygonsG, [t], nConfig) 
const bLabel = labels(ctPointsG, bPoints, tConfig)
tConfig.xOffset = textOffsetXc
tConfig.yOffset = textOffsetYc
tConfig.fillColor = labelColorc
const cLabel = labels(ctPointsG, cPoints, tConfig)
tConfig.xOffset = textOffsetXt
tConfig.yOffset = textOffsetYt
tConfig.fillColor = labelColort
tConfig.fontSize = 16
const tLabel = labels(ctPointsG, [t], tConfig)


function redraw() {
    continuity(degree, bPoints, cPoints, t, beta1, beta2)
    bCurve.attr('d', lineGenerator(bezierCurve(bPoints, t0, t1, N)))
    cCurve.attr('d', lineGenerator(bezierCurve(cPoints, t1, t2, N)))
    bPolyg.attr('d', cpGenerator(bPoints)) 
    bPoint
        .attr('cx', d => d.x)    
        .attr('cy', d => d.y)    
    bLabel
        .attr('x', d => d.x + textOffsetXb)
        .attr('y', d => d.y + textOffsetYb)  
    cPolyg.attr('d', cpGenerator(cPoints)) 
    cPoint
        .attr('cx', d => d.x)    
        .attr('cy', d => d.y)    
    cLabel
        .attr('x', d => d.x + textOffsetXc)
        .attr('y', d => d.y + textOffsetYc)    
    tPolyg.attr('d', cpGenerator(aframe)) 
    tPoint
        .attr('cx', d => d.x)    
        .attr('cy', d => d.y)    
    tLabel
        .attr('x', d => d.x + textOffsetXt)
        .attr('y', d => d.y + textOffsetYt)             
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
    if (d.id === 4 || d.id === 5) {
        bPoints[3].x = event.x
        bPoints[3].y = event.y
    } else {
        if (d.drag === false) return
        event.subject.x = event.x
        event.subject.y = event.y
    }
    redraw()
}
function dragend(event, d) {
    redraw()
    d3.select(this)
        .attr('r', nodeRadius)
        .attr('fill', d => {
            if (d.side === 1) return nodeColorB
            else return nodeColorC
        })
        .attr('stroke', nStrokeColor)
        .attr('stroke-width', nStrokeWidth)
}

// callbacks
const wSliders = []
wSliders.push(
    d3.select('#beta1_continuity').on('input', function() {
        beta1 = +this.value
        d3.select('#beta1_value').text(beta1.toFixed(1))
        redraw()
    })
)
wSliders.push(
    d3.select('#beta2_continuity').on('input', function() {
        beta2 = +this.value
        d3.select('#beta2_value').text(beta2.toFixed(1))
        redraw()
    })
)

function continuity(n, b, c, t, beta1, beta2) {
    c[0].x = b[n].x
    c[0].y = b[n].y
    c[1].x = b[n].x + beta1 * (b[n].x - b[n-1].x)
    c[1].y = b[n].y + beta1 * (b[n].y - b[n-1].y)
    const gamma = (1+beta1) / (beta1 + beta1**2 + beta2/2)
    t.x = b[n-1].x + beta1**2 * gamma * (b[n-1].x - b[n-2].x)
    t.y = b[n-1].y + beta1**2 * gamma * (b[n-1].y - b[n-2].y)
    c[2].x = c[1].x + 1/gamma * (c[1].x - t.x)
    c[2].y = c[1].y + 1/gamma * (c[1].y - t.y)
}

const cText = `
// Geometric C^2 continuity for Bézier splines
function continuity(n, b, c, t, beta1, beta2) {
    c[0].x = b[n].x
    c[0].y = b[n].y
    c[1].x = b[n].x + beta1 * (b[n].x - b[n-1].x)
    c[1].y = b[n].y + beta1 * (b[n].y - b[n-1].y)
    const gamma = (1+beta1) / (beta1 + beta1**2 + beta2/2)
    t.x = b[n-1].x + beta1**2 * gamma * (b[n-1].x - b[n-2].x)
    t.y = b[n-1].y + beta1**2 * gamma * (b[n-1].y - b[n-2].y)
    c[2].x = c[1].x + 1/gamma * (c[1].x - t.x)
    c[2].y = c[1].y + 1/gamma * (c[1].y - t.y)
}
`
const hlPre = d3.select('#hl-code').append('pre')
const hlCod = hlPre.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cText)