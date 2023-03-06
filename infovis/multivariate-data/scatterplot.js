import { axes, fetchCSV } from "draw"
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"
import cars from "cars" assert { type: "json" }

cars.columns = Object.keys(cars[0])
let irisData = null
const carsData = cars
const datasets = ['cars', 'iris']
let tKey = 'name' // for the tooltip

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

const width = 650
const height = 450
const margin = { top:30, bottom: 55, left: 75, right: 20}
const innerWidth = width - margin.left - margin.right
const innerHeight = height - margin.top - margin.bottom
const svg = d3.selectAll("#d3js_canvas")
    .append('svg')
    .attr('width', width)
    .attr('height', height)

let xSelection = 'mpg'
let ySelection = 'weight'
let cSelection = 'origin'
let dSelection = 'cars'

function gui({
    guiObj,
    xSelection,
    ySelection,
    cSelection,
    dSelection,
    datasets,
    keys,
    dKeys,
    handler
}) {
    guiObj.selectAll('*').remove()
    const dropdownOptions = []
    for (let k of keys) dropdownOptions.push({key: k, value: k})
    const gridObj = d3.select('#dropdown-menu')

    const xDiv = gridObj.append('div')
        .attr('class', 'cell')
    const labX = xDiv.append('label')
        .text('x-axis: ')
    const xSelect = xDiv.append('select')
        .on('change', function(event) {
            handler('x-axis', event.target.value)
        })
    const xOptions = xSelect.selectAll('option').data(dropdownOptions, d => d.key)
        .join('option')
        .attr('value', d => d.value)
        .property('selected', d => d.key === xSelection)
        .text(d => d.value)

    const yDiv = gridObj.append('div')
        .attr('class', 'cell')
    const labY = yDiv.append('label')
        .text('y-axis: ')
    const ySelect = yDiv.append('select')
        .on('change', function(event) {
            handler('y-axis', event.target.value)
        })
    const yOptions = ySelect.selectAll('option').data(dropdownOptions, d => d.key)
        .join('option')
        .attr('value', d => d.value)
        .property('selected', d => d.key === ySelection)
        .text(d => d.value)

    const cDiv = gridObj.append('div')
        .attr('class', 'cell')
    const labC = cDiv.append('label')
        .text('color: ')
    const cSelect = cDiv.append('select')
        .on('change', function(event) {
            handler('color', event.target.value)
        })
    const cOptions = cSelect.selectAll('option').data(dropdownOptions, d => d.key)
        .join('option')
        .attr('value', d => d.value)
        .property('selected', d => d.key === cSelection)
        .text(d => d.value)

    const dDiv = gridObj.append('div')
        .attr('class', 'cell')
    const labD = dDiv.append('label')
        .text('dataset: ')
    const dSelect = dDiv.append('select')
        .on('change', function(event) {
            handler('dataset', event.target.value)
        })
    const dOptions = dSelect.selectAll('option').data(dKeys, d => d)
        .join('option')
        .attr('value', d => d)
        .property('selected', d => d === dSelection)
        .text(d => d)
}
function selectHandler(menu, selection) {
    switch(menu){
        case 'x-axis':
            props.xKey = selection
            break
        case 'y-axis':
            props.yKey = selection
            break
        case 'color':
            props.cKey = selection
            break    
        case 'dataset':
            if (selection === 'cars') {
                gProps.xSelection = 'mpg'
                gProps.ySelection = 'weight'
                gProps.cSelection = 'origin'
                gProps.dSelection = 'cars'
                gProps.keys = carsData.columns
                props.data = carsData
                props.tKey = 'name'
            } else if (selection === 'iris') {
                gProps.xSelection = 'Sepal length'
                gProps.ySelection = 'Sepal width'
                gProps.cSelection = 'Species'
                gProps.dSelection = 'iris'
                gProps.keys = irisData.columns
                props.data = irisData
                props.tKey = 'Species'
            }
            gui(gProps)
            props.xKey = gProps.xSelection
            props.yKey = gProps.ySelection
            props.cKey = gProps.cSelection
            break
    }
    draw(props)
}
const gridObj = d3.select('#dropdown-menu')
const gProps = {
    guiObj: gridObj,
    xSelection: xSelection,
    ySelection: ySelection,
    cSelection: cSelection,
    dSelection: dSelection,
    datasets: datasets,
    keys: carsData.columns,
    dKeys: datasets,
    handler: selectHandler
}
const props = {
    selection: svg,
    xKey: xSelection,
    yKey: ySelection,
    cKey: cSelection,
    tKey: tKey,
    data: carsData,
    width: innerWidth,
    height: innerHeight,
    xPos: margin.left,
    yPos: margin.top
}


