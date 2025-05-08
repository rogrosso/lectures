import { dropdown } from "../common/gui.js"

const url = "../data/babenames.csv"

drawAll(url) 
async function drawAll(url) {
    const response = await fetch(url)
    const text = await response.text()
    const data = d3.csvParse(text)
    draw(data)
}

function draw(data) {
    const minYear = d3.min(data, d => +d.year)
    const maxYear = d3.max(data, d => +d.year)
    const fromYear = minYear + 50
    // compute the number of layers in the streamgraph,
    // that is, one layer per name
    const s_ = new Set()
    for (let n of data) {
        s_.add(n.name)
    }
    // for each layer, create a time series
    const m_ = new Map()
    for (let n of s_) {
        const e = []
        for (let y = minYear; y <= maxYear; y++) {
            e.push({ year: y, name: n, number: 0, gender: e.sex, prop: e.pop })
        }
        m_.set(n, e) // name is the key
    }
    // set total number of names per year
    for (let n of data) {
        const e = m_.get(n.name)
        e[+n.year - minYear].number += +n.n
        e[+n.year - minYear].gender  = n.sex
    }
    // compute the stream graph for three different layouts
    const tsb = [] // base layout
    const tss = [] // symmetric layout
    const tsw = [] // wiggle layout
    const bnames = Array.from(new Map([...m_.entries()].sort()))
    // compute offsets of stream graph layout
    const g0Base = baselineSimple(bnames)
    const g0Sym = baselineSymmetric(bnames)
    const g0Wiggle = baselineWiggle(bnames)
    // compute time series for each layout
    t_(bnames, g0Base, tsb)
    t_(bnames, g0Sym, tss)
    t_(bnames, g0Wiggle, tsw)
    // draw the stream graph
    render(tsb, tss, tsw, fromYear)   
}

/**
 * Compute base line for simple stream graph layout 
 * @param {Array} bnames, array of names
 * @returns {Array} g0, array of offsets
 */
function baselineSimple(bnames) {
    return new Array(bnames[0][1].length).fill(0)
}
function baselineSymmetric(bnames) {
    const g0 = new Array(bnames[0][1].length).fill(0)
    for (let n of bnames) {
        for (let [i, t] of n[1].entries()) {
            g0[i] += t.number
        }
    }
    for (let i = 0; i < g0.length; i++) {
        g0[i] /= -2
    }
    return g0
}
function baselineWiggle(bnames) {
    const n = bnames.length // number of layers
    const g0 = new Array(bnames[0][1].length).fill(0)
    for (let [j, l] of bnames.entries()) {
        for (let [i, t] of l[1].entries()) {
            g0[i] += (n-j) * t.number
        }
    }
    for (let i = 0; i < g0.length; i++) {
        g0[i] /= -(n+1)
    }
    return g0
}
/**
 * Compute time series stream graph layoyt 
 * @param {Array} data, array of names
 * @param {Array} g0, baseline offsets
 * @param {Array} ts, array of time series layers
 */
function t_ (data, g0, ts) {
    for (let [j,l] of data.entries()) {
        ts.push([])
        ts[j] = []
        for (let [i,e] of l[1].entries()) {
            const d = [g0[i],g0[i] + e.number,e.year,e.name, e.gender]
            ts[j].push(d)
            g0[i] += e.number
        }
    }
}

