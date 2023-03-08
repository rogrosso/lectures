import { axes, conScale, transferFunctions } from "draw"
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"

let divTooltip = d3.select("body")
    .append('div')
    .attr('class', 'categorical_tooltip')
    .attr('id', 'catcolortooltip')
    .style("opacity", 0.7)
    .style('display', 'none')
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")

// canvas
let colSel = 'BrBG'
const colId = 'color-scale'
const gridObj = d3.select('#rgb-to-hex')
const guiDiv = gridObj.append('div')
        .attr('class', 'cell')
        .attr('id', colId)

const width = 450
const sclWidth = width
const sclHeight = 60
const sclMargin = { top: 5, bottom: 5, left: 30, right: 10}
const sclW = sclWidth - sclMargin.left - sclMargin.right
const sclH = sclHeight - sclMargin.top - sclMargin.bottom
const sclDiv = gridObj.append('div')
    .attr('class', 'cell')
    .attr('id', colId)
const sclSVG = sclDiv
    .append('svg')
    .attr('class', colId)
    .attr('width', sclWidth)
    .attr('height', sclHeight)
const sclG = sclSVG.append('g')
    .attr('transform',`translate(${sclMargin.left}, ${sclMargin.top})`)
    .attr('class','color-scale-group')

const trfWidth = width
const trfHeight = 250
const trfMargin = { top: 15, bottom: 30, left: 30, right: 10}
const trfW = trfWidth - trfMargin.left - trfMargin.right
const trfH = trfHeight - trfMargin.top - trfMargin.bottom
const trfDiv = gridObj.append('div')
        .attr('class', 'cell')
        .attr('id', colId)
const trfSVG = trfDiv
    .append('svg')
    .attr('class', colId)
    .attr('width', trfWidth)
    .attr('height', trfHeight)
const axisG = trfSVG.append('g')
    .attr('transform',`translate(${trfMargin.left}, ${trfMargin.top})`)
    .attr('class','color-scale-axis-group')
const trfG = trfSVG.append('g')
    .attr('transform',`translate(${trfMargin.left}, ${trfMargin.top})`)
    .attr('class','transfer-function-group')

    // color scales
const colMap = new Map()
const colKeys = ["BrBG","RdBu","Spectral","Blues","Viridis","Magma","Plasma","Warm","Cool","Cubehelix","Rainbow","Sinebow"]
const colDefs = [
    { name: "interpolateBrBG" },
    { name: "interpolateRdBu" },
    { name: "interpolateSpectral" },
    { name: "interpolateBlues"    },
    { name: "interpolateViridis"  },
    { name: "interpolateMagma"    },
    { name: "interpolatePlasma"   },
    { name: "interpolateWarm"     },
    { name: "interpolateCool"     },
    { name: "interpolateCubehelixDefault" },
    { name: "interpolateRainbow" },
    { name: "interpolateSinebow" }
]
for(let i = 0; i < colKeys.length; i++) {
    colMap.set(colKeys[i], colDefs[i])
}

// draw menue
const guiConfig = {
    divObj: guiDiv,
    text: 'color scale: ',
    selection: colSel,
    keys: colMap.keys(),
    handler: colHandler
}
dropdown(guiConfig)

// color scale
const tooltipConfig = {
    mouseOver: mouseOver,
    mouseMove: mouseMove,
    mouseOut: mouseOut,
    divTooltip: divTooltip
}
conScale(sclG, colId, colSel, colMap, sclW, sclH, tooltipConfig)

// add svg and append axes
const xAxisScale = d3.scaleLinear()
    .domain([0,1])
    .range([0,trfW])
const yAxisScale = d3.scaleLinear()
    .domain([0,255])
    .range([trfH,0])
const yTickValues = [0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 255]
const axisConfig = {
    selection: axisG,
    width: trfW,
    height: trfH,
    xScale: xAxisScale,
    yScale: yAxisScale,
    xPos: 0,
    yPos: 0,
    className: 'color-scale-axis',
    xTickValues: undefined,
    yTickValues: yTickValues,
    xTickSize: undefined,
    yTickSize: undefined,
    xTickFormat: undefined,
    yTickFormat: undefined,
    xLabel: undefined,
    yLabel: undefined
}
axes(axisConfig)
// draw transfer functions
transferFunctions(
    trfG, 
    { colSel: colSel, colMap: colMap, xScale: xAxisScale, yScale: yAxisScale}, 
    colorCurves({colSel, colMap})
)
function colHandler(text, colSel) {
    conScale(sclG, colId, colSel, colMap, sclW, sclH, tooltipConfig)
    transferFunctions(
        trfG, { colSel: colSel, colMap: colMap, xScale: xAxisScale, yScale: yAxisScale },
        colorCurves({colSel: colSel, colMap: colMap})
    )
}
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

function hex2rgb(hexString) {
    const rs = hexString.substring(1, 3)
    const gs = hexString.substring(3, 5)
    const bs = hexString.substring(5, 7)
    return { r: Number('0x' + rs), g: Number('0x' + gs), b: Number('0x' + bs) }
}
function rgb2hex(color) {
    const r = color.r
    const g = color.g
    const b = color.b
    const hex = '#'+
      r.toString(16).padStart(2,'0')+
      g.toString(16).padStart(2,'0')+
      b.toString(16).padStart(2,'0')
    return hex
}

function colorCurves(props) {
    const {
        colSel: colSel, 
        colMap: colMap,
    } = props
    const nrColors = 100
    const cmin = 0
    const cmax = 1
    const dc = (cmax - cmin) / (nrColors - 1)
    const colorScale = d3.scaleSequential()
        .domain([cmin, cmax])
        .interpolator(d3[colMap.get(colSel).name])
    const points = []
    let c = cmin
    for (let i = 0; i < nrColors; i++) {
        const rgbC = d3.color(colorScale(c))
        const hexC = rgb2hex(rgbC)
        const rgbColor = hex2rgb(hexC)
        points.push({
            x: c,
            r: rgbColor.r / 255,
            g: rgbColor.g / 255,
            b: rgbColor.b / 255
        })
        c += dc
    }
    return points
}   

const cText = `
// Converts a rgb color string to a hex triplet web color
function rgb2hex(color) {
    const r = color[0]
    const g = color[1]
    const b = color[2]
    const hex = '#'+
      r.toString(16).padStart(2,'0')+
      g.toString(16).padStart(2,'0')+
      b.toString(16).padStart(2,'0')
    return hex
}
`
const hlPre = d3.select('#hl-code').append('pre')
const hlCod = hlPre.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cText)