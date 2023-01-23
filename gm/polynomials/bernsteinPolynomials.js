import * as d3 from 'd3'
// common
import {axes, polynomialCurve, lineGenerator} from 'draw'
import { colorsDos } from 'colors'

const width = 500
const height = 500
const cStrokeWidth = 1.5
const margin = { top: 35, bottom: 25, left: 40, right: 20}
const innerWidth = width - margin.left - margin.right
const innerHeight = height - margin.top - margin.bottom

const svg = d3.selectAll("#d3js_canvas")
    .append('svg')
    .attr('width', width)
    .attr('height', height)
// The axes
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
// The curves
const curvesG = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`) 

const bernsteinP = []
const degree = 3
updatePolynomials(degree)

const degSlider = d3.select('#Bernstein_deg_slider').on('input', function() {
    updatePolynomials(+this.value)
})

function updatePolynomials(deg) {
    const degree = Math.floor(deg)
    d3.select('#degree-value').text(degree)
    d3.select('#Bernstein_deg_slider').property('value', degree)
    curvesG.selectAll('*').remove()
    for (let i = 0; i <= degree; i++) {
        polynomialCurve(
            curvesG,
            bernsteinPolynomial(degree, i, xScale, yScale),
            cStrokeWidth,
            colorsDos[i],
            'bernsteil-'+i  
        )
    }
}

function factorial(n) {
    return (n===0) ? 1 : n * factorial(n-1)
}
function binomial(n,k) {
    if ((typeof n !== 'number') || (typeof k !== 'number') || k > n) return 0
    const enumerator  = factorial(n);
    const denominator = factorial(n-k) * factorial(k);
    return enumerator / denominator;
}
function bernstein(n,i,u) {
    return binomial(n, i) * Math.pow(u, i) * Math.pow(1 - u, n - i)
}

function bernsteinPolynomial(n, i, xScale, yScale) {
    const u0 = 0
    const u1 = 1
    const N = 100
    const du = (u1 - u0) / (N - 1)
    let u = u0
    const curve = []
    for (let j = 0; j < N; j++) {
        const val = bernstein(n,i,u)
        curve.push( { x: xScale(u), y: yScale(val) } )
        u += du
    }
    return curve
}

// Add code to html page
const t = `
// computes factorial recursively
function factorial(n) {
    return (n===0) ? 1 : n * factorial(n-1)
}
// computes binomial coefficient
function binomial(n,k) {
    if ((typeof n !== 'number') || (typeof k !== 'number') || k > n) return 0
    const enumerator  = factorial(n)
    const denominator = factorial(n-k) * factorial(k)
    return enumerator / denominator
}
// computes the ith Bernstein polynomial of degree n at u
function bernstein(n,i,u) {
    return binomial(n, i) * Math.pow(u, i) * Math.pow(1 - u, n - i)
}
`
const hlPre = d3.select('#hl-code').append('pre')
const hlCod = hlPre.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(t)
