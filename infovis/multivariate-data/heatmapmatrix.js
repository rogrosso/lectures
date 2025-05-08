
import { genDivTooltip } from "../common/draw.js"
import { dropdown } from "../common/gui.js"


const url = '../data/INED-DemographicData.json' // URL to the JSON file containing the heatmap data
drawAll(url) // Call the function to draw the heatmap

async function drawAll(url) {
    const dData = await d3.json(url) // Fetch the JSON data
    update(dData) // Call the function to draw the heatmap
}

function update(data) {
        const divTooltip = genDivTooltip('categoricaltooltip-class', 'categorical_tooltip-id')
        let colorScaleSVG = null
        let heatmapSVG = null
        let countries = null
        let cKeys = null
        let csW = 0
        let csH = 0
        // Color scales
        const csMap = new Map()
        const csKeys = [ 'Reds','OrRd','YlOrRd','PuRd','RdYlBu','CubehelixDefault','Cividis','Viridis','Inferno','Rainbow']
        const csDefs = ['interpolateReds','interpolateOrRd','interpolateYlOrRd','interpolatePuRd','interpolateRdYlBu','interpolateCubehelixDefault','interpolateCividis','interpolateViridis','interpolateInferno','interpolateRainbow']
        for (let i = 0; i < csKeys.length; i++) {
            csMap.set(csKeys[i], csDefs[i])
        }
        // read data from csv
        const dData = selectCountries(data) // demographic data
        cKeys = dData.map( e => e.Country) // country names

        const keys = Object.keys(dData[0])
        const countires = []
        for (let c of dData) {
            for (let k of keys) {
                if (k === 'Country') continue
                const obj = { Country: c.Country, key: k, value: c[k] }
                countires.push(obj)
            }
        }
        draw(dData, keys)

        // select countries
        function selectCountries(data) {
            const sel = data.filter( (e,i) => {
                switch(e.Country) {
                    case 'Brazil':
                        return data[i]
                    case 'Jamaica':
                        return data[i]
                    case 'Mexico':
                        return data[i]
                    case 'Korea':
                        return data[i]
                    case 'Japan':
                        return data[i]
                    case 'Germany':
                        return data[i]
                    case 'Spain':
                        return data[i]
                    case 'Viet Nam':
                        return data[i]
                    case 'Australia':
                        return data[i]
                    case 'New Zealand':
                        return data[i]
                    case 'France':
                        return data[i]
                }
            })
            return sel
        }
        // function to set the color scales for each attribute key
        function setColorScales(data, csKey) {
            const keys = Object.keys(data[0])
            const m_ = new Map()
            for (let key of keys) {
                if (key === 'Country') continue // || key === 'Group' || key === 'Continent') continue
                const values = m_.set(key, [])
            }
            for (let c of data) {
                for (let k of m_.keys()) {
                    m_.get(k).push(c[k])
                }
            }
            
            const colorScales = new Map()
            for (let key of m_.keys()) {
                if (key === 'Country') continue
                if (key === 'Group' || key === 'Continent') {
                    colorScales.set(key, d3.scaleOrdinal(d3.schemeCategory10))
                    continue
                } else {
                    const min = Math.min(...m_.get(key))
                    const max = Math.max(...m_.get(key))

                    colorScales.set(
                            key, 
                            d3.scaleSequential().domain([min, max]).interpolator(d3[csKey])
                        )
                }
            }
            return colorScales
        }
        // draw the heatmap
        function draw(dData, keys) {
            const width = 600
            const height = 400
            const margin = { top:40, bottom: 80, left:80, right: 20}
            const iW = width - margin.left - margin.right
            const iH = height - margin.top - margin.bottom
            const dropdwonMenuObj = d3.select('#dropdown-menu')
            const dwDiv = dropdwonMenuObj.append('div')
                .attr('class', 'cellDW')
                .attr('id', 'dropdown_div')
                .style('grid-column-start','1')
                .style('grid-column-end', '1')
                .style('margin', '1px')
            const gridObj = d3.select('#d3js_canvas')
            const hmDiv = gridObj.append('div')
                .attr('class', 'cell')
                .attr('id', 'heatmapmatrix_div')
                .attr('margin', '1px')
            const csDiv = gridObj.append('div')
                .attr('class', 'cell')
                .attr('id', 'colorscale_div')
            const hmSvg = hmDiv //d3.selectAll("#d3js_canvas")
                .append('svg')
                .attr('width',  width)
                .attr('height', height)
                .attr('transform', `translate(0, ${5})`)
            // create dropdowns
            dropdown({
                divObj: dwDiv,
                text: 'color scale: ',
                name: 'colorScale',
                fontSize: '0.8em',
                selection: 'Reds',
                keys: csKeys,
                handler: csHandler
            })
            // create a color scale for each key
            const colorScales = setColorScales(dData, csMap.get(csKeys[0]))
            // scales and axes
            const xScale = d3.scaleBand()
                .range([ 0, iW ])
                .domain(keys.slice(1))
                .padding(0.05)
            const yScale = d3.scaleBand()
                .range([ iH, 0 ])
                .domain(cKeys)
                .padding(0.05)
            const xAxis = d3.axisBottom(xScale).tickSize(0)
            const yAxis = d3.axisLeft(yScale).tickSize(0)
            hmSvg.append('g')
                .style('font-size', 10)
                .attr('transform', `translate(${margin.left}, ${iH})`)
                .call(xAxis)
                    .selectAll("text")  
                        .style("text-anchor", "end")
                        .attr("dx", "-.8em")
                        .attr("dy", ".15em")
                        .attr("transform", "rotate(-65)");
            hmSvg.append('g')
                .style('font-size', 10)
                .attr('transform', `translate(${margin.left}, 0)`)
                .call(yAxis)
            // remove domain    
            hmSvg.selectAll('.domain').remove()
            // draw the heatmap
            const heatmap = hmSvg.append('g')
                .attr('width', iW)
                .attr('height', iH)
                .attr('transform', `translate(${margin.left}, 0 )`)
            heatmapSVG = heatmap.selectAll().data(countires, function(d) { return d.Country + ':' + d.key })
                .join(
                    enter => {
                        const gEnter = enter.append('g')
                        gEnter.append("rect")
                            .attr("x", (d,i) => { 
                                return xScale(d.key) 
                            })
                            .attr("y", (d,i) => { 
                                return yScale(d.Country)
                            })
                            .attr("rx", 3)
                            .attr("ry", 4)
                            .attr("width", xScale.bandwidth() )
                            .attr("height", yScale.bandwidth() )
                            .style("fill", d => { 
                                if (d.key === 'Group' || d.key === 'Continent') return colorScales.get(d.key)(d.value)
                                else return colorScales.get(d.key)(d.value)
                            })
                            .style("stroke-width", 0.6)
                            .style("stroke", d => {
                                if (d.key === 'Group' || d.key === 'Continent') return 'black'
                                else { 
                                    const col = colorScales.get(d.key)(d.value)
                                    return d3.color(col).darker(1)
                                }
                            })
                            .style("opacity", 0.9)
                            //.transition.duration(1000)
                            gEnter
                                .on("mouseover", function (event, elem) {
                                    const e = gEnter.nodes()
                                    const eIndex = e.indexOf(this)
                                    d3.selectAll("rect").attr(
                                        "fill-opacity",
                                        (d, i) => {
                                            if (eIndex === i) return 1
                                            else return 0.3
                                        }
                                    )
                                    mouseOver()
                                })
                                .on("mousemove", function (event, d) {
                                    mouseMove(
                                        `Country: ${d.Country}<br>${d.key}: ${d.value}`,
                                        { x: event.pageX, y: event.pageY }
                                    )
                                })
                                .on("mouseout", function (event, d) {
                                    d3.selectAll("rect").attr(
                                        "fill-opacity",
                                        1
                                    )
                                    mouseOut()
                                })
                            gEnter.transition().duration(1000).attr('fill-opacity', 1)
                        return gEnter
                        //return enter
                    },
                    (update) => update, // do nothing by update
                    (exit) => exit.attr("class", (d, i) => console.log("d " + d)).remove()
                )
            // draw the color scales
            colorScaleSVG = csDiv.append('svg')
                .attr('width', 100)
                .attr('height', height)
                .attr('transform', `translate(0, ${7})`)
            csW = 30
            csH = height - margin.bottom - margin.top
            continuousScale(colorScaleSVG, 'colorscale', csMap.get(csKeys[0]), csW, csH)
        }

        function redraw(csKey) {
            const colorScales = setColorScales(dData, csMap.get(csKey))

            heatmapSVG.selectAll("rect")
                .style("fill", d => { 
                    if (d.key === 'Group' || d.key === 'Continent') return colorScales.get(d.key)(d.value)
                    else {
                        //console.log(colorScales.get(d.key)(d.value))
                        return colorScales.get(d.key)(d.value)
                    }
                })
                .style("stroke-width", 0.6)
                .style("stroke", d => {
                    if (d.key === 'Group' || d.key === 'Continent') return 'black'
                    else {
                        const col = colorScales.get(d.key)(d.value)
                        return d3.color(col).darker(1)
                    }
                })
                .style("opacity", 0.8)
                .transition().duration(1000).attr('fill-opacity', 1)
        }

        /*function genDivTooltip() {
            return d3.select("body")
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
                    .style('position', 'absolute')
        }*/
        function mouseOver() {
            divTooltip.style("display", "inline-block")
        }
        function mouseMove(text, pos) {
            const { x, y } = pos
            divTooltip
                .html(text)
                .style("left", `${x + 10}px`)
                .style("top", `${y}px`)
        }
        function mouseOut() {
            divTooltip.style("display", "none")
        }

        function continuousScale(selection, scaleId, scale, width, height) {
            selection.selectAll('*').remove()
            const maxIndex = 30
            const yScale = d3.scaleLinear().domain([0, maxIndex]).range([0,100])
            const colorScale = d3.scaleSequential().domain([100,0]).interpolator(d3[scale])
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
                        return enter.append('linearGradient')
                            .attr('id', 'linear-gradient.'+scaleId)
                            .attr('x1', '0%')
                            .attr('y1', '0%')
                            .attr('x2', '0%')
                            .attr('y2', '100%')
                    }
                )
            const sContainer = lContainer.selectAll('stops')
                .data(d3.range(maxIndex+1), d => colorScale(d))
                .join(
                    function(enter) {
                        return enter
                            .append('stop')
                            .attr('offset', d => yScale(d) + '%')
                            .attr('stop-color', d => colorScale(yScale(d)))
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
                        .transition().duration(1000)
                        .attr('width', width)
                        .attr('height', height)
                        .attr('fill', "url(#linear-gradient." + scaleId + ")")
                    }
                )
            const hLabel = gContainer.
                    append('text')
                    .attr('x', width+10)
                    .attr('y', 10)
                    .attr('text-anchor', 'right')
                    .attr('font-size', '10px')
                    .attr('font-family', 'sans-serif')
                    .attr('font-weight', 'bold')
                    .text('high')
            const lLabel = gContainer.
                    append('text')
                    .attr('x', width+10)
                    .attr('y', height)
                    .attr('text-anchor', 'right')
                    .attr('font-size', '10px')
                    .attr('font-family', 'sans-serif')
                    .attr('font-weight', 'bold')
                    .text('low')
            const title = gContainer.
                    append('text')
                    .attr('x', 0)
                    .attr('y', height + 20)
                    .attr('text-anchor', 'left')
                    .attr('font-size', '10px')
                    .attr('font-family', 'sans-serif')
                    .attr('font-weight', 'bold')
                    .text('Color Scale')

        }
        function csHandler(text, value) {
            //console.log(`text: ${text}, value: ${value}`)
            continuousScale(colorScaleSVG, 'colorscale', csMap.get(value), csW, csH)
            redraw(value)
        }

} // draw function to create the heatmap


