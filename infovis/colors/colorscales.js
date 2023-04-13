import { conScale, catScale, genDivTooltip } from "draw"
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"

const divTooltip = genDivTooltip()

function dropdown({
    divObj,
    text,
    selection,
    keys,
    handler
}) {
    const dropdownOptions = []
    for (let k of keys) dropdownOptions.push({key: k, value: k})

    const lab = divObj.append('label')
        .text(text)
    const select = divObj.append('select')
        .on('change', function(event) {
            handler(text, event.target.value)
        })
    const options = select.selectAll('option').data(dropdownOptions, d => d.key)
        .join('option')
        .attr('value', d => d.value)
        .property('selected', d => d.key === selection)
        .text(d => d.value)
}

const catMap = new Map()
const catKeys = ["Category10", "Accent", "Dark2", "Paired", "Pastel1", "Set1"]
const catDefs = [
    { name: "schemeCategory10", n: 10 },
    { name: "schemeAccent",     n: 8  },
    { name: "schemeDark2",      n: 8  },
    { name: "schemePaired",     n: 8  },
    { name: "schemePastel1",    n: 9  },
    { name: "schemeSet1",       n: 9  }
]
for (let i = 0; i < catKeys.length; i++) {
    catMap.set(catKeys[i], catDefs[i])
}
const divMap = new Map()
const divKeys = ["BrBG", "PRGn", "PiYG", "PuOr", "RdBu", "RdGy", "Spectral"]
const divDefs = [
    { name: "interpolateBrBG" },
    { name: "interpolatePRGn" },
    { name: "interpolatePiYG" },
    { name: "interpolatePuOr" },
    { name: "interpolateRdBu" },
    { name: "interpolateRdGy" },
    { name: "interpolateSpectral" }
]
for (let i = 0; i < divKeys.length; i++) {
    divMap.set(divKeys[i], divDefs[i])
}
const seqKeys = ["Blues", "Greens", "Greys", "Purples", "Viridis", "Magma", "Plasma", "Warm", "Cool", "Cubehelix", "GnBu", "OrRd"]
const seqDefs = [
    { name: "interpolateBlues"    },
    { name: "interpolateGreens"   },
    { name: "interpolateGreys"    },
    { name: "interpolatePurples"  },
    { name: "interpolateViridis"  },
    { name: "interpolateMagma"    },
    { name: "interpolatePlasma"   },
    { name: "interpolateWarm"     },
    { name: "interpolateCool"     },
    { name: "interpolateCubehelixDefault" },
    { name: "interpolateGnBu" },
    { name: "interpolateOrRd" }
]
const seqMap = new Map()
for (let i = 0; i < seqKeys.length; i++) {
    seqMap.set(seqKeys[i], seqDefs[i])
}
const cycKeys = ["Rainbow", "Sinebow"]
const cycDefs = [
    { name: "interpolateRainbow" },
    { name: "interpolateSinebow" }
]
const cycMap = new Map()
for (let i = 0; i < cycKeys.length; i++) {
    cycMap.set(cycKeys[i], cycDefs[i])
}
let catSel = 'Category10'
let divSel = 'BrBG'
let seqSel = 'Blues'
let cycSel = 'Rainbow'
const catId = 'categorical-scale'
const divId = 'divergent-scale'
const seqId = 'sequential-scale'
const cycId = 'cyclic-scale'
const gridObj = d3.select('#color-scales')
const catDiv = gridObj.append('div')
        .attr('class', 'cell')
        .attr('id', catId)
const divDiv = gridObj.append('div')
        .attr('class', 'cell')
        .attr('id', divId)
const seqDiv = gridObj.append('div')
    .attr('class', 'cell')
    .attr('id', seqId)
const cycDiv = gridObj.append('div')
    .attr('class', 'cell')
    .attr('id', cycId)

const guiConfig = {
    divObj: catDiv,
    text: 'categorical colors ',
    selection: catSel,
    keys: catMap.keys(),
    handler: catHandler
}
dropdown(guiConfig)
guiConfig.divObj = divDiv,
guiConfig.text = 'divergent colors '
guiConfig.selection = divSel
guiConfig.keys = divMap.keys()
guiConfig.handler = divHandler
dropdown(guiConfig)
guiConfig.divObj = seqDiv
guiConfig.text = 'sequential colors '
guiConfig.selection = seqSel
guiConfig.keys = seqMap.keys()
guiConfig.handler = seqHandler
dropdown(guiConfig)
guiConfig.divObj = cycDiv
guiConfig.text = 'cyclic colors '
guiConfig.selection = cycSel
guiConfig.keys = cycMap.keys()
guiConfig.handler = cycHandler
dropdown(guiConfig)


const width = 450
const height = 60
const margin = { top: 5, bottom: 1, left: 3, right: 3}
const iW = width - margin.left - margin.right
const iH = height - margin.top - margin.bottom
const catSVG = catDiv
    .append('svg')
    .attr('class', catId)
    .attr('width', width)
    .attr('height', height)

const catG = catSVG.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
const divSVG = divDiv
    .append('svg')
    .attr('class', divId)
    .attr('width', width)
    .attr('height', height)

const divG = divSVG.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
const seqSVG = seqDiv
    .append('svg')
    .attr('class', divId)
    .attr('width', width)
    .attr('height', height)

const seqG = seqSVG.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
const cycSVG = cycDiv
    .append('svg')
    .attr('class', divId)
    .attr('width', width)
    .attr('height', height)
const cycG = cycSVG.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

catDiv.append('hr')
divDiv.append('hr')
seqDiv.append('hr')
cycDiv.append('hr')

