// common
import { axes, polynomialCurve } from '../common/draw.js'
import { colorsDos as colors } from '../common/colors.js'
import { bSplines, knotVector } from './bsplines.js'

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

let degree = 3
let uniformKnot = false
let multiplicity = 3
let endpointInterpolation = false
updateBSplines(degree, multiplicity, uniformKnot, endpointInterpolation)

function updateBSplines(degree, multiplicity, uniformKnot, endpointInterpolation) {
    svg.selectAll('*').remove()
    let m = 9
    if (degree === 4) m = 10
    const offset = 2
    let alpha = 2
    const t = knotVector(degree, m, multiplicity, endpointInterpolation, uniformKnot, offset)
    const xRange = [0, innerWidth]
    const yRange = [0, innerHeight]
    const xDomain = [0,t[m+degree]]
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
        xTickValues: t,
        fontSize: 12
    }
    const axisG = axes(aConfig)
    const bsplinesG = svg.append('g')
	    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    const curvesG = []
    const nrColors = colors.length
    let N = 100
    if (multiplicity > 1) N = 150
    const curves = bSplines(degree,t, N)
    curves.forEach( (e, index) => {
        e.forEach( p => {
            p.x = xScale(p.x)
            p.y = yScale(p.y)
        })
        curvesG.push(polynomialCurve(bsplinesG, e, cStrokeWidth, colors[index%nrColors], 'b-spline_'+index) )
    })
}


const degrSlider = d3.select('#bspline_degree_slider').on('input', function() {
    degree = +this.value
    d3.select('#degree_value').text(degree)
    d3.select('#bspline_degree_slider').property('value', degree)
    // update gui
    if (multiplicity > degree){
        multiplicity = degree
        d3.select('#multiplicity_value').text(multiplicity)
        d3.select('#bspline_multiplicity_slider').property('value', multiplicity)
    }
    d3.select('#bspline_multiplicity_slider').property('max', degree)
    updateBSplines(degree, multiplicity, uniformKnot, endpointInterpolation)
})
const multSlider = d3.select('#bspline_multiplicity_slider').on('input', function() {
    multiplicity = +this.value
    console.log(multiplicity)
    d3.select('#multiplicity_value').text(multiplicity)
    d3.select('#bspline_multiplicity_slider').property('value', multiplicity)
    d3.select('#bspline_multiplicity_slider').property('value', multiplicity)
    updateBSplines(degree, multiplicity, uniformKnot, endpointInterpolation)
})
const uniformCheckbox = d3.select('#uniform_knot').on('change', function() {
    uniformKnot = this.checked
    updateBSplines(degree, multiplicity, uniformKnot, endpointInterpolation)
})
const endPtCheckbox = d3.select('#endpoint_interpolation').on('change', function() {
    endpointInterpolation = this.checked
    updateBSplines(degree, multiplicity, uniformKnot, endpointInterpolation)
})

const cText = `
// recursive definition of a B-spline with multiple knots
function bSpline(k, i, t, u) {
    let value = 0
    if(k == 0) {
        value = (t[i] <= u && u < t[i + 1]) ? 1 : 0
    } else {
        if(t[i+k] - t[i] === 0) {
            value =  (t[i + k + 1] - u) / (t[i + k + 1] - t[i + 1]) * bSpline(k - 1, i + 1, t, u)
        } else if(t[i + k + 1] - t[i + 1] === 0) {
            value =  (u - t[i]) / (t[i + k] - t[i]) * bSpline(k - 1, i, t, u)
        } else if(t[i + k + 1] - t[i] === 0) {
            value =  0
        } else {
            const a = (u - t[i]) / (t[i + k] - t[i])
            const b = (t[i + k + 1] - u) / (t[i + k + 1] - t[i + 1])
            value = a * bSpline(k - 1, i, t, u) + b * bSpline(k - 1, i + 1, t, u)
        }
    }
    return value
}
`
const hlPre = d3.select('#hl-code').append('pre')
const hlCod = hlPre.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cText)