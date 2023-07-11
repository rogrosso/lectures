import { dropdown } from "../common/gui.js"
import { genDivTooltip } from "../common/draw.js"
import { keyCantor } from "../../common/utilities.js"
import { easyRandom } from "../../common/random.js"
import {
    jiggle,
    collisionForce,
    gravitationalForce,
    attractingForceF,
    attractingForceA,
    repulsiveForceF,
    repulsiveForceA,
    controlFunction,
} from "./networks.js"
//import lesmiserables from "lesmiserables" assert { type: "json" }

const url1 = "../data/lesmiserables.json"
drawAll(url1)
async function drawAll(url1) {
    const response1 = await fetch(url1)
    const lesmiserables = await response1.json()

    const divTooltip = genDivTooltip()
    // control numerical integration
    const alphaMin = 0.3
    const initialAlpha = 2
    const restartAlphaF = 0.5
    const restartAlphaA = 0.5
    let restartAlpha = restartAlphaF
    const velDumpF = 1 / 100
    const velDumpA = 1 / 160
    const alphaF = controlFunction(alphaMin, initialAlpha, velDumpF)
    const alphaA = controlFunction(alphaMin, initialAlpha, velDumpA)
    let alpha = alphaF
    function initDisplacements(disp) {
        for (let d of disp) {
            d.x = 0
            d.y = 0
            d.d = 0
        }
    }
    function step(K, Kc, Kg, beta, nodes, edges, bbox, disp, alpha) {
        initDisplacements(disp)
        // compute displacements from repelling forces
        const nrNodes = nodes.length
        for (let i = 0; i < nrNodes; i++) {
            for (let j = i + 1; j < nrNodes; j++) {
                repulsiveForce(K, nodes, i, j, disp)
            }
        }
        // compute displacements from attracting forces
        edges.forEach((e) => {
            attractingForce(K, nodes, e, disp)
        })
        // collision force
        for (let i = 0; i < nrNodes; i++) {
            for (let j = i + 1; j < nrNodes; j++) {
                collisionForce(Kc, beta, nodes, i, j, disp)
            }
        }
        // apply a gravitational force
        nodes.forEach((n, i) => {
            gravitationalForce(Kg, n, bbox, disp)
        })
        // update nodes position
        nodes.forEach(function (n, i) {
            const dx = disp[n.id].x
            const dy = disp[n.id].y
            if (!isFinite(dx) || !isFinite(dy)) {
                console.log("not finite")
                return
            }
            if (isNaN(dx) || isNaN(dy)) {
                console.log("is NaN")
                return
            }
            const d = Math.sqrt(dx * dx + dy * dy)
            n.x += (dx / d) * Math.min(alpha, d) + 0.001 * jiggle()
            n.y += (dy / d) * Math.min(alpha, d) + 0.001 * jiggle()
        })

        // shift center of network to center of bbox
        const pos = { x: 0, y: 0 }
        nodes.forEach((n) => {
            pos.x += n.x
            pos.y += n.y
        })
        pos.x /= nodes.length
        pos.y /= nodes.length
        pos.x = (bbox.xmax + bbox.xmin) / 2 - pos.x
        pos.y = (bbox.ymax + bbox.ymin) / 2 - pos.y
        nodes.forEach((n) => {
            n.x += pos.x
            n.y += pos.y
        })
        // check bounding box
        nodes.forEach((n) => {
            if (n.x < bbox.xmin) n.x = bbox.xmin
            if (n.x > bbox.xmax) n.x = bbox.xmax
            if (n.y < bbox.ymin) n.y = bbox.ymin
            if (n.y > bbox.ymax) n.y = bbox.ymax
        })
    }

    // ============================================================================
    // drawing
    const width = 500
    const height = 500
    const canvas = d3.select("#force-directed-layout")
    // gui
    const pKeys = ["Fruchterman-Reingold", "ForceAtlas2"]
    let pSel = "Fruchterman-Reingold"
    const pId = "layout-menue"
    const pDiv = canvas.append("div").attr("class", "cell").attr("id", pId)
    const guiConfig = {
        divObj: pDiv,
        text: "layout: ",
        selection: pSel,
        keys: pKeys,
        handler: forceHandler,
    }
    dropdown(guiConfig)
    // D3
    const minNodeRadius = 4
    const maxNodeRadius = 16
    const nodeStrokeWidth = 1.5
    const selNodeStrokeWidth = 3
    const nodeStrokeColor = "#ffffff"
    const selNodeStrokeColor = "#867979"
    const offsetX = 7
    const offsetY = 7
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
        .attr("class", "force-directed-layout-group")
        .attr("transform", `translate(${width / 2}, ${height / 2})`)

    const { nodes, edges, bbox } = initNetwork(lesmiserables, iW, iH) // draw(lesmiserables, iW, iH)
    const sortedNodes = []
    nodes.forEach((n) => sortedNodes.push(n))
    sortedNodes.sort((n1, n2) => {
        return n1.c - n2.c
    })

    // d3
    const lineGenerator = d3.line().curve(d3.curveBasis)
    // collects groups of nodes
    const gSet = new Set()
    nodes.forEach((n) => {
        gSet.add(n.group)
    })
    const colors = [
        "#a6cee3",
        "#1f78b4",
        "#b2df8a",
        "#33a02c",
        "#fb9a99",
        "#e31a1c",
        "#fdbf6f",
        "#ff7f00",
        "#cab2d6",
        "#6a3d9a",
        "#D2691E",
        "#b15928",
    ]
    const colorScale = d3
        .scaleOrdinal()
        .domain(Array.from(gSet).sort())
        .range(colors)

    const beta = 0.2
    const linkG = netwG
        .append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("path")
        .data(edges)
        .join("path")
        .attr("d", (d) => {
            const source = nodes[d.source] // nMap.get(d.source)
            const target = nodes[d.target] //nMap.get(d.target)
            const d0 = [source.x, source.y]
            const d2 = [target.x, target.y]
            const x = (d0[0] + d2[0]) / 2
            const y = (d0[1] + d2[1]) / 2
            const vx = (d2[0] - d0[0]) / 2
            const vy = (d2[1] - d0[1]) / 2
            const d1 = [x - beta * vy, y + beta * vx]
            return lineGenerator([d0, d1, d2])
        })
        .attr("stroke", (d) => {
            const source = nodes[d.source]
            const target = nodes[d.target]
            const g = source.c > target.c ? source.group : target.group
            return colorScale(g)
        })
        .attr("stroke-width", (d) => Math.sqrt(d.value))
        .attr("fill", "none")
        .attr("opacity", 0.6)
    const nodeG = netwG
        .append("g")
        .attr("stroke", nodeStrokeColor)
        .attr("stroke-width", nodeStrokeWidth)
        .selectAll("circle")
        .data(sortedNodes)
        .join("circle")
        .attr("r", (d) => d.r)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("fill", (d) => colorScale(d.group))
        .call(
            d3
                .drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragend)
        )
    nodeG.append("title").text((d) => d.name)

    function dragstarted(event, d) {
        const x = event.sourceEvent.pageX + offsetX
        const y = event.sourceEvent.pageY - offsetY
        divTooltip
            .style("display", "inline-block")
            .html(d.name)
            .style("left", `${x}px`)
            .style("top", `${y}px`)
        d3.select(this)
            .attr("stroke", selNodeStrokeColor)
            .attr("stroke-width", selNodeStrokeWidth)
    }
    function dragged(event, d) {
        const x = event.sourceEvent.pageX + offsetX
        const y = event.sourceEvent.pageY - offsetY
        divTooltip.html(d.name).style("left", `${x}px`).style("top", `${y}px`)
        alpha.reset(restartAlpha)
        event.subject.x = event.x
        event.subject.y = event.y
    }
    function dragend(event, d) {
        divTooltip.style("display", "none")
        d3.select(this)
            .attr("stroke", nodeStrokeColor)
            .attr("stroke-width", nodeStrokeWidth)
    }

    // interaction
    const C = 0.45 // 0.52 // 0.4537 // 3 // 0.399
    const Kf = C * Math.sqrt((width * height) / nodes.length) // Fruchterman-Reindold
    const Ka = 3.8 // ForceAtlas2
    const KgF = 0.5
    const KgA = 0.5 //0.0001
    let Kg = KgF
    const Kc = 1500
    const cR = 2 // collision radius control
    let K = Kf
    let attractingForce = attractingForceF
    let repulsiveForce = repulsiveForceF
    function forceHandler(text, value) {
        if (value === "Fruchterman-Reingold") {
            alpha = alphaF
            restartAlpha = restartAlphaF
            attractingForce = attractingForceF
            repulsiveForce = repulsiveForceF
            K = Kf
            Kg = KgF
        } else if (value === "ForceAtlas2") {
            alpha = alphaA
            restartAlpha = restartAlphaA
            attractingForce = attractingForceA
            repulsiveForce = repulsiveForceA
            K = Ka
            Kg = KgA
        }
        alpha.reset(restartAlpha)
    }
    // animaiton
    const disp = nodes.map((n) => {
        return { d: 0, x: 0, y: 0, id: n.index }
    })
    animate()
    function animate() {
        requestAnimationFrame(animate)
        step(K, Kc, Kg, cR, nodes, edges, bbox, disp, alpha.next())

        redraw(nodeG, linkG)
    }
    function redraw(nodeG, linkG) {
        nodeG.attr("cx", (d) => d.x).attr("cy", (d) => d.y)
        linkG.attr("d", (d) => {
            const source = nodes[d.source]
            const target = nodes[d.target]
            const d0 = [source.x, source.y]
            const d2 = [target.x, target.y]
            const x = (d0[0] + d2[0]) / 2
            const y = (d0[1] + d2[1]) / 2
            const vx = (d2[0] - d0[0]) / 2
            const vy = (d2[1] - d0[1]) / 2
            const d1 = [x - beta * vy, y + beta * vx]
            return lineGenerator([d0, d1, d2])
        })
    }

    function initNetwork(data, width, height) {
        const { nodes, links } = data
        nodes.forEach((n, index) => {
            n.id = index
            n.x = 0
            n.y = 0
            n.r = 0
            n.c = 0
            n.degree = 0
        })
        // check that edges are unique
        const eMap = new Map()
        for (let e of links) {
            const key = keyCantor(e.source, e.target)
            eMap.set(key, e)
        }
        const edges = [] // undirected
        for (let [key, value] of eMap) {
            edges.push({
                source: value.source,
                target: value.target,
                value: value.value,
                key: key,
            })
        }
        eMap.clear()
        // compute node's degree
        for (let e of edges) {
            nodes[e.source].degree++
            nodes[e.target].degree++
        }
        // computes node centrality
        nodes.forEach((n) => {
            n.c = n.degree
        })
        // compute radius depending on centrality
        const minC = nodes.reduce(function (prev, curr) {
            return prev.c < curr.c ? prev : curr
        })
        const maxC = nodes.reduce(function (prev, curr) {
            return prev.c > curr.c ? prev : curr
        })
        const lerp = (domain, range, u) => {
            return (
                range[0] +
                ((u - domain[0]) / (domain[1] - domain[0])) *
                    (range[1] - range[0])
            )
        }
        const domain = [minC.c, maxC.c]
        const range = [minNodeRadius, maxNodeRadius]
        nodes.forEach((n) => (n.r = lerp(domain, range, n.c)))
        // init nodes position
        const random = new easyRandom(11) // wants always the same initial positions
        for (let n of nodes) {
            n.x = -width / 2 + random() * width
            n.y = -height / 2 + random() * height
        }
        // compute bounding box
        const bbox = {
            xmin: -width / 2,
            xmax: width / 2,
            ymin: -height / 2,
            ymax: height / 2,
        }
        return {
            nodes,
            edges,
            bbox,
        }
    }
} // drawAll()

