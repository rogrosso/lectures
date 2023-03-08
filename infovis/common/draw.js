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
    } else {
        xAxis.tickSize(-height)
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
    if (yTickSize !== undefined) {
        yAxis.tickSize(-yTickSize)
    } else {
        yAxis.tickSize(-width)
    }
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

export function conScale(selection, scaleId, scale, map, width, height, tooltipConfig) {
    const {
        mouseOver,
        mouseMove,
        mouseOut,
        divTooltip
    } = tooltipConfig
    selection.selectAll('*').remove()
    const maxIndex = 30
    const xScale = d3.scaleLinear().domain([0, maxIndex]).range([0,100])
    const cScale = d3.scaleLinear().domain([0,width]).range([0,100])
    const colorScale = d3.scaleSequential().domain([0,100]).interpolator(d3[map.get(scale).name])
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
    const dContainer = gContainer.selectAll('defs').data([null]).join(function(enter) { return enter.append('defs') } )
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
                    .attr('stop-color', d => colorScale(xScale(d)))
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
                    mouseOver(divTooltip)
                })
                .on('mousemove', function (event, d) {
                    const pos = d3.pointer(event)
                    const rgbColor = colorScale(cScale(pos[0]))
                    const hexColor = d3.color(rgbColor).formatHex()
                        mouseMove(divTooltip, hexColor, rgbColor, {
                            x: event.x,
                            y: event.y
                        })
                })
                .on('mouseout', function (event, d) {
                    mouseOut(divTooltip)
                })
                .transition().duration(1000)
                .attr('width', width)
                .attr('height', height)
                .attr('fill', "url(#linear-gradient." + scaleId + ")")
            }
        )
}

export function catScale(selection, scale, map, width, height, tooltipConfig) {
    const {
        mouseOver,
        mouseMove,
        mouseOut,
        divTooltip
    } = tooltipConfig
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
                        mouseOver(divTooltip)
                    })
                    .on('mousemove', function (event, d) {
                        const rgbColor = d3.color(d)
                            mouseMove(divTooltip, d, rgbColor, {
                                x: event.x,
                                y: event.y
                            })
                    })
                    .on('mouseout', function (event, d) {
                        mouseOut(divTooltip)
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
export function transferFunctions (selection, props, colors) {
    const {
        colSel,
        colMap,
        xScale,
        yScale
    } = props
    selection.selectAll("*").remove()    
    const id = 'cont-color-scale'
    let points = null
    if (arguments.length === 3) {
        points = colors
    } else {
        points = colorCurves({colSel, colMap})
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

export function hex2rgb(hexString) {
    const rs = hexString.substring(1, 3)
    const gs = hexString.substring(3, 5)
    const bs = hexString.substring(5, 7)
    return { r: Number('0x' + rs), g: Number('0x' + gs), b: Number('0x' + bs) }
}
export function rgb2hex(color) {
    const r = color.r
    const g = color.g
    const b = color.b
    const hex = '#'+
      r.toString(16).padStart(2,'0')+
      g.toString(16).padStart(2,'0')+
      b.toString(16).padStart(2,'0')
    return hex
}