function render(tsb, tss, tsw, fromYear) {
    // drawing
    const width = 600
    const height = 450
    const margin = { top: 20, right: 20, bottom: 50, left: 20 }
    const canvas = d3.select("#stream-graph")
    // gui
    const pKeys = ["Base", "Symmetric", "Wiggle"]
    let pSel = "Base"
    const pId = "layout-menu"
    const pDiv = canvas.append("div").attr("class", "cell").attr("id", pId)
    const guiConfig = {
        divObj: pDiv,
        text: "layout: ",
        selection: pSel,
        keys: pKeys,
        handler: layoutHandler,
    }
    dropdown(guiConfig)
    // svg
    const svgCanvas = canvas.append("div").attr("class", "cell").attr("id", "svg-canvas")
    const svg = svgCanvas.append("svg").attr("width", width).attr("height", height)
    // render once
    const iW = width - margin.left - margin.right
    const iH = height - margin.top - margin.bottom
    const minX = d3.min(tsb[0], d => d[2])
    const maxX = d3.max(tsb[0], d => d[2])
    const minY = d3.min(tsb, l => d3.min(l, d => d[0]))
    const maxY = d3.max(tsb, l => d3.max(l, d => d[1]))
    const g = svg.append('g')
        .attr('class', 'streamgraph-group')
        .attr('transform', `translate(${margin.left},${margin.top})`)
    const gElement = document.querySelector('g.streamgraph-group')
    const bbox = gElement.getBoundingClientRect()
    const xScale = d3.scaleLinear()
        .domain([minX,maxX])
        .range([0, iW])
        .nice()
    const yScale = d3.scaleLinear()
        .domain([minY,maxY])
        .range([iH,0])
    const xAxis = d3.axisBottom(xScale)
        .tickPadding(15)
        .ticks(9)
        .tickFormat(d3.format('d'))
    const xAxisG = g.append('g')
        .attr('class','.x-axis')
        .attr('transform', `translate(0,${iH+1})`)
        .call(xAxis)
    // draw streamgraph
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
    const area = d3.area()
        .curve(d3.curveCatmullRom.alpha(0.5))
        .x( d => xScale(d[2]))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
    const gStreamgraph = svg.append("g");
    const path = gStreamgraph.selectAll("path")
        .data(tsb)
        .join('path')
            .attr('class', 'streamgraph-path')
            .attr("d", (d,i) => area(d))
            .attr("transform", `translate(${margin.left},${margin.top})`)
            .attr("fill", (d,i) => colorScale(i%(tsb.length)) )
            .on('mousemove',(e,o) => {
                const t = xScale.invert(e.x - bbox.x - margin.left)
                for(let e of o) {
                    if (e[2] > t) {
                        label.text(e[2]+', ' + e[4] + ': ' + e[3])
                        break
                    }
                }
            })
            .on('mouseover', (e,o) => {
                const p = d3.selectAll('path.streamgraph-path')
                p.attr('fill-opacity', d => {
                    if (d[0][3] === o[0][3])
                        return 1
                    else
                        return 0.3
                    })
            })
            .on('mouseleave', (e,o) => {
                const p = d3.selectAll('path.streamgraph-path')
                p.attr('fill-opacity', 1)
                label.text('')
            })
    // draw legend
    const tGroup = g.append('g')
    const label = tGroup.selectAll('text').data([null])
        .join('text')
            .attr('class', 'streamgraph-text')
            .attr('x', margin.left + 2 * iW / 3)
            .attr('y', margin.top)
            .attr('font-size', d => 10)
            .attr('font-weight', 400)
            .attr('font-family', `'Lucida Sans Unicode', 'Lucida Grande', 'sans-serif'`)
            .text('')
            .attr('visibility', 'visible')
    // update
    function redraw(ts) {
        // init
        const minX = d3.min(ts[0], d => d[2])
        const maxX = d3.max(ts[0], d => d[2])
        const minY = d3.min(ts, l => d3.min(l, d => d[0]))
        const maxY = d3.max(ts, l => d3.max(l, d => d[1]))
        const xScale = d3.scaleLinear()
            .domain([minX,maxX])
            .range([0, iW])
            .nice()
        const yScale = d3.scaleLinear()
            .domain([minY,maxY])
            .range([iH,0])
        const area = d3.area()
            .curve(d3.curveCatmullRom.alpha(0.5))
            .x( d => xScale(d[2]))
            .y0(d => yScale(d[0]))
            .y1(d => yScale(d[1]))
        // draw 
        const t = d3.transition().duration(1000)
        const p = d3.selectAll('path.streamgraph-path')
        p.data(ts)
            .transition(t)
            .attr("d", (d,i) => area(d))

    }
    // layout handler
    function layoutHandler(text, value) {
        if (value === 'Base') {
            const ts = tsb
            redraw(ts)
        } else if (value === 'Symmetric') {
            const ts = tss
            redraw(ts)
        } else if (value === 'Wiggle') {
            const ts = tsw
            redraw(ts)
        }
    }
}

const cText = `
/**
 * Compute base line for simple stream graph layout 
 * @param {Array} bnames, array of names
 * @returns {Array} g0, array of offsets
 */
function baselineSimple(bnames) {
    return new Array(bnames[0][1].length).fill(0)
}
function baselineSymmetric(bnames) {
    const g0 = new Array(bnames[0][1].length).fill(0)
    for (let n of bnames) {
        for (let [i, t] of n[1].entries()) {
            g0[i] += t.number
        }
    }
    for (let i = 0; i < g0.length; i++) {
        g0[i] /= -2
    }
    return g0
}
function baselineWiggle(bnames) {
    const n = bnames.length // number of layers
    const g0 = new Array(bnames[0][1].length).fill(0)
    for (let [j, l] of bnames.entries()) {
        for (let [i, t] of l[1].entries()) {
            g0[i] += (n-j) * t.number
        }
    }
    for (let i = 0; i < g0.length; i++) {
        g0[i] /= -(n+1)
    }
    return g0
}
/**
 * Compute time series stream graph layoyt 
 * @param {Array} data, array of names
 * @param {Array} g0, baseline offsets
 * @param {Array} ts, array of time series layers
 */
function t_ (data, g0, ts) {
    for (let [j,l] of data.entries()) {
        ts.push([])
        ts[j] = []
        for (let [i,e] of l[1].entries()) {
            const d = [g0[i],g0[i] + e.number,e.year,e.name, e.gender]
            ts[j].push(d)
            g0[i] += e.number
        }
    }
}
`
const hlPre = d3.select("#hl-code").append("pre")
const hlCod = hlPre
    .append("code")
    .attr("class", "language-javascript")
    .attr("style", "border: 1px solid #C1BAA9")
    .text(cText)