const tooltipConfig = {
    mouseOver: mouseOver,
    mouseMove: mouseMove,
    mouseOut: mouseOut,
    divTooltip: divTooltip
}
catScale(catG, catSel, catMap, iW, iH, tooltipConfig)
conScale(divG, divId, divSel, divMap, iW, iH, tooltipConfig)
conScale(seqG, seqId, seqSel, seqMap, iW, iH, tooltipConfig)
conScale(cycG, cycId, cycSel, cycMap, iW, iH, tooltipConfig)

function catHandler(text, value) {
    catScale(catG, value, catMap, iW, iH, tooltipConfig)
}
function divHandler(text, value) {
    conScale(divG, divId, value, divMap, iW, iH, tooltipConfig)
}
function seqHandler(text, value) {
    conScale(seqG, seqId, value, seqMap, iW, iH, tooltipConfig)
}
function cycHandler(text, value) {
    conScale(cycG, cycId, value, cycMap, iW, iH, tooltipConfig)
}

function mouseOver(divTooltip) {
    divTooltip
        .style('position', 'absolute')
        .style('display', 'inline-block')
}
function mouseMove(divTooltip, hexCol, rgbCol, pos) {
    const {
        x,
        y
    } = pos
        divTooltip
            .html('color: ' + hexCol + ', ' + rgbCol)
            .style('left', `${x + 10}px`)
            .style('top', `${y}px`)
}
function mouseOut(divTooltip) {
    divTooltip
    .style("display", 'none')
}

const cText = `
// color scales for categorical data
function catScale(selection, scale, map, width, height) {
    const nrColors = map.get(scale).n    
    const dx = width / nrColors
    const dy = height
    const xScale = d3.scaleLinear()
        .domain([0,nrColors])
        .range([0,width])

    const gContainer = selection.selectAll('g.catContainer').data([null])
        .join(
            function(enter) {
                enter.append('g')
                    .attr('class', 'catContainer')
                return enter
            },
            function(update) {
                return update
            },
            function(exit) {
                return exit
            }
        )
    const cGroup = d3.select('g.catContainer')
        .selectAll('rect')
        .data(d3[map.get(scale).name], d => d)
        .join(
            function(enter) {
                return enter.append('rect')
                    .attr('y', 0)
                    .attr('fill', d => d)
                    .style('opacity', 0)
                    .on('mouseover', function (event, d) {
                        mouseOver()
                    })
                    .on('mousemove', function (event, d) {
                        const color = d3.color(d)
                            mouseMove(d, color, {
                                x: event.x,
                                y: event.y
                            })
                    })
                    .on('mouseout', function (event, d) {
                        mouseOut()
                    })
                    .transition().duration(1000)
                    .delay((d, i) => i * 5)
                    .attr('x', (d, i) => xScale(i))
                    .attr('width', dx)
                    .attr('height', dy)
                    .style('opacity', 1)
                    
            },
            function(update) {
                return update
                    .transition().duration(200)
                    .attr('width', 0)
                    .attr('x', 0)
            },
            function(exit) {
                return exit
                    .transition().duration(200)
                    .attr('width', 0)
                    .attr('height', 0)
                    .attr('x', 0)
                    .remove()
            }
        )
}
// color scales for quantitative data
function conScale(selection, scaleId, scale, map, width, height) {
    selection.selectAll('*').remove()
    const maxIndex = 30
    const xScale = d3.scaleLinear().domain([0, maxIndex]).range([0,100])
    const cScale = d3.scaleLinear().domain([0,width]).range([0,100])
    const colorScale = d3.scaleSequential()
        .domain([0,100])
        .interpolator(d3[map.get(scale).name])
    const containerClass = 'g.'+scaleId
    const gContainer = selection.selectAll(containerClass).data([null])
        .join(
            function(enter) {
                return enter.append('g')
                    .attr('class', 'colors.'+scaleId)
            },
            function(update) {
                return update
            },
            function(exit) {
                return exit
            }
        )
    const dContainer = gContainer.selectAll('defs').data([null])
        .join(function(enter) { return enter.append('defs') } )
    const lContainer = dContainer.selectAll('defs').data([null])
        .join(
            function(enter) {
                return enter.append('linearGradient').attr('id', 'linear-gradient.'+scaleId)
            }
        )
    const sContainer = lContainer.selectAll('stops')
        .data(d3.range(maxIndex+1), d => colorScale(d))
        .join(
            function(enter) {
                return enter
                    .append('stop')
                    .attr('offset', d => xScale(d) + '%')
                    .attr('stop-color', d => colorScale(d))
            },
            function(update) { 
                return update.attr('stop-color', d => colorScale(d))
            },
            function(exit) {
                return exit
                    .transition()
                    .duration(100)
                    .attr('width',0)
                    .remove()
            }
        )    
    const colors = gContainer.selectAll('rect').data([null])
        .join(
            function(enter) {
                return enter
                .append('rect')
                .attr('class', 'rect')
                .attr('y', 0)
                .attr('x', 0)
                .attr('width', 0)
                .attr('height', 0)
                .on('mouseover', function (event, d) {
                    mouseOver()
                })
                .on('mousemove', function (event, d) {
                    const pos = d3.pointer(event)
                    const hexColor = colorScale(cScale(pos[0]))
                    const rgbColor = d3.color(hexColor)
                        mouseMove(hexColor, rgbColor, {
                            x: event.x,
                            y: event.y
                        })
                })
                .on('mouseout', function (event, d) {
                    mouseOut()
                })
                .transition().duration(1000)
                .attr('width', width)
                .attr('height', height)
                .attr('fill', "url(#linear-gradient." + scaleId + ")")
            }
        )
}
`
const hlPre = d3.select('#hl-code').append('pre')
const hlCod = hlPre.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cText)