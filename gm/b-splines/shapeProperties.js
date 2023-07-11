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
let cFlag = false // n coincident points
let aFlag = false // n aligned points
let a1Flag = false // n+1 aligned points
let mu = 1 // multiplicity
let uFlag = true
let eFlag = true
const offset = 1
let degree = 3
const m = points.length 
let t = knotVector(degree, m, mu, eFlag, uFlag, offset)
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
    curveG.attr('d', lineGenerator(bSplineCurve(points, degree, t, N))) 
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



const degSlider = d3.select('#bspline_degree_slider').on('input', function() {
    degree = +this.value
    d3.select('#degree_value').text(degree)
    d3.select('#bspline_degree_slider').property('value', degree)
    t = knotVector(degree, m, mu, eFlag, uFlag, offset)
    points.forEach( p => p.drag = true)
    if (cFlag) {
        for (let i = 2+1; i < 2+degree; i++) {
            points[i].x = points[2].x
            points[i].y = points[2].y
        }
    } else if (aFlag) {
        const index = degree - 1
        const du = 1 / (degree - 1)
        let u = du;
        for (let i = 1; i < index; i++) {
            points[2+i].x = points[2].x + u * (points[2+index].x - points[2].x)
            points[2+i].y = points[2].y + u * (points[2+index].y - points[2].y)
            points[2+i].drag = false
            u += du
        }
        points[2].drag = false
        points[2+index].drag = false
    } else if (a1Flag) {
        const index = degree
        const du = 1 / degree
        let u = du;
        for (let i = 1; i < index; i++) {
            points[2+i].x = points[2].x + u * (points[2+index].x - points[2].x)
            points[2+i].y = points[2].y + u * (points[2+index].y - points[2].y)
            points[2+i].drag = false
            u += du
        }
        points[2].drag = false
        points[2+index].drag = false
    }
    redraw(sels, t, points)
})

const nCoincident = d3.select('#n_coincident').on('change', function() {
    cFlag = this.checked
    if (aFlag || a1Flag) {
        this.checked = false
        cFlag = false
        return
    }
    if (cFlag) {
        for (let i = 2+1; i < 2+degree; i++) {
            points[i].x = points[2].x
            points[i].y = points[2].y
        }
    } else {
        const du = 1 / degree
        let u = du;
        for (let i = 1; i < degree; i++) {
            points[2+i].x = points[2].x + u * (points[2+degree].x - points[2].x)
            points[2+i].y = points[2].y + u * (points[2+degree].y - points[2].y)
            u += du
        }
    }
    redraw(sels, t, points)
})

const nAligned = d3.select('#n_aligned').on('change', function() {
    aFlag = this.checked
    if (cFlag || a1Flag) {
        this.checked = false
        aFlag = false
    } else {
        if (aFlag) {
            const index = degree - 1
            const du = 1 / (degree - 1)
            let u = du;
            for (let i = 1; i < index; i++) {
                points[2+i].x = points[2].x + u * (points[2+index].x - points[2].x)
                points[2+i].y = points[2].y + u * (points[2+index].y - points[2].y)
                points[2+i].drag = false
                u += du
            }
            points[2].drag = false
            points[2+index].drag = false
        } else {
            for (let i = 0; i < degree; i++) points[2+i].drag = true
        }

    }
    redraw(sels, t, points)
})

const n1Aligned = d3.select('#n_1_aligned').on('change', function() {
    a1Flag = this.checked
    if (cFlag || aFlag) {
        this.checked = false
        a1Flag = false
    } else {
        if (a1Flag) {
            const index = degree
            const du = 1 / degree
            let u = du;
            for (let i = 1; i < index; i++) {
                points[2+i].x = points[2].x + u * (points[2+index].x - points[2].x)
                points[2+i].y = points[2].y + u * (points[2+index].y - points[2].y)
                points[2+i].drag = false
                u += du
            }
            points[2].drag = false
            points[2+index].drag = false
        } else {
            for (let i = 0; i <= degree; i++) points[2+i].drag = true
        }
    }
    redraw(sels, t, points)
})


const cText = `
//********************************************************************************************
// deBohr algorithm: recursive
export function deBoorRecursive(n, k, i, t, u, points) {
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
export function deBoorIterative (n,j,t,u,points) {
    const f = []
    for (let i = 0; i <= n; ++i) {
        f.push([points[j-n + i].x, points[j-n + i].y])
    }
    for (let k = 1; k <= n; ++k) {
        for (let i = n; i >= k; --i) {
            const a = (t[j + i + 1 - k] - u) / (t[j + i + 1 - k] - t[j + i - n])
            const b = (u - t[j + i - n]) / (t[j + i + 1 - k] - t[j + i - n])
            f[i][0] = a * f[i-1][0] + b * f[i][0]
            f[i][1] = a * f[i-1][1] + b * f[i][1]
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