// common
import {
    axes, 
    polynomialCurve
} from '../common/draw.js'
import { colorsDos as colors } from '../common/colors.js'
import { bSplines, partitionOfUnity } from './bsplines.js'

const width = 700 // canvas  width
const height = 300 // canvas height
const cStrokeWidth = 1.5 // curve line width
// d3 margin convention
const margin = { top: 35, bottom: 25, left: 40, right: 20}
const innerWidth = width - margin.left - margin.right
const innerHeight = height - margin.top - margin.bottom

// canvas
const svg = d3.selectAll("#d3js_canvas")
    .append('svg')
    .attr('width', width)
    .attr('height', height)

function updateBSplines(degree, uniformKnot, partitionUnity) {
    svg.selectAll('*').remove()
    const t = [0]
    const m = 6
    let alpha = 2
    if (uniformKnot) {
        alpha = 0
    }
    for (let i = 1; i <= m+degree+1; i++) {
        t[i] = t[i-1] + alpha * Math.random() + 1
    }
    const xRange = [0, innerWidth]
    const yRange = [0, innerHeight]
    const xDomain = [0,t[m+degree+1]]
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
        className: 'axesBasisChange',
        xTickValues: t,
        fontSize: 12
    }
    const axisG = axes(aConfig)
    const bsplinesG = svg.append('g')
	    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    const curvesG = []
    const nrColors = colors.length
    const N = 100
    const curves = bSplines(degree,t, N)
    curves.forEach( (e, index) => {
        e.forEach( p => {
            p.x = xScale(p.x)
            p.y = yScale(p.y)
        })
        curvesG.push(polynomialCurve(bsplinesG, e, cStrokeWidth, colors[index%nrColors], 'b-spline_'+index) )
    })
    
    if (partitionUnity) {
        const puCurve = partitionOfUnity(degree, t, N)
        puCurve.forEach ( p => {
            p.x = xScale(p.x)
            p.y = yScale(p.y)
        })
        curvesG.push(polynomialCurve(bsplinesG, puCurve, cStrokeWidth, 'black', 'partition_unity') )
    }
}
let degree = 3
let uniformKnot = false
let partitionUnity = false
updateBSplines(degree)
const degSlider = d3.select('#bspline_degree_slider').on('input', function() {
    degree = +this.value
    d3.select('#degree_value').text(degree)
    d3.select('#bspline_degree_slider').property('value', degree)
    updateBSplines(degree, uniformKnot, partitionUnity)
})
const uniformCheckbox = d3.select('#uniform_knot_vector').on('change', function() {
    uniformKnot = this.checked
    updateBSplines(degree, uniformKnot, partitionUnity)
})
const unityCheckbox = d3.select('#partition_unity').on('change', function() {
    partitionUnity = this.checked
    updateBSplines(degree, uniformKnot, partitionUnity)
})

const cText = `
// recursive definition of a B-spline
function bSpline(k, i, t, u) {
    let value = 0
    if(k == 0) {
        value = (t[i] <= u && u < t[i + 1]) ? 1 : 0
    } else {
        const a = (u - t[i]) / (t[i + k] - t[i])
        const b = (t[i + k + 1] - u) / (t[i + k + 1] - t[i + 1])
        value = a * bSpline(k - 1, i, t, u) + b * bSpline(k - 1, i + 1, t, u)
    }
    return value
}
`
const hlPre = d3.select('#hl-code').append('pre')
const hlCod = hlPre.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cText)