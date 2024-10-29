import { dropdown } from "../common/gui.js"
import { genDivTooltip } from "../common/draw.js"
import { easyRandom } from "../../common/random.js"
import { keyCantor } from "../../common/utilities.js"
import {
    jiggle,
    collisionForce,
    gravitationalForce,
    attractingForceF,
    attractingForceA,
    repulsiveForceF,
    repulsiveForceA,
} from "./networks.js"
import { eigenvector } from "./centrality.js"

const url1 = "../data/lesmiserables.json"
drawAll(url1)
async function drawAll(url) {
    // global variables
    const dampConst = 10
    let damping = dampConst
    // draw
    const lesmiserables = await d3.json(url)

    const divTooltip = genDivTooltip()

    function fixPositions(nodes, bbox) {
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
        nodes.forEach((n) => {
            if (n.x < bbox.xmin) n.x = bbox.xmin
            if (n.x > bbox.xmax) n.x = bbox.xmax
            if (n.y < bbox.ymin) n.y = bbox.ymin
            if (n.y > bbox.ymax) n.y = bbox.ymax
        })
    }

    function initDisplacements(disp) {
        for (let d of disp) {
            d.x = 0
            d.y = 0
            d.d = 0
        }
    }
    function conservativeForces(K, Kc, Kg, beta, nodes, edges, bbox, disp) {
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
    }
    function positionVerlet(K, Kc, Kg, beta, nodes, edges, bbox, disp) {
        // compute conservative forces
        conservativeForces(K, Kc, Kg, beta, nodes, edges, bbox, disp)
        // update position, velocity and acceleration
        const w = damping
        const h = 0.008
        for (let n of nodes) {
            // position Verlet
            const xprev = n.xprev
            const yprev = n.yprev
            n.xprev = n.x
            n.yprev = n.y
            const fx = disp[n.index].x - w * n.vx + 0.001 * jiggle() // add some noise
            const fy = disp[n.index].y - w * n.vy + 0.001 * jiggle() // add some noise
            const dx = n.x - xprev + fx * h * h
            const dy = n.y - yprev + fy * h * h
            n.x = n.x + dx
            n.y = n.y + dy
            n.vx = (n.x - n.xprev) / h
            n.vy = (n.y - n.yprev) / h
        }
        //
        //fixPositions(nodes, bbox)
    }

    // ============================================================================
    // helper function
    function lerp (domain, range, u) {
        return (
            range[0] +
            ((u - domain[0]) / (domain[1] - domain[0])) *
                (range[1] - range[0])
        )
    }
    // drawing
    const width = 500
    const height = 500
    const menuCanvas = d3.select("#verlet-integration-layout")
    const svgCanvas = d3.select("#verlet-integration-svg")
    // gui
    const pKeys = ["Fruchterman-Reingold", "ForceAtlas2"]
    let pSel = "Fruchterman-Reingold"
    const pId = "layout-menu"
    const pDiv = menuCanvas.append("div").attr("class", "cell").attr("id", pId)
    const guiConfig = {
        divObj: pDiv,
        text: "layout: ",
        selection: pSel,
        keys: pKeys,
        handler: forceHandler,
    }
    dropdown(guiConfig)
    const mKeys = ["eigenvector", "degree"]
    let mSel = "node centrality"
    const mId = "centrality-menu"
    const mDiv = menuCanvas.append("div").attr("class", "cell").attr("id", mId)
    guiConfig.divObj = mDiv
    guiConfig.text = "node centrality: "
    guiConfig.selection = mSel
    guiConfig.keys = mKeys
    guiConfig.handler = centralityHandler
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
    const svg = svgCanvas
        .append("svg")
        .attr("class", "svg")
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

    const { nodes, edges, minDeg, maxDeg, minC, maxC, bbox } = initNetwork(lesmiserables, iW, iH)
    const sortedNodes = []
    nodes.forEach((n) => sortedNodes.push(n))
    sortedNodes.sort((n1, n2) => {
        return n1.c - n2.c
    })
    function centralityHandler(text, value) {
        if (value === "degree") {
            for (let n of nodes) n.r = lerp([minDeg, maxDeg], [minNodeRadius, maxNodeRadius], n.degree)
        } else if (value === "eigenvector") { 
            for (let n of nodes) n.r = lerp([minC, maxC], [minNodeRadius, maxNodeRadius], n.c)
        }
    }

    // d3
    // line generator
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
        .on("mouseover", function (event, d) {
            mouseOver(divTooltip)
        })
        .on("mousemove", function (event, d) {
            const pos = d3.pointer(event)
            mouseMove(divTooltip, d, {
                x: event.pageX,
                y: event.pageY
            })
        })
        .on("mouseout", function (event, d) {
            mouseOut(divTooltip)
        })
        .call(
            d3
                .drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragend)
        )

    function dragstarted(event, d) {
        damping = dampConst
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
    const KgF = 30 // 0.5
    const KgA = 10 // 0.01
    let Kg = KgF
    const Kc = 1500 // 1500
    const cR = 2 // collision radius control
    let K = Kf
    let attractingForce = attractingForceF
    let repulsiveForce = repulsiveForceF
    function forceHandler(text, value) {
        if (value === "Fruchterman-Reingold") {
            attractingForce = attractingForceF
            repulsiveForce = repulsiveForceF
            K = Kf
            Kg = KgF
        } else if (value === "ForceAtlas2") {
            attractingForce = attractingForceA
            repulsiveForce = repulsiveForceA
            K = Ka
            Kg = KgA
        }
    }
    // animaiton
    const disp = nodes.map((n) => {
        return { d: 0, x: 0, y: 0, index: n.index }
    })
    animate()
    function animate() {
        requestAnimationFrame(animate)
        if (damping > 3) damping *= 0.99
        positionVerlet(K, Kc, Kg, cR, nodes, edges, bbox, disp)
        fixPositions(nodes, bbox)
        redraw(nodeG, linkG)
    }
    function redraw(nodeG, linkG) {
        nodeG
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .attr("r", (d) => d.r)
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
            n.index = index
            n.x = 0
            n.y = 0
            n.xprev = 0
            n.yprev = 0
            n.vx = 0
            n.vy = 0
            n.fx = 0
            n.fy = 0
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
        let minDeg = Infinity
        let maxDeg = -Infinity
        for (let n of nodes) {
            if (n.degree < minDeg) minDeg = n.degree
            if (n.degree > maxDeg) maxDeg = n.degree
        }
        // compute node centrality
        const A = new Array(nodes.length).fill(null).map((e) => [])
        for (let e of edges) {
            A[e.source].push(e.target)
            A[e.target].push(e.source)
        }
        const maxIter = 100 //1000
        const eps = 1e-6
        const c_ = eigenvector(A, maxIter, eps)
        const minC = Math.min(...c_)
        const maxC = Math.max(...c_)

        for (let i = 0; i < nodes.length; i++) {
            nodes[i].c = c_[i]
        }
        // init node Radius with degree
        for (let n of nodes) n.r = lerp([minC, maxC], [minNodeRadius, maxNodeRadius], n.c)
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
            minDeg,
            maxDeg,
            minC,
            maxC,
            bbox,
        }
    }
    function mouseOver(tooltip) {
        tooltip.style("display", "inline-block")
    }
    function mouseMove(tooltip, d, pos) {
        const { x, y } = pos
        const text = d.name + '<br>' + 'degree: ' + d.degree + '<br>' + 'centrality: ' + d.c
        tooltip
            .html(text)
            .style("left", `${x + 10}px`)
            .style("top", `${y}px`)
    }
    function mouseOut(divTooltip) {
        divTooltip.style("display", "none")
    }
}
const cText = `
/**
 * Computes the eigenvector centrality for each node in the graph
 * @param {Array} A, adjacency matrix
 * @param {Number} maxIter, maximum number of iterations
 * @param {Number} eps, tolerance
 * @returns {Array} b_, array of eigenvector centrality values for each node in the graph
 */
function eigenvector(A, maxIter, eps) {
    let b_ = new Array(A.length).fill(1)
    let c_ = new Array(A.length).fill(0)
    let e_ = 0
    let r_ = Infinity
    while (Math.abs(e_ - r_) > eps && maxIter-- > 0) {
        e_ = r_
        r_ = 0
        c_.fill(0)
        for (let i = 0; i < A.length; i++) {
            for (let j of A[i]) {
                c_[i] += b_[j]
            }
            r_ += c_[i] * c_[i]
        }
        r_ = Math.sqrt(r_)
        for (let i = 0; i < A.length; i++) {
            b_[i] = c_[i] / r_
        }
    }
    const m_ = Math.max(...b_)
    for (let i = 0; i < A.length; i++) {
        b_[i] /= m_
    }
    return b_
}
`
const hlPre = d3.select("#hl-code").append("pre")
const hlCod = hlPre
    .append("code")
    .attr("class", "language-javascript")
    .attr("style", "border: 1px solid #C1BAA9")
    .text(cText)
