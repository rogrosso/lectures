import * as d3 from "https://unpkg.com/d3@7.7.0?module"

//export const lineGenerator = d3.line().curve(d3.curveNatural)
export const lineGenerator = d3.line( d => d.x, d => d.y )
    .curve(d3.curveLinear)
export const cpGenerator = d3.line( d => d.x, d => d.y )
    .curve(d3.curveLinear)
export function axes(config) {
    const {
        selection,
        xScale,
        yScale,
        xPos,
        yPos,
        className
    } = config
    let xTickValues = undefined
    if (config.hasOwnProperty('xTickValues')) xTickValues = config.xTickValues
    let fontSize = '14px'
    if (config.hasOwnProperty('fontSize')) fontSize = config.fontSize
    const xRange = xScale.range()
    const yRange = yScale.range()
    const innerWidth = xRange[1]
    const innerHeight = yRange[1]
    
    const g = selection
        .append('g')
        .attr('class', className)
        .attr('transform', `translate(${xPos}, ${yPos})`)

    const xAxis = d3.axisBottom(xScale)
        .tickSize(-innerHeight)
    if (xTickValues !== undefined) {
        xAxis
            .tickValues(xTickValues)
            .tickFormat(d3.format(".1f"))
    } 
    const xAxisG = g.append('g').call(xAxis)
        .attr('transform', `translate(0, ${innerHeight})`)
    
    const yAxis = d3.axisLeft(yScale)
        .tickSize(-innerWidth)
    const yAxisG = g.append('g').call(yAxis)
        
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

    return g
}
export function polynomialCurve(selection, samples, strokeWidth, cColor, className) {
    const g = selection.append('g')
        .selectAll('path')
        .data([null])
        .join('path')
            .attr('class', className)
            .attr('d', lineGenerator(samples))
            .attr('stroke-width', strokeWidth)
            .attr('stroke', cColor)
            .attr('fill', 'none')

    return g
}
export function controlPolygon(selection, samples, strokeWidth, cColor, className) {
    const g = selection.append('g')
        .selectAll('path')
        .data([null])
        .join('path')
            .attr('class', className)
            .attr('d', cpGenerator(samples))
            .attr('stroke-width', strokeWidth)
            .attr('stroke', cColor)
            .attr('fill', 'none')
    return g
}
export function controlPoints(selection, pts, config) {
    const {
        className, 
        nodeRadius, 
        fillColor, 
        strokeColor, 
        strokeWidth, 
        dragstarted, 
        dragged, 
        dragend 
    } = config
    const nodesG = selection.append('g')
    .selectAll('circle')
    .data(pts, d => d.id)
    .join('circle')
        .attr('class', className)
        .attr('r', nodeRadius)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('fill', fillColor)
        .attr('stroke', strokeColor)
        .attr('stroke-width', strokeWidth)
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragend)
        )
    return nodesG
}
export function labels(selection, pts, config) {
    const {
        xOffset, 
        yOffset, 
        fontSize, 
        fColor, 
        className} = config    
    const labelsG = selection.append('g')
        .selectAll('text')
        .data(pts, d => d.id)
        .join('text')
            .attr('class', className)
            .attr('x', d => d.x + xOffset)
            .attr('y', d => d.y + yOffset)
            .attr('font-size', fontSize)
            .attr('font-family', 'sans-serif')
            .attr('font-weight', 'bold')
            .attr('fill', fColor)
            .text( d => d.name)
    return labelsG
}