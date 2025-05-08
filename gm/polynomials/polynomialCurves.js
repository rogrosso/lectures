// common
import {axes, polynomialCurve, controlPoints, labels, lineGenerator} from '../common/draw.js'
import {bezierCurve} from '../bezier/bezier.js'


// Problem
const points = [
    { t: 0  , x: 0.8, y: 0.1, drag: true, id: 0, name: 'A' }, 
    { t: 1/3, x: 0.2, y: 0.3, drag: true, id: 1, name: 'B' }, 
    { t: 2/3, x: 0.2, y: 0.6, drag: true, id: 2, name: 'C' }, 
    { t: 1  , x: 0.8, y: 0.9, drag: true, id: 3, name: 'D' }
]

const width = 500
const height = 500
const colBezier =   '#5F7186' //'#144847'
const colLagrange = '#A0B700' //'#006400'
const colMonomial = '#E3BA22' //'#A0B700'
const cStrokeWidth = 1.5
const nodeColor =  '#f5deb3'
const nStrokeColor = '#2f4f4f'
const nStrokeWidth = 1.5
const selNodeColor = '#00ffff'
const nodeRadius = 5
const selNodeRadius = 8


const margin = { top: 35, bottom: 25, left: 40, right: 20}
const innerWidth = width - margin.left - margin.right
const innerHeight = height - margin.top - margin.bottom

const svg = d3.selectAll("#d3js_canvas")
    .append('svg')
    .attr('width', width)
    .attr('height', height)
