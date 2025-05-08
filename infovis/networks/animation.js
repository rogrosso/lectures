import { genDivTooltip } from "../common/draw.js"

const url = "../data/photoviz_dynamic.gexf"

drawAll(url) 
async function drawAll(url) {
    const response = await fetch(url)
    const text = await response.text()
    const parser = new DOMParser()
    const gexfData = parser.parseFromString(text, 'text/xml')
    draw(gexfData)
}

function xmlToJson(xml) {
    var obj = {};
    if (xml.nodeType == 1) {
        if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType == 3) {
        obj = xml.nodeValue;
    }
    if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof (obj[nodeName]) == "undefined") {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof (obj[nodeName].push) == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }
    return obj;
}
/**
 * Computes the network graph from a gexf file
 * @param {JSON} jsonObj, json object containing the graph in gexf format
 * @returns {Object} network
 */
function network(jsonObj) {
    // determine time interval
    const start = +jsonObj.graph["@attributes"].start
    const end = +jsonObj.graph["@attributes"].end
    // collect nodes and edges
    const nodes = jsonObj.graph.nodes.node
    const edges = jsonObj.graph.edges.edge
    // graph nodes and edges
    const nList = []
    const eList = []
    // node ids might start at any position
    // use a map to map start id to 0
    const nodeMap = new Map();
    let pos = 0;
    // compute nodes
    nodes.forEach((n,index) => {
        const nid = +n["@attributes"].id
        const label = n["@attributes"].label
        nodeMap.set(nid, pos)
        const gnode = { pos: pos, label: label, id: nid, index: index }
        //  compute node times intervals
        gnode.start = [];
        gnode.end = [];
        let sVal = start
        let eVal = end
        if (n.hasOwnProperty('spells')) {
            if (Object.prototype.toString.call(n.spells.spell) !== '[object Array]') {
                if (n.spells.spell['@attributes'].hasOwnProperty('start')) {
                    sVal = +n.spells.spell['@attributes'].start
                }
                if (n.spells.spell['@attributes'].hasOwnProperty('end')) {
                    eVal = +n.spells.spell['@attributes'].end
                }
                gnode.start.push(sVal);
                gnode.end.push(eVal);
            }
            else {
                n.spells.spell.forEach(function (s) {
                    if (s['@attributes'].hasOwnProperty('start')) {
                        sVal = +s['@attributes'].start
                    }
                    if (s['@attributes'].hasOwnProperty('end')) {
                        eVal = +s['@attributes'].end
                    }
                    gnode.start.push(sVal)
                    gnode.end.push(eVal)
                })
            }
        } else {
            // node has no spells, it should have attributes start and end
            if (n['@attributes'].hasOwnProperty('start')) {
                sVal = +n['@attributes'].start
            }
            if (n['@attributes'].hasOwnProperty('end')) {
                eVal = +n['@attributes'].end
            }
            gnode.start.push(sVal);
            gnode.end.push(eVal);
        }
        nList.push(gnode);
        // next node pos
        pos++;
    })
    //return nList
    edges.forEach((e, index) => {
        const eid = +e["@attributes"].id
        const eSource = +e["@attributes"].source
        const eTarget = +e["@attributes"].target
        const nsrc = nodeMap.get(eSource)
        const ndst = nodeMap.get(eTarget)
        let weight = 1.0
        let sVal = start
        let eVal = end
        if (e["@attributes"].hasOwnProperty('weight')) {
            weight = +e["@attributes"].weight
        }
        const gedge = { source: nsrc, target: ndst, weight: weight, index: index }
        // dynamics graphs
        gedge.start = []
        gedge.end = []
        if (e.hasOwnProperty('spells')) {
            if (Object.prototype.toString.call(e.spells.spell) !== '[object Array]') {
                if (e.spells.spell['@attributes'].hasOwnProperty('start')) {
                    sVal = +e.spells.spell['@attributes'].start
                }
                if (e.spells.spell['@attributes'].hasOwnProperty('end')) {
                    eVal = +e.spells.spell['@attributes'].end
                }
                gedge.start.push(sVal);
                gedge.end.push(eVal);
            }
            else {
                e.spells.spell.forEach(function (s) {
                    if (s['@attributes'].hasOwnProperty('start')) {
                        sVal = +s['@attributes'].start
                    }
                    if (s['@attributes'].hasOwnProperty('end')) {
                        eVal = +s['@attributes'].end
                    }
                    gedge.start.push(sVal)
                    gedge.end.push(Val)
                })
            }
        } else {
            // node has no spells, it should have attributes start and end
            if (e['@attributes'].hasOwnProperty('start')) {
                sVal = +e['@attributes'].start
            }
            if (e['@attributes'].hasOwnProperty('end')) {
                eVal = +e['@attributes'].end
            }
            gedge.start.push(start);
            gedge.end.push(end);
        }
        eList.push(gedge)
    })
    return { start: start, end: end, nodes: nList, edges: eList }
}
function draw(data) {
    const jsonData = xmlToJson(data)
    const gexfData = network(jsonData.gexf)
    // process network data for rendering
    const nodes = gexfData.nodes
    const edges = gexfData.edges
    for (let i = 0; i < nodes.length; i++) {
        nodes[i].c = 0
        nodes[i].x = 0
        nodes[i].y = 0
        nodes[i].r = 0
    }
    edges.forEach(l => {
        nodes[l.source].c++
        nodes[l.target].c++
    })
    // render
    render(gexfData)
}
function render(network) { 
    const divTooltip = genDivTooltip()
    const canvas = d3.select('#dynamic-network')
    const layoutCanvas = canvas.append("div").attr("class", "cell").attr("id", "layout-canvas")
    const width = 500
    const height = 500
    const tOffset = 30
    const lOffset = 80
    const margin = { top: 5, bottom: 5, left: 5, right: 5 }
    const svg = layoutCanvas.append('svg')
        .attr('width', width)
        .attr('height', height)
    const menuCanvas = canvas.append("div").attr("class", "cell").attr("id", "menu-canvas")
    const menuSvg = menuCanvas.append('svg')
        .attr('width', width)
        .attr('height', tOffset + lOffset)
    
    svg.call(dynamicLayout, {
        menuSvg,
        divTooltip,
        width,
        height,
        tOffset,
        lOffset,
        margin: { top: 10, right: 10, bottom: 10 + tOffset + lOffset, left: 10 },
        network: network
    })
}

