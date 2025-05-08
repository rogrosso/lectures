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
import {deCasteljau, bezierCurve, continuity} from './bezier.js'
import { colorsDos as colors } from '../common/colors.js'

const width = 500 // canvas  width
const height = 500 // canvas height
const bColor = colors[0]
const cColor = colors[1]
const cStrokeWidth = 1.5 // curve line width
const pStrokeWidth = 1.5 // control polygon line width
const nodeColorB =  colors[0]
const nodeColorC =  colors[1]
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

const degree = 3
const bPoints = [
    { x: 0.05, y: 0.6, drag: true, id: 0, name: 'b0', side: 1 }, 
    { x: 0.15, y: 0.2, drag: true, id: 1, name: 'b1', side: 1 }, 
    { x: 0.2,  y: 0.1, drag: true, id: 2, name: 'b2', side: 1 }, 
    { x: 0.3,  y: 0.1, drag: true, id: 3, name: 'b3', side: 1 }
    ]

const cPoints = [
    { x: 0.3,  y: 0.1,  drag: false, id: 4, name: 'c0', side: 2 }, 
    { x: 0.6,  y: 0.2,  drag: true,  id: 5, name: 'c1', side: 2 }, 
    { x: 0.8,  y: 0.5,  drag: true,  id: 6, name: 'c2', side: 2 }, 
    { x: 0.95, y: 0.95, drag: true,  id: 7, name: 'c3', side: 2 }
    ]

const contCondition = {
    c0: true,
    c1: false,
    c2: false,
    r: 0,
    s: 1,
    t: 2
}

bPoints.forEach( p => {
    p.x = xScale(p.x)
    p.y = yScale(p.y)
})
cPoints.forEach( p => {
    p.x = xScale(p.x)
    p.y = yScale(p.y)
})
const N = 100 // sampling
let r = contCondition.r
let s = contCondition.s
let t = contCondition.t
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
const textOffsetX = 10
const textOffsetY = 10
const tConfig = {
    xOffset: textOffsetX, 
    yOffset: textOffsetY, 
    fontSize: 14, 
    fColor: '#635F5D', 
    className: 'nodeName'
}
const bCurve = polynomialCurve(curvesG, bezierCurve(bPoints, r, s, N), cStrokeWidth, bColor, 'bezierCurve_left') 
const cCurve = polynomialCurve(curvesG, bezierCurve(cPoints, s, t, N), cStrokeWidth, cColor, 'bezierCurve_right') 
const bPolyg = controlPolygon(polygonsG, bPoints, pStrokeWidth, bColor, 'controlPolygon_left')
const cPolyg = controlPolygon(polygonsG, cPoints, pStrokeWidth, cColor, 'controlPolygon_right')
nConfig.fillColor = nodeColorB
nConfig.className = 'controlPoint-B'
const bPoint = controlPoints(ctPointsG, bPoints, nConfig) 
nConfig.fillColor = nodeColorC
nConfig.className = 'controlPoint-C'
const cPoint = controlPoints(ctPointsG, cPoints, nConfig) 
const bLabel = labels(ctPointsG, bPoints, tConfig)
const cLabel = labels(ctPointsG, cPoints, tConfig)


function redraw() {
    continuity(bPoints, cPoints, contCondition)
    let r = contCondition.r
    let s = contCondition.s
    let t = contCondition.t
    bCurve.attr('d', lineGenerator(bezierCurve(bPoints, r, s, N)))
    cCurve.attr('d', lineGenerator(bezierCurve(cPoints, s, t, N)))
    bPolyg.attr('d', cpGenerator(bPoints)) 
    bPoint
        .attr('cx', d => d.x)    
        .attr('cy', d => d.y)    
    bLabel
        .attr('x', d => d.x + textOffsetX)
        .attr('y', d => d.y + textOffsetY)  
    cPolyg.attr('d', cpGenerator(cPoints)) 
    cPoint
        .attr('cx', d => d.x)    
        .attr('cy', d => d.y)    
    cLabel
        .attr('x', d => d.x + textOffsetX)
        .attr('y', d => d.y + textOffsetY)     
}

