import { axes, conScale, transferFunctions, genDivTooltip } from "draw"
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"

let divTooltip = genDivTooltip()

// canvas
let colSel = 'BrBG'
const colId = 'color-scale'
const gridObj = d3.select('#transfer-functions')
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
const trfMargin = { top: 15, bottom: 30, left: 35, right: 10}
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

const tooltipConfig = {
    mouseOver: mouseOver,
    mouseMove: mouseMove,
    mouseOut: mouseOut,
    divTooltip: divTooltip
}
// color scale
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
transferFunctions(trfG, { colSel: colSel, colMap: colMap, xScale: xAxisScale, yScale: yAxisScale })
// save svg
const saveSVGButton = gridObj.append('div')
    .attr('class', 'cell')
    .attr('id', colId)
    .append('button')
    .text('save svg')
    .on('click', function() {
        saveSVG(trfSVG.node(), 'transfer-functions.svg')
        saveSVG(sclSVG.node(), 'color-scale.svg')
    })
function colHandler(text, value) {
    console.log(value)
    transferFunctions(trfG, { colSel: value, colMap: colMap, xScale: xAxisScale, yScale: yAxisScale })
    conScale(sclG, colId, value, colMap, sclW, sclH, tooltipConfig)
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

const cText = `
// plot transfer functions
function transferFunctions (selection, props) {
    const {
        colSel,
        colMap,
        xScale,
        yScale
    } = props
    selection.selectAll("*").remove()    
    const id = 'cont-color-scale'
    const nrColors = 100
    const colorScale = d3.scaleSequential()
        .domain([0, nrColors])
        .interpolator(d3[colMap.get(colSel).name])
    // collect points
    const points = []
    const cstep = nrColors / (nrColors - 1)
    let c = 0
    for (let i = 0; i < nrColors; i++) {
        const color = d3.color(colorScale(c))
            points.push({
                x: c / nrColors,
                r: color.r / 255,
                g: color.g / 255,
                b: color.b / 255
            })
            c += cstep
    }
    function colPath(sel, points, color, c, duration) {
        // Path
        const gPath = sel.append('g')
        gPath
            .attr('class', 'path-container')
        const cPath = gPath.append('path')
            .datum(points)
            .attr('class', color + '-path')
            .attr('stroke', color)
            .attr('stroke-width', 1.5)
            .attr('fill', 'none')
            .attr('d', d3.line()
                .curve(d3.curveBasis)
                .x(function (d) {
                    return xScale(d.x)
                })
                .y(function (d) {
                    return yScale(255 * d[c])
                }))
            .transition().duration(duration)
            .delay((d, i) => i * 5)
            .attrTween('stroke-dasharray', function () {
                const len = this.getTotalLength();
                return function (t) {
                    return (d3.interpolateString("0," + len, len + ",0"))(t)
                }
            })
        return gPath
    }
    const duration = 1000
    colPath(selection, points, 'red', 'r', duration)
    colPath(selection, points, 'green', 'g', duration)
    colPath(selection, points, 'blue', 'b', duration)
    return selection
}
`
const hlPre = d3.select('#hl-code').append('pre')
const hlCod = hlPre.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cText)

// save svg
function saveSVG(e, eName) {
    e.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const svgData = e.outerHTML;
    const preface = '<?xml version="1.0" standalone="no"?>\r\n';
    const svgBlob = new Blob([preface, svgData], {type:"image/svg+xml;charset=utf-8"});
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = eName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}