// read csv
// how to use
const csvUrl = '../data/IRIS-Dataset.csv'
fetchCSV(csvUrl).then( text => {
    irisData = d3.csvParse(text)
    const keys = irisData.columns
    for (let e of irisData) {
        for (let k of keys) {
            if (k !== 'Species') e[k] = +e[k]
        }        
    }
    //console.log(csvData.columns)
    //console.log(cars.columns)
    gui(gProps)
    draw(props)
})
function draw({
    selection,
    xKey,
    yKey,
    cKey,
    tKey,
    data,
    width,
    height,
    xPos,
    yPos
}) {
    // remove all
    selection.selectAll('*').remove()
    // prepare data
    const xScale = d3.scaleLinear().domain(d3.extent(data, d => d[xKey])).range([0,width]).nice()
    const yScale = d3.scaleLinear().domain(d3.extent(data, d => d[yKey])).range([height,0]).nice()
    // draw axis
    const propsAxis = {
        selection: selection,
        width: width,
        height: height,
        xScale: xScale,
        yScale: yScale,
        xPos: xPos,
        yPos: yPos,
        className: 'scatterPlotAxis',
        xTickValues: undefined,
        yTickValues: undefined, //data.map( k => k[key]),
        xTickSize: -height,
        yTickSize:  width,
        xTickFormat: undefined,
        yTickFormat: undefined,
        xLabel: xKey,
        yLabel: yKey
    }
    axes(propsAxis)
    // the scatter plot
    const g = selection.append('g')
        .attr('class', 'bars')
        .attr('transform', `translate(${xPos}, ${yPos})`)
    const tRec = d3.transition()
        .duration(700)
        .ease(d3.easeLinear)
    const circleRadius = 10
    const circleOpacity = 0.5
    let colorScale = undefined
    if (cKey === 'origin' || cKey === 'name' || cKey === 'Species') {
        const uKeys = new Set()
        for(let e of data) {
            uKeys.add(e[cKey])
        }
        colorScale = d3.scaleOrdinal().domain(Array.from(uKeys)).range(d3.schemeDark2)
    } else {
        colorScale = d3.scaleSequential().domain(d3.extent(data,d => d[cKey])).interpolator(d3.interpolateViridis)
    }
    const circles = g.selectAll('g').data(data, d => d[xKey])
      .join(
        enter => {
            const gEnter = enter.append('g')
            gEnter.append('circle')
                .attr('cy', 0)
                .attr('cx', 0)
                .attr('r', 0 )
                .attr('opacity', circleOpacity)
                .transition(tRec)
                    .attr('cx', d => xScale(d[xKey]))
                    .attr('cy', d => yScale(d[yKey])) 
                    .attr('r', circleRadius)
                    .attr('fill', d => colorScale(d[cKey]))
                    .attr('stroke', d => d3.rgb(colorScale(d[cKey])).darker(1))
                    .attr('stroke-widt', 1.5)
            gEnter
                .on('mouseover', function(event,elem) {
                    const e = gEnter.nodes()
                    const eIndex = e.indexOf(this)
                    d3.selectAll('circle')
                        .attr('fill-opacity', (d,i) => {
                            if (eIndex === i) return 1
                            else return 0.3
                        })
                    mouseOver()
                })
                .on('mousemove', function(event, d) {
                    mouseMove(
                        d[tKey],
                        {
                            x: event.x,
                            y: event.y
                        }
                    )
                })
                .on('mouseout', function(event, d) {
                    d3.selectAll('circle').attr('fill-opacity', circleOpacity)
                    mouseOut()
                })
        },
        update => update, // do nothing by update
        exit => exit.attr('class', (d,i) => console.log('d ' + d)).remove() 
    ) 
}