// Text string to give the d3 js code to draw the heatmap
const cText = `
// draw the heatmap
function draw(dData, keys) {
    const width = 600
    const height = 400
    const margin = { top:40, bottom: 80, left:80, right: 20}
    const iW = width - margin.left - margin.right
    const iH = height - margin.top - margin.bottom
    const dropdwonMenuObj = d3.select('#dropdown-menu')
    const dwDiv = dropdwonMenuObj.append('div')
        .attr('class', 'cellDW')
        .attr('id', 'dropdown_div')
        .style('grid-column-start','1')
        .style('grid-column-end', '1')
        .style('margin', '1px')
    const gridObj = d3.select('#d3js_canvas')
    const hmDiv = gridObj.append('div')
        .attr('class', 'cell')
        .attr('id', 'heatmapmatrix_div')
        .attr('margin', '1px')
    const csDiv = gridObj.append('div')
        .attr('class', 'cell')
        .attr('id', 'colorscale_div')
    const hmSvg = hmDiv //d3.selectAll("#d3js_canvas")
        .append('svg')
        .attr('width',  width)
        .attr('height', height)
        .attr('transform', \`translate(0, \${5})\`)
    // create dropdowns
    dropdown({
        divObj: dwDiv,
        text: 'color scale: ',
        name: 'colorScale',
        fontSize: '0.8em',
        selection: 'Reds',
        keys: csKeys,
        handler: csHandler
    })
    // create a color scale for each key
    const colorScales = setColorScales(dData, csMap.get(csKeys[0]))
    // scales and axes
    const xScale = d3.scaleBand()
        .range([ 0, iW ])
        .domain(keys.slice(1))
        .padding(0.05)
    const yScale = d3.scaleBand()
        .range([ iH, 0 ])
        .domain(cKeys)
        .padding(0.05)
    const xAxis = d3.axisBottom(xScale).tickSize(0)
    const yAxis = d3.axisLeft(yScale).tickSize(0)
    hmSvg.append('g')
        .style('font-size', 10)
        .attr('transform', \`translate(\${margin.left}, \${iH})\`)
        .call(xAxis)
            .selectAll("text")  
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");
    hmSvg.append('g')
        .style('font-size', 10)
        .attr('transform', \`translate(\${margin.left}, 0)\`)
        .call(yAxis)
    // remove domain    
    hmSvg.selectAll('.domain').remove()
    // draw the heatmap
    const heatmap = hmSvg.append('g')
        .attr('width', iW)
        .attr('height', iH)
        .attr('transform', \`translate(\${margin.left}, 0 )\`)
    heatmapSVG = heatmap.selectAll().data(countires, function(d) { return d.Country + ':' + d.key })
        .join(
            enter => {
                const gEnter = enter.append('g')
                gEnter.append("rect")
                    .attr("x", (d,i) => { 
                        return xScale(d.key) 
                    })
                    .attr("y", (d,i) => { 
                        return yScale(d.Country)
                    })
                    .attr("rx", 3)
                    .attr("ry", 4)
                    .attr("width", xScale.bandwidth() )
                    .attr("height", yScale.bandwidth() )
                    .style("fill", d => { 
                        if (d.key === 'Group' || d.key === 'Continent') return colorScales.get(d.key)(d.value)
                        else return colorScales.get(d.key)(d.value)
                    })
                    .style("stroke-width", 0.6)
                    .style("stroke", d => {
                        if (d.key === 'Group' || d.key === 'Continent') return 'black'
                        else { 
                            const col = colorScales.get(d.key)(d.value)
                            return d3.color(col).darker(1)
                        }
                    })
                    .style("opacity", 0.9)
                    //.transition.duration(1000)
                    gEnter
                        .on("mouseover", function (event, elem) {
                            const e = gEnter.nodes()
                            const eIndex = e.indexOf(this)
                            d3.selectAll("rect").attr(
                                "fill-opacity",
                                (d, i) => {
                                    if (eIndex === i) return 1
                                    else return 0.3
                                }
                            )
                            mouseOver()
                        })
                        .on("mousemove", function (event, d) {
                            mouseMove(
                                \`Country: \${d.Country}<br>\${d.key}: \${d.value}\`,
                                { x: event.pageX, y: event.pageY }
                            )
                        })
                        .on("mouseout", function (event, d) {
                            d3.selectAll("rect").attr(
                                "fill-opacity",
                                1
                            )
                            mouseOut()
                        })
                    gEnter.transition().duration(1000).attr('fill-opacity', 1)
                return gEnter
                //return enter
            },
            (update) => update, // do nothing by update
            (exit) => exit.attr("class", (d, i) => console.log("d " + d)).remove()
        )
    // draw the color scales
    colorScaleSVG = csDiv.append('svg')
        .attr('width', 100)
        .attr('height', height)
        .attr('transform', \`translate(0, \${7})\`)
    csW = 30
    csH = height - margin.bottom - margin.top
    continuousScale(colorScaleSVG, 'colorscale', csMap.get(csKeys[0]), csW, csH)
}
`
const hlPre = d3.select('#hl-code').append('pre')
const hlCod = hlPre.append('code')
    .attr('class', 'language-javascript')
    .attr('style', 'border: 1px solid #C1BAA9')
    .text(cText)