function dynamicLayout(selection, props) {
    const {
        menuSvg,
        divTooltip,
        width,
        height,
        tOffset,
        lOffset,
        margin,
        network
    } = props

    const tStart = network.start
    const tEnd = network.end
    const iw = width - margin.left - margin.right
    const ih = height - margin.top - margin.bottom
    const center = { x: margin.left + iw / 2, y: margin.top + ih / 2 + tOffset }
    const textColorLight = '#8E8883'
    const textColorMain = '#635F5D'
    const edgeOpacity = 0.4
    const nodeOpacity = 1

    // compute nodes layout
    const nodes = network.nodes
    const links = network.edges
    const minDeg = d3.min(nodes, d => d.c)
    const maxDeg = d3.max(nodes, d => d.c)
    const nScale = d3.scaleLinear()
        .domain([minDeg, maxDeg])
        .range([4, 15])
    for (let n of nodes) n.r = nScale(n.c)
    const cScale = d3.scaleSequential()
        //.interpolator(d3.interpolatePurples)
        .interpolator(d3.interpolatePuRd)
        .domain([-20, maxDeg])

    const gLayout = selection.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .attr('class', 'svg_force_layout')
        .attr('width', iw)
        .attr('height', ih)
    // helper 
    const lineGenerator = d3.line().curve(d3.curveBasis)
    // shapes colors
    const nodeColor = '#deb887'
    const strokeColor = '#a52a2a'
    const edgeColor = '#1e90ff'

    // compute layout
    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links))
        .force('charge', d3.forceManyBody().strength(-12).theta(0.2))
        .force('center', d3.forceCenter(center.x, center.y).strength(0.5))
        .force('collision', d3.forceCollide().radius(d => 2*d.r))
        .force('positionX', d3.forceX(center.x))
        .force('positionY', d3.forceY(center.y))

    const beta = 0.2
    const controlPoints = (nodes, edge, beta) => {
        const source = nodes[edge.source.index]
        const target = nodes[edge.target.index]
        const d0 = [source.x, source.y]
        const d2 = [target.x, target.y]
        const x = (d0[0] + d2[0]) / 2
        const y = (d0[1] + d2[1]) / 2
        const vx = (d2[0] - d0[0]) / 2
        const vy = (d2[1] - d0[1]) / 2
        const d1 = [x - beta * (vy), y + beta * vx]
        return [d0, d1, d2]
    }
    const link = selection.append("g")
        .selectAll("path")
        .data(links)
        .join("path")
            .attr('d', d => lineGenerator(controlPoints(nodes, d, beta)))
            .attr('stroke', d => edgeColor)
            .attr("stroke-width", 1.5)
            .attr('fill', 'none')
            .attr('opacity', edgeOpacity)

    const node = selection.append('g') //svg.append("g")
        .attr("stroke", strokeColor)
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
            .attr('r', d => nScale(d.c))
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("fill", d => cScale(d.c)) // nodeColor)
            .attr('opacity', nodeOpacity)
            .on("mouseover", function (event, d) {
                mouseOver(divTooltip)
            })
            .on("mousemove", function (event, d) {
                const pos = d3.pointer(event)
                mouseMove(divTooltip, d.label, {
                    x: event.pageX,
                    y: event.pageY
                })
            })
            .on("mouseout", function (event, d) {
                mouseOut(divTooltip)
            })
            .call(drag(simulation))

    simulation.on("tick", () => {
        link
            .attr('d', d => lineGenerator(controlPoints(nodes, d, beta)))
        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    })

    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    //============================================================================================
    //  Brushing
    //    plot a time axis
    //    define brushing area
    //============================================================================================
    const xScale = d3.scaleLinear()
        .domain([tStart, tEnd])
        .range([0, iw])
    //.nice();

    const grp = menuSvg.append('g') 
    grp.append('rect')
            .attr('class', 'brush-area')
            .attr('width', iw + 20)
            .attr('height', tOffset + lOffset) 
            .attr('fill', 'none')
            .attr('stroke', '#0C4E00')
    const g = grp.selectAll('g.container') //selection.selectAll('g.container')
        .data([null])
        .join('g')
        .attr('class', 'container')
        .attr('transform', `translate(${margin.left},${5})`)
    

    const xAxis = d3.axisBottom(xScale)
        .tickPadding(15);
    xAxis.ticks(8)

    const xAxisG = g.append('g').selectAll('.x-axis')
        .data([null])
        .join('g')
        .attr('class', 'x-axis')
        .style('font-family', 'sans-serif')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', null)
        //.attr('transform', `translate(0,${ih + tOffset})`)
        .attr('transform', `translate(0,${tOffset})`)
        .call(xAxis)

    const xAxisLabelText = xAxisG
        .append('text')
        .join('text')
        .attr('class', 'axis-label')
        .attr('y', 55)
        .style('font-family', 'sans-serif')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .attr('fill', textColorLight)
        .attr('x', iw / 2)
        .text('time slider')

    const brush = d3.brushX()
        //.extent([[0, ih], [iw, ih + tOffset]])
        .extent([[0, 0], [iw, tOffset]])
        .on('start', brushed)
        .on('brush', brushed)
        .on('end', brushed)

    const brushG = g.append('g')
        .attr('class', 'brush')
    const brushArea = brushG.append('rect')
        .attr('x', 0)
        .attr('y', ih)
        .attr('width', iw)
        .attr('height', tOffset + 1)
        .attr('fill', '#fff5ee')
        .attr('stroke', 'tan')
    const tSlider = g.append('g')
        .attr('class', 'time-slider')
        .call(brush)
        .call(brush.move, [0, 10].map(xScale))
        .on("dblclick", dblclicked)

    function dblclicked() {
        const selection = d3.brushSelection(this) ? null : xScale.range();
        d3.select(this).call(brush.move, selection);
    }

    function visible(tS, tE, e) {
        for (let i = 0; i < e.start.length; i++) {
            if (tS <= e.end[i] && e.start[i] <= tE)
                return true
        }
        return false
    }
    function brushed(e) {
        if (e.selection === null) {
            link
                .attr('opacity', edgeOpacity)
            node
                .attr('opacity', 1)
        }
        else {
            for (let n of nodes) n.c = 0
            const tS = xScale.invert(e.selection[0])
            const tE = xScale.invert(e.selection[1])
            link
                .attr('opacity', d => {
                    // an edge if visible if the time interval overlap 
                    // and if the end nodes are visible
                    const eFlag = visible(tS, tE, d)
                    const sFlag = visible(tS, tE, nodes[d.source.index])
                    const tFlag = visible(tS, tE, nodes[d.target.index])
                    if (eFlag && sFlag && tFlag) {
                        nodes[d.source.index].c++
                        nodes[d.target.index].c++
                        return edgeOpacity
                    }
                    else {
                        return 0
                    }
                })
            node
                .attr('opacity', d => {
                    if (visible(tS, tE, d)) {
                        return nodeOpacity
                    }
                    else {
                        return 0
                    }
                })
                .attr('r', d => nScale(d.c))
                .attr('fill', d => cScale(d.c))
        }
    }

}