function mouseOver() {
    divTooltip
        .style('position', 'absolute')
        .style('display', 'inline-block')
}
function mouseMove(text, pos) {
    const {
        x,
        y
    } = pos
        divTooltip
            .html(text)
            .style('left', `${x + 10}px`)
            .style('top', `${y}px`)
}
function mouseOut() {
    divTooltip
    .style("display", 'none')
}

const cText = `
// the scatter plot
function draw({
    selection,
    xKey,
    yKey,
    cKey,
    tKey,
    data,
    width,
    height,
    xPos,
    yPos
}) {
    // remove all
    selection.selectAll('*').remove()
    // prepare data
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d[xKey]))
        .range([0,width]).nice()
    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d[yKey]))
        .range([height,0]).nice()
    // draw axis
    const propsAxis = {
        selection: selection,
        width: width,
        height: height,
        xScale: xScale,
        yScale: yScale,
        xPos: xPos,
        yPos: yPos,
        className: 'scatterPlotAxis',
        xTickValues: undefined,
        yTickValues: undefined, //data.map( k => k[key]),
        xTickSize: -height,
        yTickSize: -width,
        xTickFormat: undefined,
        yTickFormat: undefined
    }
    axes(propsAxis)
    // the scatter plot
    const g = selection.append('g')
        .attr('class', 'bars')
        .attr('transform', \`translate(\${xPos}, \${yPos})\`)
    const tRec = d3.transition()
        .duration(700)
        .ease(d3.easeLinear)
    const circleRadius = 10
    const circleOpacity = 0.5
    let colorScale = undefined
    if (cKey === 'origin' || cKey === 'name' || cKey === 'Species') {
        const uKeys = new Set()
        for(let e of data) {
            uKeys.add(e[cKey])
        }
        colorScale = d3.scaleOrdinal()
            .domain(Array.from(uKeys))
            .range(d3.schemeDark2)
    } else {
        colorScale = d3.scaleSequential()
            .domain(d3.extent(data,d => d[cKey]))
            .interpolator(d3.interpolateViridis)
    }
    const circles = g.selectAll('g').data(data, d => d[xKey])
      .join(
        enter => {
            const gEnter = enter.append('g')
            gEnter.append('circle')
                .attr('cy', 0)
                .attr('cx', 0)
                .attr('r', 0 )
                .attr('opacity', circleOpacity)
                .transition(tRec)
                    .attr('cx', d => xScale(d[xKey]))
                    .attr('cy', d => yScale(d[yKey])) 
                    .attr('r', circleRadius)
                    .attr('fill', d => colorScale(d[cKey]))
                    .attr('stroke', d => d3.rgb(colorScale(d[cKey])).darker(1))
                    .attr('stroke-widt', 1.5)
            gEnter
                .on('mouseover', function(event,elem) {
                    const e = gEnter.nodes()
                    const eIndex = e.indexOf(this)
                    d3.selectAll('circle')
                        .attr('fill-opacity', (d,i) => {
                            if (eIndex === i) return 1
                            else return 0.3
                        })
                    mouseOver()
                })
                .on('mousemove', function(event, d) {
                    mouseMove(
                        d[tKey],
                        {
                            x: event.x,
                            y: event.y
                        }
                    )
                })
                .on('mouseout', function(event, d) {
                    d3.selectAll('circle').attr('fill-opacity', circleOpacity)
                    mouseOut()
                })
        },
        update => update, // do nothing by update
        exit => exit.attr('class', (d,i) => console.log('d ' + d)).remove() 
    ) 
}
`

const hlPre = d3.select('#hl-code').append('pre')
const hlCod = hlPre.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cText)