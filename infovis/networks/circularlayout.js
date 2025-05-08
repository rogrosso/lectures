import { dropdown } from "../common/gui.js"
import { genDivTooltip } from "../common/draw.js"
//import lesmiserables from "lesmiserables" assert { type: "json" }

const url1 = "../data/lesmiserables.json"
drawAll(url1)
async function drawAll(url1) {
    const response1 = await fetch(url1)
    const lesmiserables = await response1.json()
    const divTooltip = genDivTooltip()
    const canvas = d3.select("#circular-layout")
    // menue
    const pKeys = ["curved lines", "straight lines", "edge bundling"]
    let pSel = "curved lines"
    const pId = "layout-menue"
    //const gridObj = d3.select('#circular-layout')
    const pDiv = canvas.append("div").attr("class", "cell").attr("id", pId)
    const guiConfig = {
        divObj: pDiv,
        text: "edge type: ",
        selection: pSel,
        keys: pKeys,
        handler: pathHandler,
    }
    dropdown(guiConfig)

    const width = 500
    const height = 500
    const padding = 30
    const offsetX = 5
    const offsetY = 5
    const margin = { top: 5, bottom: 5, left: 5, right: 5 }
    const iW = width - margin.left - margin.right
    const iH = height - margin.top - margin.bottom
    const svg = canvas
        .append("svg")
        .attr("class", "bfs-svg")
        .attr("width", width)
        .attr("height", height)
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "white")
        .attr("stroke", "tan")
    const netwG = svg
        .append("g")
        .attr("class", "circular-layout-group")
        .attr("transform", `translate(${width / 2}, ${height / 2})`)

    function cubicBezier(t, lg, source, target) {
        const a1 = (t) => 0.2 * t
        const a2 = (t) => 0.8 * t
        const b1 = (t) => 0.1 * t
        const b2 = (t) => 0.2 * t
        const d0 = [source.x, source.y]
        const v0 = [target.x - source.x, target.y - source.y]
        const v1 = [-v0[1], v0[0]]
        const d1 = [
            source.x + a1(t) * v0[0] + b1(t) * v1[0],
            source.y + a1(t) * v0[1] + b1(t) * v1[1],
        ]
        const d2 = [
            source.x + a2(t) * v0[0] + b2(t) * v1[0],
            source.y + a2(t) * v0[1] + b2(t) * v1[1],
        ]
        const d3 = [target.x, target.y]
        return lg([d0, d1, d2, d3])
    }
    function straightEdges(t, lg, source, target) {
        const d0 = [source.x, source.y]
        const d1 = [target.x, target.y]
        return lg([d0, d1])
    }
    function bundledEdges(lg, e) {
        if (e.path.length === 3) {
            const ns = e.path[0]
            const nt = e.path[2]
            const v = {
                x: e.path[1].x,
                y: e.path[1].y,
            }
            return lg([ns, v, nt])
        } else {
            const ns = e.path[0]
            const nt = e.path[4]
            const v1 = {
                x: e.path[1].x,
                y: e.path[1].y,
            }
            const v2 = {
                x: e.path[2].x,
                y: e.path[2].y,
            }
            const v3 = {
                x: e.path[3].x,
                y: e.path[3].y,
            }
            return lg([ns, v1, v2, v3, nt])
        }
    }
    function draw(nodes, edges, group) {
        // d3
        group.selectAll("*").remove()
        const g = group.append("g").attr("class", "g_circular_layout")
        // compute number of classes for color scale
        const s_ = new Set()
        nodes.forEach((n) => s_.add(n.group))
        const domain = Array.from(s_.values())
        // helper
        const lg = d3.line().curve(d3.curveBasis)
        // nodes color
        const colorScale = d3
            .scaleOrdinal(d3.schemePaired)
            .domain(domain.sort())
        //const colorScale = d3.scaleOrdinal(d3.schemeSet3).domain(s_.values())
        // text scaling
        const tScale = d3
            .scaleLinear()
            .domain([d3.min(nodes, (d) => d.c), d3.max(nodes, (d) => d.c)])
            .range([10, 16])
        // paths
        const pathColor = "#6D191B"
        const a1 = 0.2
        const a2 = 0.8
        const b1 = 0.1
        const b2 = 0.2
        const eGroup = g
            .append("g")
            .selectAll("path")
            .data(edges)
            .join("path")
            .attr("d", (d) =>
                cubicBezier(1, lg, nodes[d.source], nodes[d.target])
            )
            .attr("stroke", (d) =>
                d3.hsl(colorScale(nodes[d.source].group)).darker(1)
            )
            .attr("stroke-width", 2)
            .attr("fill", "none")
            .attr("opacity", 0.2)
        const nGroup = g
            .append("g")
            .selectAll("circle")
            .data(nodes, function (d) {
                return d.id
            })
            .join(
                (enter) => {
                    enter
                        .append("circle")
                        .attr("cx", (d) => d.x)
                        .attr("cy", (d) => d.y)
                        .attr("r", (d) => d.r)
                        .attr("fill", (d) => colorScale(d.group))
                        .attr("stroke", (d) =>
                            d3.hsl(colorScale(d.group)).brighter(1)
                        )
                        .attr("name", (d) => d.name)
                        .on("mouseover", function (event, d) {
                            mouseOver(divTooltip, event, d)
                        })
                        .on("mousemove", function (event, d) {
                            mouseMove(divTooltip, event, d)
                        })
                        .on("mouseleave", function (event, d) {
                            mouseLeave(divTooltip, event, d)
                        })
                },
                (update) => update,
                (exit) => exit.remove()
            )
        return {
            eGroup,
            nGroup,
        }
    } // draw()
    initNetwork(lesmiserables)
    const { nodes, edges } = circularLayout(lesmiserables, iW, iH)
    const { groups } = controlPoints(lesmiserables, iW / 2, iH / 2)
    const { eGroup, nGroup } = draw(nodes, edges, netwG)

    function initNetwork(netw) {
        const { nodes, links: edges } = netw
        const s_ = new Set()
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].x = 0
            nodes[i].y = 0
            nodes[i].id = i
            nodes[i].r = 0
            nodes[i].c = 0
            nodes[i].degree = 0
            s_.add(nodes[i].group)
        }
        const uedges = [] // check edge uniqueness
        const setKey = (n0, n1) => {
            if (n0 < n1) {
                return n0 + "_" + n1
            } else {
                return n1 + "_" + n0
            }
        }
        const map = new Map()
        edges.forEach((e) => {
            const key = setKey(e.source, e.target)
            map.set(key, { source: e.source, target: e.target })
        })
        map.forEach((value) => {
            uedges.push(value)
        })
        uedges.forEach((l) => {
            nodes[l.source].degree++
            nodes[l.target].degree++
        })
        // computes node centrality
        // computes node centrelity
        let maxDegree = -Infinity
        let minDegree = Infinity
        nodes.forEach((n) => {
            maxDegree = maxDegree > n.degree ? maxDegree : n.degree
            minDegree = minDegree < n.degree ? minDegree : n.degree
        })
        const nodeScale = (d) => {
            const a = (d - minDegree) / (maxDegree - minDegree)
            return 1 + 4 * a
        }
        nodes.forEach((n) => {
            n.c = nodeScale(n.degree)
        })
    }
    function circularLayout(netw, width, height) {
        const { nodes, links } = netw
        // copy and sort nodes
        const sNodes = Array.from(nodes)
        //nodes.forEach( n => sNodes.push(n) )
        sNodes.sort((a, b) =>
            a.group != b.group ? b.group - a.group : b.c - a.c
        )
        // compute layout
        let sum = 0
        sNodes.forEach((n) => {
            sum += n.c
        })
        const alpha = (2 * Math.PI) / sum
        const radius = (R, gamma) => R * Math.sin(gamma / 2)
        let beta = Math.PI / 2
        let gamma = alpha * nodes[0].c
        const R = Math.min(width, height) * 0.4
        sNodes.forEach((n, i) => {
            n.x = R * Math.cos(beta)
            n.y = R * Math.sin(beta)
            n.r = radius(R, gamma)
            beta += gamma / 2
            gamma = alpha * sNodes[(i + 1) % sNodes.length].c
            beta += gamma / 2
        })
        return {
            nodes: nodes,
            edges: links,
        }
    }
    function controlPoints(netw, width, height) {
        const { nodes, links } = netw
        const groups = []
        for (let n of nodes) {
            if (!groups[n.group]) groups[n.group] = { group: n.group, c: 0 }
            groups[n.group].c += n.degree
        }
        circularLayout({ nodes: groups, links }, width / 2, height / 2)
        // compute edge paths
        for (let e of links) {
            const S = nodes[e.source]
            const Sg = groups[S.group]
            const T = nodes[e.target]
            const Tg = groups[T.group]
            const C = { x: 0, y: 0 }
            if (S.group == T.group) e.path = [S, Sg, T]
            else e.path = [S, Sg, C, Tg, T]
        }
        return {
            groups,
            edges: links,
        }
    }
    function mouseOver(divTooltip, event, d) {
        divTooltip.style("display", "inline-block")
        const x = event.pageX + offsetX
        const y = event.pageY - offsetY
        divTooltip.html(d.name).style("left", `${x}px`).style("top", `${y}px`)
    }
    function mouseMove(divTooltip, event, d) {
        const x = event.pageX + offsetX
        const y = event.pageY - offsetY
        divTooltip.html(d.name).style("left", `${x}px`).style("top", `${y}px`)
    }
    function mouseLeave(divTooltip, event, d) {
        divTooltip.style("display", "none")
    }
    let prev = "curved lines"
    function pathHandler(text, value) {
        if (value === "curved lines") {
            if (prev === "edge bundling") e1()
            else e2()
        } else if (value === "straight lines") {
            if (prev === "curved lines") e3()
            else e4()
        } else if (value === "edge bundling") {
            if (prev === "curved lines") e5()
            else e6()
        }
        prev = value
    }

    const alpha = 0.8
    function e1() {
        const lg = d3.line().curve(d3.curveBasis)
        const t2 = svg.transition().duration(1000)
        t2.selectAll("path").attrTween("d", (d, i, a) => {
            return function (t) {
                if (t < 1 / 2) {
                    const u = 2 * t
                    const lk = d3
                        .line()
                        .x((d) => d.x)
                        .y((d) => d.y)
                        .curve(d3.curveBundle.beta(alpha * (1 - u)))
                    return bundledEdges(lk, d)
                } else {
                    const u = 2 * (t - 1 / 2)
                    return cubicBezier(u, lg, nodes[d.source], nodes[d.target])
                }
            }
        })
    }
    function e2() {
        const lg = d3.line().curve(d3.curveBasis)
        const t2 = svg.transition().duration(1000)
        t2.selectAll("path").attrTween("d", (d, i, a) => {
            return function (t) {
                return cubicBezier(t, lg, nodes[d.source], nodes[d.target])
            }
        })
    }
    function e3() {
        const lg = d3.line().curve(d3.curveBasis)
        const t2 = svg.transition().duration(1000)
        t2.selectAll("path").attrTween("d", (d, i, a) => {
            return function (t) {
                return cubicBezier(1 - t, lg, nodes[d.source], nodes[d.target])
            }
        })
    }
    function e4() {
        const t2 = svg.transition().duration(1000)
        t2.selectAll("path").attrTween("d", (d, i, a) => {
            return function (t) {
                const lk = d3
                    .line()
                    .x((d) => d.x)
                    .y((d) => d.y)
                    .curve(d3.curveBundle.beta(alpha * (1 - t)))
                return bundledEdges(lk, d)
            }
        })
    }
    function e5() {
        const lg = d3.line().curve(d3.curveBasis)
        const t2 = svg.transition().duration(1000)
        t2.selectAll("path").attrTween("d", (d, i, a) => {
            return function (t) {
                if (t < 1 / 2) {
                    const u = 2 * t
                    return cubicBezier(
                        1 - u,
                        lg,
                        nodes[d.source],
                        nodes[d.target]
                    )
                } else {
                    const u = 2 * (t - 1 / 2)
                    const lk = d3
                        .line()
                        .x((d) => d.x)
                        .y((d) => d.y)
                        .curve(d3.curveBundle.beta(alpha * u))
                    return bundledEdges(lk, d)
                }
            }
        })
    }
    function e6() {
        const t2 = svg.transition().duration(1000)
        t2.selectAll("path").attrTween("d", (d, i, a) => {
            return function (t) {
                const lk = d3
                    .line()
                    .x((d) => d.x)
                    .y((d) => d.y)
                    .curve(d3.curveBundle.beta(alpha * t))
                return bundledEdges(lk, d)
            }
        })
    }

    /*
    // save svg
    const saveSVGButton = canvas.append('div')
    .attr('class', 'cell')
    .attr('id', 'save-svg')
    .append('button')
    .text('save svg')
    .on('click', function() {
        saveSVG(svg.node(), 'circulat-layout.svg')
    })
    */
} // drawAll()

const cText = `
function circularLayout(netw, width, height) {
    const { nodes, links } = netw
    // copy and sort nodes
    const sNodes = Array.from(nodes)
    //nodes.forEach( n => sNodes.push(n) )
    sNodes.sort((a, b) => (a.group != b.group) ? b.group - a.group : b.c - a.c)
    // compute layout
    let sum = 0
    sNodes.forEach(n => { sum += n.c })
    const alpha = (2 * Math.PI) / sum
    const radius = (R, gamma) => R * Math.sin(gamma / 2) 
    let beta = Math.PI / 2
    let gamma = alpha * nodes[0].c
    const R = Math.min(width, height) * 0.4
    sNodes.forEach((n, i) => {
        n.x = R * Math.cos(beta)
        n.y = R * Math.sin(beta)
        n.r = radius(R, gamma)
        beta += gamma / 2
        gamma = alpha * sNodes[(i + 1) % sNodes.length].c
        beta += gamma / 2
    })
    return {
        nodes: nodes,
        edges: links
    }
}
`
const hlPre = d3.select("#hl-code").append("pre")
const hlCod = hlPre
    .append("code")
    .attr("class", "language-javascript")
    .attr("style", "border: 1px solid #C1BAA9")
    .text(cText)

/*
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
*/