const cText = `
// Attracting force Fruchterman-Reingold
function attractingForceF(K, nodes, e, disp) { 
    const d = distance(nodes[e.source], nodes[e.target])
    const fa = d.d * d.d / K
    disp[e.source].x += fa * d.x
    disp[e.source].y += fa * d.y
    disp[e.target].x -= fa * d.x
    disp[e.target].y -= fa * d.y
}
// Repulsive force Fruchterman-Reingold
function repulsiveForceF(K, nodes, i, j, disp) {
    // vector pointing from nodes[i] to nodes[j], and Euclidean distance
    const d = distance(nodes[i], nodes[j]) 
    const fr = K * K / d.d
    disp[i].x -= fr * d.x
    disp[i].y -= fr * d.y
    disp[j].x += fr * d.x
    disp[j].y += fr * d.y
}
// Attracting force ForceAtlas2
function attractingForceA(K, nodes, e, disp) {
    // vector pointing from n1 to n2, and Euclidean distance
    const d = distance(nodes[e.source], nodes[e.target]) 
    const fa = d.d
    disp[e.source].x += fa * d.x
    disp[e.source].y += fa * d.y
    disp[e.target].x -= fa * d.x
    disp[e.target].y -= fa * d.y
}
// Repulsive force ForceAtlas2
function repulsiveForceA(K, nodes, i, j, disp) {
    // vector pointing from nodes[i] to nodes[j], and Euclidean distance
    const d = distance(nodes[i], nodes[j]) 
    const fr = K * (nodes[i].degree + 1) * (nodes[j].degree + 1) / d.d
    disp[i].x -= fr * d.x
    disp[i].y -= fr * d.y
    disp[j].x += fr * d.x
    disp[j].y += fr * d.y
}
function initDisplacements(disp) {
    for (let d of disp) {
        d.x = 0
        d.y = 0
        d.d = 0
    }
}
// one single simulation step
function step(K, Kc, Kg, beta, nodes, edges, bbox, disp, alpha) {
    initDisplacements(disp)
    // compute displacements from repelling forces
    const nrNodes = nodes.length
    for (let i = 0; i < nrNodes; i++) {
        for (let j = i + 1; j < nrNodes; j++) {
            repulsiveForce(K, nodes, i, j, disp)
        }
    }
    // compute displacements from attracting forces
    edges.forEach(e => {
        attractingForce(K, nodes, e, disp)
    })
    // collision force 
    for (let i = 0; i < nrNodes; i++) {
        for (let j = i + 1; j < nrNodes; j++) {
            collisionForce(Kc, beta, nodes, i, j, disp)
        }
    }
    // apply a gravitational force
    nodes.forEach( (n,i) => {
        gravitationalForce(Kg, n, bbox, disp)
    })
    // update nodes position
    nodes.forEach(function (n, i) {
        const dx = disp[n.id].x
        const dy = disp[n.id].y
        if (!isFinite(dx) || !isFinite(dy)) {
            console.log('not finite')
            return
        }
        if (isNaN(dx) || isNaN(dy)) {
            console.log('is NaN')
            return
        }
        const d = Math.sqrt(dx * dx + dy * dy)
        n.x += dx / d * (Math.min(alpha, d)) + 0.001 * jiggle()
        n.y += dy / d * (Math.min(alpha, d)) + 0.001 * jiggle()
    })
    // shift center of network to center of bbox
    const pos = {x: 0, y: 0}
    nodes.forEach( n => {
        pos.x += n.x 
        pos.y += n.y 
    })
    pos.x /= nodes.length
    pos.y /= nodes.length
    pos.x = (bbox.xmax + bbox.xmin)/ 2 - pos.x
    pos.y = (bbox.ymax + bbox.ymin)/ 2 - pos.y
    nodes.forEach( n => {
        n.x += pos.x
        n.y += pos.y
    })
    // check bounding box
    nodes.forEach( n => {
        if (n.x < bbox.xmin) n.x = bbox.xmin;
        if (n.x > bbox.xmax) n.x = bbox.xmax;
        if (n.y < bbox.ymin) n.y = bbox.ymin;
        if (n.y > bbox.ymax) n.y = bbox.ymax;
    })
}
`
const hlPre = d3.select("#hl-code").append("pre")
const hlCod = hlPre
    .append("code")
    .attr("class", "language-javascript")
    .attr("style", "border: 1px solid #C1BAA9")
    .text(cText)