function dragstarted(event, d) {
    if (d.id !== 4 && d.drag === false) return
    redraw()
    d3.select(this)
        .attr('r', selNodeRadius)
        .attr('fill', selNodeColor)
        .attr('stroke', '#ff00ff')
        .attr('stroke-width', 3)
}
function dragged(event, d) {
    if (d.id === 4) {
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
d3.select('#c1-continuity').on('input', s => {
    let val = d3.select('#c1-continuity').property('checked')
    if (val) {
        contCondition.c1 = true
        cPoints[1].drag = false
    } else {
        contCondition.c1 = false
        cPoints[1].drag = true
    }
    if (!val && d3.select('#c2-continuity').property('checked')) {
        d3.select('#c2-continuity').property('checked', false)
        contCondition.c2 = false
        cPoints[2].drag = true
    }
    redraw()
})
d3.select('#c2-continuity').on('input', s => {
    let val = d3.select('#c2-continuity').property('checked')
    if (val) {
        contCondition.c2 = true
        cPoints[2].drag = false
    } else {
        contCondition.c2 = false
        cPoints[2].drag = true
    }
    if (val && !d3.select('#c1-continuity').property('checked')) {
        d3.select('#c1-continuity').property('checked', true)
        contCondition.c1 = true
        cPoints[1].drag = false
    }
    redraw()
})
d3.select('#r-interval-1').on('input', s => {
    let val = d3.select('#r-interval-1').property('checked')
    if (val) {
        contCondition.t = 2
    }
    if (val && d3.select('#r-interval-2').property('checked')) {
        d3.select('#r-interval-2').property('checked', false)
    }
    if (!val && !d3.select('#r-interval-2').property('checked')) {
        d3.select('#r-interval-2').property('checked', true)
        contCondition.t = 3
    }
    redraw()
})
d3.select('#r-interval-2').on('input', s => {
    let val = d3.select('#r-interval-2').property('checked')
    if (val) {
        contCondition.t = 3 // 1.5
    }
    if (val && d3.select('#r-interval-1').property('checked')) {
        d3.select('#r-interval-1').property('checked', false)
    }
    if (!val) {
        d3.select('#r-interval-1').property('checked', true)
        contCondition.t = 2
    }
    redraw()
})
const animation = d3.select('#animation_c').on('click', function() {
    const cont = contCondition
    let u = 0
    let p = null
    if ( u <= cont.s ) {
        p = deCasteljau(bPoints, cont.r, cont.s, u)
    } else {
        p = deCasteljau(cPoints, cont.s, cont.t, u)
    }
    const radius = nodeRadius + 2
    const fColor = 'red'
    const sColor = nStrokeColor
    d3.select('.moving-circle').remove()
    const movingG = ctPointsG.append('g')
        .attr('class','moving-circle')
        .selectAll('circle')
        .data([null])
        .join('circle')
            .attr('r', radius)
            .attr('cx', p[0])
            .attr('cy', p[1])
            .attr('fill', fColor)
            .attr('stroke', sColor)
            .attr('stroke-width', 1.5)
            .transition()
            .duration(5000)
            .tween('moving-point', function(d) {
                return function(parameter) {
                    const pos = cont.r + parameter * (cont.t - cont.r)
                    let p = null
                    if (pos < cont.s) {
                        p = deCasteljau(bPoints, cont.r, cont.s, pos)
                    } else {
                        p = deCasteljau(cPoints, cont.s, cont.t, pos)
                    }
                    d3.select(this)
                        .attr('cx', p.x)
                        .attr('cy', p.y)
                    if (parameter === 1) d3.select(this).transition().duration(2000).attr('opacity', 0)

                }
            })
})


const cText = `
// Continuity between two Bézier curves
function continuity(b, c, cond) {
    if (cond.c0 === true) {
        c[0].x = b[3].x
        c[0].y = b[3].y
    }
    const r = cond.r
    const s = cond.s
    const t = cond.t
    if (cond.c1 === true) {
        c[1].x = (s - t) / (s - r) * b[2].x + (t - r) / (s - r) * b[3].x
        c[1].y = (s - t) / (s - r) * b[2].y + (t - r) / (s - r) * b[3].y
    }
    if (cond.c2 === true) {
        const r = cond.r
        const s = cond.s
        const t = cond.t
        const t1x = (s - t) / (s - r) * b[1].x + (t - r) / (s - r) * b[2].x
        const t1y = (s - t) / (s - r) * b[1].y + (t - r) / (s - r) * b[2].y
        const t2x = (s - t) / (s - r) * b[2].x + (t - r) / (s - r) * b[3].x
        const t2y = (s - t) / (s - r) * b[2].y + (t - r) / (s - r) * b[3].y
        c[2].x = (s - t) / (s - r) * t1x + (t - r) / (s - r) * t2x
        c[2].y = (s - t) / (s - r) * t1y + (t - r) / (s - r) * t2y
    }
}
`
const hlPre = d3.select('#hl-code').append('pre')
const hlCod = hlPre.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cText)