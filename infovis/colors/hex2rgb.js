import { axes, conScale, transferFunctions, genDivTooltip } from "../common/draw.js"
import { dropdown } from "../common/gui.js"

let divTooltip =  genDivTooltip() 

// canvas
let colSel = 'BrBG'
const colId = 'color-scale'
const gridObj = d3.select('#hex-to-rgb')
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
        trfG, 
        { colSel: colSel, colMap: colMap, xScale: xAxisScale, yScale: yAxisScale }, 
        colorCurves({colSel, colMap}))
}
function mouseOver(divTooltip) {
    divTooltip.style('display', 'inline-block')
}
function mouseMove(divTooltip, hexCol, rgbCol, pos) {
    const { x, y } = pos
    divTooltip
        .html('color: ' + hexCol + ', ' + rgbCol)
        .style('left', `${x + 10}px`)
        .style('top', `${y}px`)
}
function mouseOut(divTooltip) {
    divTooltip.style("display", 'none')
}

function hex2rgb(hexString) {
    const rs = hexString.substring(1, 3)
    const gs = hexString.substring(3, 5)
    const bs = hexString.substring(5, 7)
    return { r: Number('0x' + rs), g: Number('0x' + gs), b: Number('0x' + bs) }
}

function colorCurves(props) {
    const {
        colSel, 
        colMap,
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
        const color = d3.color(colorScale(c)).formatHex()
        const rgbColor = hex2rgb(color)
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
// Converts a hex triplet color string to an object 
// with the rgb values of a color in the interval [0,255]
function hex2rgb(hexString) {
    const rs = hexString.substring(1, 3)
    const gs = hexString.substring(3, 5)
    const bs = hexString.substring(5, 7)
    return { r: Number('0x' + rs), g: Number('0x' + gs), b: Number('0x' + bs) }
}
`
const hlPre = d3.select('#hl-code').append('pre')
const hlCod = hlPre.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cText)