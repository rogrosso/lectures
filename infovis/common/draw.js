//import * as d3 from "https://unpkg.com/d3@7.7.0?module"
//import * as d3 from "https://cdn.skypack.dev/d3@7"
//import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"
//import {axisBottom, axisLeft} from "https://cdn.jsdelivr.net/npm/d3-axis@7/+esm"
//import { format } from "https://cdn.jsdelivr.net/npm/d3-format@7/+esm"
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function axes(config) {
    const {
        selection,
        width,
        height,
        xScale,
        yScale,
        xPos,
        yPos,
        className,
        xTickValues,
        yTickValues,
        xTickSize,
        yTickSize,
        xTickFormat,
        yTickFormat,
        xLabel,
        yLabel
    } = config
    let fontSize = '14px'
    const g = selection
        .append('g')
        .attr('class', className)
        .attr('transform', `translate(${xPos}, ${yPos})`)

    const xAxis = d3.axisBottom(xScale)
    if (xTickSize !== undefined) {
        xAxis.tickSize(xTickSize)
    }
    if (xTickValues !== undefined) {
        xAxis.tickValues(xTickValues)
    }
    if (xTickFormat !== undefined) {
        xAxis.tickFormat(xTickFormat)
    } 
    const xAxisG = g.append('g').call(xAxis)
        .attr('transform', `translate(0, ${height})`)
    
    const yAxis = d3.axisLeft(yScale)
    if (yTickSize !== undefined)
        yAxis.tickSize(-width)
    if (yTickValues !== undefined) {
        yAxis.tickValues(yTickValues)
    }
    if (yTickFormat !== undefined) {
        yAxis.tickFormat(format(yTickFormat))
    }
    const yAxisG = g.append('g').call(yAxis)
        
    // style axis
    xAxisG.selectAll('text')
        .attr('font-size', fontSize)
        .attr('fill', '#635F5D')
        .attr('transform', `translate(0, 5)`)
    yAxisG.selectAll('text')
        .attr('font-size', fontSize)
        .attr('fill', '#635F5D')
        .attr('transform', `translate(-5, 0)`)
    xAxisG.selectAll('line')
        .attr('stroke', '#635F5D')
    yAxisG.selectAll('line')
        .attr('stroke', '#8E8883')

    // has axes labels?
    if (xLabel !== undefined) {
        xAxisG
            .append('text')
                .attr('class', 'x-axis-label')
                .attr('y', 40)
                .style('font-family', 'sans-serif')
                .style('font-size', '16px')
                .style('font-weight', 'bold')
                .attr('fill', "#635F5D")
                .attr('x', width / 2)
                .text(xLabel)
            
    }
    if (yLabel !== undefined) {
        yAxisG
            .append('text')
                .attr('class', 'x-axis-label')
                .attr('y', -55)
                .attr('transform', `rotate(-90)`)
                .attr('text-anchor', 'middle')
                .style('font-family', 'sans-serif')
                .style('font-size', '16px')
                .style('font-weight', 'bold')
                .attr('fill', "#635F5D")
                .attr('x', -height/2)
                .text(yLabel)
    }
    return g
}

// read csv
// how to use
// const csvUrl = '...'
//fetchCSV(csvUrl).then( text => {
//    const csvData = d3.csvParse(text)
//    // ... do the job here
//})
export const fetchCSV = async (url) => {
    const response = await fetch(url)
    return await response.text()
}