function mouseOver(tooltip) {
    tooltip.style("display", "inline-block")
}
function mouseMove(tooltip, name, pos) {
    const { x, y } = pos
    tooltip
        .html(name)
        .style("left", `${x + 10}px`)
        .style("top", `${y}px`)
}
function mouseOut(divTooltip) {
    divTooltip.style("display", "none")
}

const cText = `
/**
 * Computes the network graph from a gexf file
 * @param {JSON} jsonObj, json object containing the graph in gexf format
 * @returns {Object} network
 */
function network(jsonObj) {
    // determine time interval
    const start = +jsonObj.graph["@attributes"].start
    const end = +jsonObj.graph["@attributes"].end
    // collect nodes and edges
    const nodes = jsonObj.graph.nodes.node
    const edges = jsonObj.graph.edges.edge
    // graph nodes and edges
    const nList = []
    const eList = []
    // node ids might start at any position
    // use a map to map start id to 0
    const nodeMap = new Map();
    let pos = 0;
    // compute nodes
    nodes.forEach(n => {
        const nid = +n["@attributes"].id
        const label = n["@attributes"].label
        nodeMap.set(nid, pos)
        const gnode = { pos: pos, label: label, id: nid }
        //  compute node times intervals
        gnode.start = [];
        gnode.end = [];
        let sVal = start
        let eVal = end
        if (n.hasOwnProperty('spells')) {
            if (Object.prototype.toString.call(n.spells.spell) !== '[object Array]') {
                if (n.spells.spell['@attributes'].hasOwnProperty('start')) {
                    sVal = +n.spells.spell['@attributes'].start
                }
                if (n.spells.spell['@attributes'].hasOwnProperty('end')) {
                    eVal = +n.spells.spell['@attributes'].end
                }
                gnode.start.push(sVal);
                gnode.end.push(eVal);
            }
            else {
                n.spells.spell.forEach(function (s) {
                    if (s['@attributes'].hasOwnProperty('start')) {
                        sVal = +s['@attributes'].start
                    }
                    if (s['@attributes'].hasOwnProperty('end')) {
                        eVal = +s['@attributes'].end
                    }
                    gnode.start.push(sVal)
                    gnode.end.push(eVal)
                })
            }
        } else {
            // node has no spells, it should have attributes start and end
            if (n['@attributes'].hasOwnProperty('start')) {
                sVal = +n['@attributes'].start
            }
            if (n['@attributes'].hasOwnProperty('end')) {
                eVal = +n['@attributes'].end
            }
            gnode.start.push(sVal);
            gnode.end.push(eVal);
        }
        nList.push(gnode);
        // next node pos
        pos++;
    })
    //return nList
    edges.forEach(e => {
        const eid = +e["@attributes"].id
        const eSource = +e["@attributes"].source
        const eTarget = +e["@attributes"].target
        const nsrc = nodeMap.get(eSource)
        const ndst = nodeMap.get(eTarget)
        let weight = 1.0
        let sVal = start
        let eVal = end
        if (e["@attributes"].hasOwnProperty('weight')) {
            weight = +e["@attributes"].weight
        }
        const gedge = { source: nsrc, target: ndst, weight: weight }
        // dynamics graphs
        gedge.start = []
        gedge.end = []
        if (e.hasOwnProperty('spells')) {
            if (Object.prototype.toString.call(e.spells.spell) !== '[object Array]') {
                if (e.spells.spell['@attributes'].hasOwnProperty('start')) {
                    sVal = +e.spells.spell['@attributes'].start
                }
                if (e.spells.spell['@attributes'].hasOwnProperty('end')) {
                    eVal = +e.spells.spell['@attributes'].end
                }
                gedge.start.push(sVal);
                gedge.end.push(eVal);
            }
            else {
                e.spells.spell.forEach(function (s) {
                    if (s['@attributes'].hasOwnProperty('start')) {
                        sVal = +s['@attributes'].start
                    }
                    if (s['@attributes'].hasOwnProperty('end')) {
                        eVal = +s['@attributes'].end
                    }
                    gedge.start.push(sVal)
                    gedge.end.push(Val)
                })
            }
        } else {
            // node has no spells, it should have attributes start and end
            if (e['@attributes'].hasOwnProperty('start')) {
                sVal = +e['@attributes'].start
            }
            if (e['@attributes'].hasOwnProperty('end')) {
                eVal = +e['@attributes'].end
            }
            gedge.start.push(start);
            gedge.end.push(end);
        }
        eList.push(gedge)
    })
    return { start: start, end: end, nodes: nList, edges: eList }
}
`
const hlPre = d3.select("#hl-code").append("pre")
const hlCod = hlPre
    .append("code")
    .attr("class", "language-javascript")
    .attr("style", "border: 1px solid #C1BAA9")
    .text(cText)