const textX = 10
const textY = 5
const offsetX = 15
let textPos = textX
const titleG = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${20})`)
const titleBezier = titleG.append('g')
    .append('text')
    .attr('x', textPos)
    .attr('y', textY)
    .attr('font-size', 20)
    .attr('font-family', 'sans-serif')
    .attr('font-weight', 'normal')
    .attr('fill', colBezier)
    .text('Bezier')
textPos += titleBezier.node().getComputedTextLength() + offsetX
const titleLagrange = titleG.append('g')
    .append('text')
    .attr('x', textPos)
    .attr('y', textY)
    .attr('font-size', 20)
    .attr('font-family', 'sans-serif')
    .attr('font-weight', 'normal')
    .attr('fill', colLagrange)
    .text('Lagrange')
textPos += titleLagrange.node().getComputedTextLength() + offsetX
const titleMonomial = titleG.append('g')
    .append('text')
    .attr('x', textPos)
    .attr('y', textY)
    .attr('font-size', 20)
    .attr('font-family', 'sans-serif')
    .attr('font-weight', 'normal')
    .attr('fill', colMonomial)
    .text('Monomial')

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
    className: 'axesPolyCurve'
}

const axisG = axes(aConfig)
//axisG.attr('transform', `translate(${margin.left}, ${margin.top})`)

const curvesG = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

const s = 0
const t = 1
const N = 100
const pts = points.map( p => { return { x: p.x, y: p.y }})
points.forEach (p => {
    p.x = xScale(p.x)
    p.y = yScale(p.y)
})
const lagrangeG = polynomialCurve(curvesG, lagrangePolynomial(points, N), cStrokeWidth, colLagrange, 'lagrangePol')
const bezierG = polynomialCurve(curvesG, bezierCurve(points, s, t, N), cStrokeWidth, colBezier, 'bezierPol')
const monomialG = polynomialCurve(curvesG, monomialCurve(points, xScale, yScale), cStrokeWidth, colMonomial, 'monomialPol')

const controlPointsG = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

const nConfig = {
    className: 'controlPoint',
    nodeRadius,
    fillColor: nodeColor,
    strokeColor: nStrokeColor,
    strokeWidth: nStrokeWidth,
    dragstarted, 
    dragged, 
    dragend
}
const nodesG = controlPoints(controlPointsG, points, nConfig)

const textOffsetX = 10
const textOffsetY = 10
const tConfig = {
    xOffset: textOffsetX, 
    yOffset: textOffsetY, 
    fontSize: 14, 
    fColor: '#635F5D', 
    className: 'nodeName'
}
const labelsG = labels(controlPointsG, points, tConfig) 

function redraw() {
    const samplesL = lagrangePolynomial(points, N)
    lagrangeG
        .attr('d', lineGenerator(samplesL))

    const samplesB = bezierCurve(points, s, t, N)
    bezierG
        .attr('d', lineGenerator(samplesB))    

    const samplesM = monomialCurve(points, xScale, yScale)
    monomialG
        .attr('d', lineGenerator(samplesM))    
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

// Geometry
function neville(points, u) {
    const n = points.length
    const t = []
    const l = []
    points.forEach( p => {
        t.push(p.t)
        l.push({x: p.x, y: p.y})
    })
    for (let i = 1; i < n; i++) {
        for (let j = 0; j < n-i; j++) {
            l[j].x = ( (u - t[j]) * l[j+1].x - (u - t[j+i]) * l[j].x ) / (t[j+i] - t[j])
            l[j].y = ( (u - t[j]) * l[j+1].y - (u - t[j+i]) * l[j].y ) / (t[j+i] - t[j])
        }
    }
    return l[0]
}
function horner(points, u) {
    const n = points.length
    let v = points[n-1].x
    let w = points[n-1].y
    for (let i = n-2; i >= 0; i--)
    {
        v = v * u + points[i].x
        w = w * u + points[i].y
    }
    return {x: v, y: w}
}
function lagrangePolynomial(points, N) {
    const t0 = points[0].t
    const t1 = points[points.length - 1].t
    const dt = (t1 - t0) / (N - 1)
    let u = 0
    const curve = []
    const b = points.map( p => { return {t: p.t, x: p.x, y: p.y } })
    for (let i = 0; i < N; i++) {
        curve.push(neville(b, u))
        u += dt
    }
    return curve
}

function clip(val) {
    return 0 <= val.x && val.x <= 1 && 0 <= val.y && val.y <= 1
}
function monomialCurve(points, xScale, yScale)  {
    const t0 = points[0].t
    const t1 = points[points.length - 1].t
    const N = 100
    const dt = (t1 - t0) / (N - 1)
    let u = 0
    const curve = []
    //const cpts = []
    //points.forEach( p => cpts.push({t: p.t, x: xScale.invert(p.x), y: yScale.invert(p.y) }) )
    const b = points.map( p => { return { x: xScale.invert(p.x), y: yScale.invert(p.y) } })
    for (let i = 0; i < N; i++) {
        const val = horner(b,u)
        if (clip(val)) curve.push({ x: xScale(val.x), y: yScale(val.y) } )
        u += dt
    }
    return curve
}

// Add code to html page
const cTextN = `
function neville(points, u) {
    const n = points.length
    const t = []
    const l = []
    points.forEach( p => {
        t.push(p.t)
        l.push({x: p.x, y: p.y})
    })
    for (let i = 1; i < n; i++) {
        for (let j = 0; j < n-i; j++) {
            l[j].x = ( (u - t[j]) * l[j+1].x - (u - t[j+i]) * l[j].x ) / (t[j+i] - t[j])
            l[j].y = ( (u - t[j]) * l[j+1].y - (u - t[j+i]) * l[j].y ) / (t[j+i] - t[j])
        }
    }
    return l[0]
}
`
const cTextH = `
function horner(points, u) {
    const n = points.length
    let v = points[n-1].x
    let w = points[n-1].y
    for (let i = n-2; i >= 0; i--)
    {
        v = v * u + points[i].x
        w = w * u + points[i].y
    }
    return {x: v, y: w}
}
`
const hlPreN = d3.select('#hl-code-N').append('pre')
const hlCodN = hlPreN.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cTextN)
const hlPreH = d3.select('#hl-code-H').append('pre')
const hlCodH = hlPreH.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cTextH)
