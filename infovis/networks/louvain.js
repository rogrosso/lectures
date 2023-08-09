

import { dropdown } from "../common/gui.js"
import { genDivTooltip } from "../common/draw.js"
import { randColorsHex } from "../common/colors.js"
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
import { betweenness } from "./centrality.js"
import { louvain } from "./communities.js"

/**
 * This example was taken from https://github.com/upphiminn/jLouvain
 */
const node_data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
    28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55,
    56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73
  ];
const edge_data = [{
    "source": 5,
    "target": 0,
    "weight": 1.2857142857142856
  }, {
    "source": 8,
    "target": 5,
    "weight": 0.125
  }, {
    "source": 10,
    "target": 5,
    "weight": 0.125
  }, {
    "source": 14,
    "target": 33,
    "weight": 0.2
  }, {
    "source": 16,
    "target": 17,
    "weight": 0.5
  }, {
    "source": 16,
    "target": 57,
    "weight": 0.2
  }, {
    "source": 17,
    "target": 16,
    "weight": 0.5
  }, {
    "source": 17,
    "target": 0,
    "weight": 0.25
  }, {
    "source": 20,
    "target": 38,
    "weight": 0.25
  }, {
    "source": 20,
    "target": 36,
    "weight": 0.8333333333333333
  }, {
    "source": 29,
    "target": 17,
    "weight": 0.5
  }, {
    "source": 32,
    "target": 17,
    "weight": 0.25
  }, {
    "source": 33,
    "target": 2,
    "weight": 0.3333333333333333
  }, {
    "source": 33,
    "target": 4,
    "weight": 0.2
  }, {
    "source": 34,
    "target": 35,
    "weight": 0.75
  }, {
    "source": 34,
    "target": 58,
    "weight": 0.16666666666666666
  }, {
    "source": 34,
    "target": 9,
    "weight": 0.5
  }, {
    "source": 35,
    "target": 34,
    "weight": 0.75
  }, {
    "source": 36,
    "target": 35,
    "weight": 0.3333333333333333
  }, {
    "source": 36,
    "target": 57,
    "weight": 0.2
  }, {
    "source": 38,
    "target": 0,
    "weight": 0.5
  }, {
    "source": 38,
    "target": 20,
    "weight": 0.25
  }, {
    "source": 38,
    "target": 58,
    "weight": 0.16666666666666666
  }, {
    "source": 37,
    "target": 35,
    "weight": 0.5833333333333333
  }, {
    "source": 39,
    "target": 7,
    "weight": 0.2
  }, {
    "source": 40,
    "target": 0,
    "weight": 0.5
  }, {
    "source": 41,
    "target": 21,
    "weight": 0.1111111111111111
  }, {
    "source": 41,
    "target": 52,
    "weight": 0.5
  }, {
    "source": 42,
    "target": 22,
    "weight": 0.5
  }, {
    "source": 43,
    "target": 15,
    "weight": 0.9663059163059161
  }, {
    "source": 44,
    "target": 43,
    "weight": 0.39285714285714285
  }, {
    "source": 45,
    "target": 14,
    "weight": 0.16666666666666666
  }, {
    "source": 45,
    "target": 58,
    "weight": 0.41666666666666663
  }, {
    "source": 46,
    "target": 47,
    "weight": 0.5095238095238095
  }, {
    "source": 47,
    "target": 46,
    "weight": 0.5095238095238095
  }, {
    "source": 48,
    "target": 46,
    "weight": 1.4773809523809522
  }, {
    "source": 49,
    "target": 30,
    "weight": 0.4583333333333333
  }, {
    "source": 50,
    "target": 8,
    "weight": 0.14285714285714285
  }, {
    "source": 51,
    "target": 8,
    "weight": 0.14285714285714285
  }, {
    "source": 51,
    "target": 0,
    "weight": 0.2
  }, {
    "source": 52,
    "target": 41,
    "weight": 0.5
  }, {
    "source": 53,
    "target": 20,
    "weight": 0.25
  }, {
    "source": 54,
    "target": 20,
    "weight": 0.25
  }, {
    "source": 56,
    "target": 54,
    "weight": 0.3333333333333333
  }, {
    "source": 57,
    "target": 58,
    "weight": 1.6666666666666665
  }, {
    "source": 58,
    "target": 0,
    "weight": 1.3666666666666665
  }, {
    "source": 59,
    "target": 0,
    "weight": 0.2
  }, {
    "source": 60,
    "target": 28,
    "weight": 0.16666666666666666
  }, {
    "source": 61,
    "target": 60,
    "weight": 0.16666666666666666
  }, {
    "source": 55,
    "target": 9,
    "weight": 1.3095238095238095
  }, {
    "source": 62,
    "target": 9,
    "weight": 0.39285714285714285
  }, {
    "source": 63,
    "target": 58,
    "weight": 0.5
  }, {
    "source": 64,
    "target": 57,
    "weight": 0.2
  }, {
    "source": 65,
    "target": 64,
    "weight": 0.3333333333333333
  }, {
    "source": 66,
    "target": 15,
    "weight": 0.25
  }, {
    "source": 67,
    "target": 15,
    "weight": 2.2
  }, {
    "source": 67,
    "target": 20,
    "weight": 0.25
  }, {
    "source": 68,
    "target": 15,
    "weight": 0.25
  }, {
    "source": 69,
    "target": 22,
    "weight": 0.6984126984126984
  }, {
    "source": 70,
    "target": 9,
    "weight": 0.14285714285714285
  }, {
    "source": 70,
    "target": 22,
    "weight": 0.3333333333333333
  }, {
    "source": 71,
    "target": 14,
    "weight": 0.3333333333333333
  }, {
    "source": 72,
    "target": 71,
    "weight": 0.3333333333333333
  }, {
    "source": 73,
    "target": 3,
    "weight": 0.2222222222222222
  }];

function testNetwork01(node_data, edge_data) {
    const nodes = []
    for (let n of node_data) {
        nodes.push({
            index: n,
            name: n.toString(),
            x: 0,
            y: 0,
            xprev: 0,
            yprev: 0,
            vx: 0,
            vy: 0,
            fx: 0,
            fy: 0,
            r: 0,
            c: 0,
            degree: 0
        })
    }
    const edges = []
    for (let e of edge_data) {
        edges.push({
            source: e.source,
            target: e.target,
            value: e.weight,
            key: keyCantor(e.source, e.target),
            weight: e.weight
        })
    }
    return {
        nodes,
        links: edges
    }
}

function testNetwork02() {
    const nodes = []
    for (let i = 0; i < 16; i++) {
        nodes.push(   
            { 
                index: i, 
                name: i.toString(), 
                x: 0, 
                y: 0, 
                xprev: 0, 
                yprev: 0, 
                vx: 0, 
                vy: 0, 
                fx: 0, 
                fy: 0, 
                r: 0, 
                c: 0, 
                degree: 0 
            }
        )
    }
    const edges = [
        { source: 0, target: 2, value: 1 },
        { source: 0, target: 2, value: 1 },
        { source: 0, target: 2, value: 1 },
        { source: 0, target: 3, value: 1 },
        { source: 0, target: 4, value: 1 },
        { source: 0, target: 5, value: 1 },
        { source: 1, target: 2, value: 1 },
        { source: 1, target: 4, value: 1 },
        { source: 1, target: 7, value: 1 },
        { source: 2, target: 0, value: 1 },
        { source: 2, target: 1, value: 1 },
        { source: 2, target: 4, value: 1 },
        { source: 2, target: 5, value: 1 },
        { source: 2, target: 6, value: 1 },
        { source: 3, target: 0, value: 1 },
        { source: 3, target: 7, value: 1 },
        { source: 4, target: 0, value: 1 },
        { source: 4, target: 1, value: 1 },
        { source: 4, target: 2, value: 1 },
        { source: 4, target: 10, value: 1 },
        { source: 5, target: 0, value: 1 },
        { source: 5, target: 2, value: 1 },
        { source: 5, target: 7, value: 1 },
        { source: 5, target: 11, value: 1 },
        { source: 6, target: 2, value: 1 },
        { source: 6, target: 7, value: 1 },
        { source: 6, target: 11, value: 1 },
        { source: 7, target: 1, value: 1 },
        { source: 7, target: 3, value: 1 },
        { source: 7, target: 5, value: 1 },
        { source: 7, target: 6, value: 1 },
        { source: 8, target: 9, value: 1 },
        { source: 8, target: 10, value: 1 },
        { source: 8, target: 11, value: 1 },
        { source: 8, target: 14, value: 1 },
        { source: 8, target: 15, value: 1 },
        { source: 9, target: 8, value: 1 },
        { source: 9, target: 12, value: 1 },
        { source: 9, target: 14, value: 1 },
        { source: 10, target: 4, value: 1 },
        { source: 10, target: 8, value: 1 },
        { source: 10, target: 11, value: 1 },
        { source: 10, target: 12, value: 1 },
        { source: 10, target: 13, value: 1 },
        { source: 10, target: 14, value: 1 },
        { source: 10, target: 14, value: 1 },
        { source: 11, target: 5, value: 1 },
        { source: 11, target: 6, value: 1 },
        { source: 11, target: 8, value: 1 },
        { source: 11, target: 10, value: 1 },
        { source: 11, target: 13, value: 1 },
        { source: 12, target: 9, value: 1 },
        { source: 12, target: 10, value: 1 },
        { source: 13, target: 10, value: 1 },
        { source: 13, target: 11, value: 1 },
        { source: 14, target: 8, value: 1 },
        { source: 14, target: 9, value: 1 },
        { source: 14, target: 10, value: 1 },
        { source: 15, target: 8, value: 1 },
    ]
    for (let e of edges) e.weight = 1
    return {
        nodes,
        links: edges
    }
}
function testNetwork03(celegans) {
    const { nodes, edges: links } = celegans
    for (let e of links) e.weight = 1
    for (let n of nodes) {
        n.name = n.label
    }
    return {
        nodes,
        links
    }
}
const url1 = "../data/lesmiserables.json"
const url2 = "../data/celegans_modularity.json"
drawAll(url1, url2)
async function drawAll(url) {
    // global variables
    const dampConst = 100
    let damping = dampConst
    // draw
    const lesmiserables = await d3.json(url)
    for (let e of lesmiserables.links) e.weight = 1
    const celegans = await d3.json(url2)

    // tooltip
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
    const margin = { top: 5, bottom: 5, left: 5, right: 5 }
    const iW = width - margin.left - margin.right
    const iH = height - margin.top - margin.bottom
    // rendering parameters
    let netwG = undefined
    const beta = 0.2
    const minNodeRadius = 4
    const maxNodeRadius = 16
    const nodeStrokeWidth = 1.5
    const selNodeStrokeWidth = 3
    const nodeStrokeColor = "#ffffff"
    const selNodeStrokeColor = "#867979"
    const offsetX = 7
    const offsetY = 7

    // menu
    const menuCanvas = d3.select("#verlet-integration-layout")
    const svgCanvas = d3.select("#verlet-integration-svg")
    // gui
    const dKeys = ['Les Miserables', 'celegans', 'test01', 'test02']
    let dSel = "Les Miserables"
    const dId = "data-menu"
    const dDiv = menuCanvas.append("div").attr("class", "cell").attr("id", dId)
    const guiConfig = {
        divObj: dDiv,
        text: "dataset: ",
        name: "dataset",
        fontSize: "12px",
        selection: dSel,
        keys: dKeys,
        handler: dataHandler,
    }
    dropdown(guiConfig) 
    const pKeys = ["Fruchterman-Reingold", "ForceAtlas2"]
    let pSel = "Fruchterman-Reingold"
    const pId = "layout-menu"
    const pDiv = menuCanvas.append("div").attr("class", "cell").attr("id", pId)
    guiConfig.divObj = pDiv
    guiConfig.text = "layout: "
    guiConfig.selection = pSel
    guiConfig.keys = pKeys
    guiConfig.handler = forceHandler
    dropdown(guiConfig)
    const mKeys = ["betweenness","degree"]
    let mSel = "node centrality"
    const mId = "centrality-menu"
    const mDiv = menuCanvas.append("div").attr("class", "cell").attr("id", mId)
    guiConfig.divObj = mDiv
    guiConfig.text = "node centrality: "
    guiConfig.selection = mSel
    guiConfig.keys = mKeys
    guiConfig.handler = centralityHandler
    dropdown(guiConfig)

    // data
    let network = lesmiserables
    const nodes = []
    const edges = []
    const disp = []
    let { minDeg, maxDeg, minC, maxC, bbox, nr_g } = initNetwork(network, iW, iH, nodes, edges) 
    setDisplacements(disp, nodes.length)
    function setDisplacements(disp, nrNodes) {
        disp.length = 0
        for (let i = 0; i < nrNodes; i++) {
            disp.push( { x: 0, y: 0, d: 0 } )
        }
    }

    // Force directed layout
    let force = 'Fruchterman-Reingold'
    let C = 0.45 // 0.52 // 0.4537 // 3 // 0.399
    let Kf = C * Math.sqrt((width * height) / nodes.length) // Fruchterman-Reindold
    let Ka = 3.8 // ForceAtlas2
    let KgF = 30 // 0.5
    let KgA = 10 // 0.01
    let Kg = KgF
    let Kc = 1500 // 1500
    let cRf = 4 // collision radius control Fruchterman-Reingold
    let cRa = 2 // collision radius control ForceAtlas2
    let K = Kf
    let cR = cRf

    function dataHandler(text, value) {
        damping = dampConst
        C = 0.45
        Ka = 3.8
        KgF = 30
        KgA = 10
        Kc = 1500
        cRf = 4
        cRa = 2
        if (value === "Les Miserables") {
            network = lesmiserables
        } else if (value === "celegans") {
            C = 0.9
            Ka = 1.5
            KgF = 20
            KgA = 10
            Kc = 1000
            cRf = 5
            cRa = 2
            network = testNetwork03(celegans)
        } else if (value === "test01") {
            network = testNetwork01(node_data, edge_data)
        } else if (value === "test02") {
            network = testNetwork02()
        }
        ( { minDeg, maxDeg, minC, maxC, bbox, nr_g } = initNetwork(network, iW, iH, nodes, edges) )
        Kf = C * Math.sqrt((width * height) / nodes.length)
        K = Kf
        if (force === 'Fruchterman-Reingold') {
            Kg = KgF
            cR = cRf
        } else if (force === 'ForceAtlas2') {
            Kg = KgA
            cR = cRa
        }
        //setDisplacements(disp, nodes.length)
        disp.length = 0
        for (let i = 0; i < nodes.length; i++) {
            disp.push( { x: 0, y: 0, d: 0 } )
        }
        ({ nodeG, linkG} = updateNetwork(netwG, nodes, edges))
    }

    // D3
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
    netwG = svg
        .append("g")
        .attr("class", "force-directed-layout-group")
        .attr("transform", `translate(${width / 2}, ${height / 2})`)

    function centralityHandler(text, value) {
        if (value === "degree") {
            for (let n of nodes) n.r = lerp([minDeg, maxDeg], [minNodeRadius, maxNodeRadius], n.degree)
        } else if (value === "betweenness") { 
            for (let n of nodes) n.r = lerp([minC, maxC], [minNodeRadius, maxNodeRadius], n.c)
        }
    }

    // d3
    // line generator
    const lineGenerator = d3.line().curve(d3.curveBasis)
    let nodeG, linkG
    ( {nodeG, linkG } = updateNetwork(netwG, nodes, edges) )
    function updateNetwork(selection, nodes, edges) {
        // can be done better, but for now this is simple
        selection.selectAll("g").remove()
        // color scale
        // collects groups of nodes
        const gSet = new Set()
        nodes.forEach((n) => {
            gSet.add(n.group)
        })
        const colors = []
        const colorGenerator = randColorsHex(1)
        for (let i = 0; i < gSet.size; i++) colors.push(colorGenerator())
        const colorScale = d3
            .scaleOrdinal()
            .domain(Array.from(gSet).sort())
            .range(colors)
        // draw edges
        const linkG = selection
            .append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("path")
            .data(edges)
            .join("path")
            .attr("d", (d) => {
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
            .attr("stroke", (d) => {
                const source = nodes[d.source]
                const target = nodes[d.target]
                const g = source.c > target.c ? source.group : target.group
                return colorScale(g)
            })
            .attr("stroke-width", (d) => Math.sqrt(d.value))
            .attr("fill", "none")
            .attr("opacity", 0.6)
        // draw nodes
        const nodeG = selection
            .append("g")
            .attr("stroke", nodeStrokeColor)
            .attr("stroke-width", nodeStrokeWidth)
            .selectAll("circle")
            .data(nodes, d => d.key)
            //.join("circle")
            .join( 
                enter => enter.append("circle")
                    .attr("r", (d) => d.r)
                    .attr("cx", (d) => d.x)
                    .attr("cy", (d) => d.y)
                    .attr("fill", (d) => colorScale(d.group))
                ,
                update => update,
                exit => exit.remove()
            )
        nodeG
            .on("mouseover", function (event, d) {
                mouseOver(divTooltip)
            })
            .on("mousemove", function (event, d) {
                const pos = d3.pointer(event)
                mouseMove(divTooltip, d.name + ", gr: " + d.group, {
                    x: event.pageX,
                    y: event.pageY
                })
            })
            .on("mouseout", function (event, d) {
                mouseOut(divTooltip)
            })
        nodeG
            .call(
                d3
                    .drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragend)
            )

        return {
            nodeG,
            linkG
        }
    }
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
    let attractingForce = attractingForceF
    let repulsiveForce = repulsiveForceF
    function forceHandler(text, value) {
        if (value === "Fruchterman-Reingold") {
            attractingForce = attractingForceF
            repulsiveForce = repulsiveForceF
            K = Kf
            Kg = KgF
            cR = cRf
            force = "Fruchterman-Reingold"
        } else if (value === "ForceAtlas2") {
            attractingForce = attractingForceA
            repulsiveForce = repulsiveForceA
            K = Ka
            Kg = KgA
            cR = cRa
            force = "ForceAtlas2"
        }
    }
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

    function initNetwork(data, width, height, nodes, edges) {
        //nodes.length = 0
        while (nodes.length > 0) nodes.pop()
        edges.length = 0 //data.links.length
        for (let i = 0; i < data.nodes.length; i++) { // }.forEach((n, index) => {
            nodes.push( {
                index : i,
                name : data.nodes[i].name,
                x : 0,
                y : 0,
                xprev : 0,
                yprev : 0,
                vx : 0,
                vy : 0,
                fx : 0,
                fy : 0,
                r : 0,
                c : 0,
                degree : 0,
                key: (100000 * Math.random()).toFixed(0)
            } )
        }
        // check that edges are unique
        const eMap = new Map()
        for (let e of data.links) {
            const key = keyCantor(e.source, e.target)
            eMap.set(key, e)
        }
        //const edges = [] // undirected
        for (let [key, value] of eMap) {
            edges.push({
                source: value.source,
                target: value.target,
                value: value.value,
                key: key,
                weight: value.weight
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
        const c_ = betweenness(nodes, A)
        const minC = Math.min(...c_)
        const maxC = Math.max(...c_)

        for (let i = 0; i < nodes.length; i++) {
            nodes[i].c = c_[i]
        }
        const nr_g = louvain(nodes, edges)
        // init node Radius with degree
        for (let n of nodes) n.r = lerp([minC, maxC], [minNodeRadius, maxNodeRadius], n.c)
        // init nodes position
        const random = new easyRandom(11) // wants always the same initial positions
        for (let n of nodes) {
            n.x = 0.5 * ( 1 - 2 * random() ) * width / 2 
            n.y = 0.5 * ( 1 - 2 * random() ) * height / 2 
        }
        // compute bounding box
        const bbox = {
            xmin: -width / 2,
            xmax: width / 2,
            ymin: -height / 2,
            ymax: height / 2,
        }
        return {
            minDeg,
            maxDeg,
            minC,
            maxC,
            bbox,
            nr_g,
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
}


const cText = `
/**
 * Implements the Louvain algorithm for community detection
 * Works on undirected graphs. It assumes that undirected edges are given only once, the adjacency matrix
 * is symmetric and will include both directions. Edges are weighted.
 * @param {Array} nodes, node array
 * @param {Array} edges, edge array
 * @returns {Number} number of communities
 */
export function louvain(nodes, edges) {
    let A_ = new Array(nodes.length).fill(null).map((e) => [])
    let m = 0
    for (let e of edges) {
        m += e.weight
        A_[e.source].push({index: e.target, weight: e.weight}) // the graph is undirected
        A_[e.target].push({index: e.source, weight: e.weight}) // use weights for convenience
    }
    const n = nodes.length
    // initialize nodes
    const n_ = []
    for (let n of nodes){
        n_.push({ 
            index: n.index, 
            c: n.index, // community
            k: n.degree, // total degree in undirected graph
            loop: 0, // number/weight of self loop, i.e. degree is 2 * loop 
            children: null, // children in tree generated by louvain algorithm
            parent: null // parent in tree generated by louvain algorithm
        })
    }
    let cFlag = true
    let mFlag = true
    let maxIter = 10
    while (cFlag && mFlag && maxIter > 0) {
        maxIter--
        // partition network into communities
        const q_ = init(n_)
        const mod1 = computeModularity(m, q_)
        cFlag = partition(A_, n_, q_, m)
        const mod2 = computeModularity(m, q_)
        if (mod2 <= mod1) {
            mFlag = false
        } else {
            agglomerate(q_, n_, A_)
        }
    }
    propagate(n_, nodes)
    return n_.length
}
/**
 * Initialize communities. Each node is a community.
 * @param {Array} n_, nodes
 * @returns {Map} map of nodes with community as key and nodes as value
 */
function init(n_) {
    const q_ = new Map()
    for (let n of n_) {
        if (q_.has(n.c)) {
            q_.get(n.c).nodes.add(n)
        } else {
            const nSet = new Set()
            nSet.add(n)
            q_.set(n.c, { 
                c: n.c, // community index
                nodes: nSet, // nodes in the community
                sIn: n.loop, // sum of the weights of the links inside the community
                sTot: n.k //+ n.loop //+ 2 * n.loop // total number of links/weights of all nodes in the community
            } )
        }
    }
    return q_
}
/**
 * Agglomerate communities into super nodes and compute the adjacency matrix of super nodes
 * and loops giving the links between nodes in the communities before agglomeration.
 * The degree of the super nodes already contains the loops.
 * @param {Map} q_, communities
 * @param {Array} n_, nodes
 * @param {Array} A_, adjacency matrix
 */
function agglomerate(q_, n_, A_) {
    const c_ = [] // super nodes
    const e_ = new Map() // super edges
    let index = 0
    for (let [key, value] of q_) {
        if (value.nodes.size > 0) {
            c_.push({
                index,
                c: key,
                k: value.sTot,
                loop: value.sIn
            })
            e_.set(key, {index: index, c: key, nodes: value.nodes})
            index++
        }
    }
    // compute adjacency matrix of super nodes
    const m_ = new Map() // super edges map
    for (let [key, value] of e_) {
        const i1 = value.index
        const c1 = value.c
        for (let n of value.nodes) {
            // collect all neighbors of this node 
            for (let e of A_[n.index]) {
                if (c1 !== n_[e.index].c) {
                    const i2 = e_.get(n_[e.index].c).index
                    const k_ = keyCantor(i1, i2)
                    if (m_.has(k_)) {
                        m_.get(k_).weight += e.weight
                    } else {
                        m_.set(k_, { source: i1, target: i2, weight: e.weight })
                    }
                }
            }
        }
    }
    // compute adjacency matrix of super nodes
    const A = new Array(c_.length).fill(null).map((e) => [])
    for (let [key, value] of m_) {
        A[value.source].push({index: value.target, weight: value.weight/2})
        A[value.target].push({index: value.source, weight: value.weight/2})
    }
    // copy back to n_ and A_
    n_.length = 0
    A_.length = 0
    for (let c of c_) {
        n_.push({
            index: c.index,
            c: c.c,
            k: c.k,
            loop: c.loop,
            children: e_.get(c.c).nodes,
            parent: null,
        })
    }
    for (let i = 0; i < A.length; i++) {
        A_.push([])
        for (let j = 0; j < A[i].length; j++) {
            A_[i].push({index: A[i][j].index, weight: A[i][j].weight})
        }
    }
    for (let n of n_) {
        for(let e of n.children) {
            e.parent = n
        }
    }
}
/**
 * Partition a network into communities based on gain in modularity.
 * @param {Array} A, adjacency matrix
 * @param {Array} n_, nodes
 * @param {Map} q_, communities
 * @param {Number} m, total weight of all edges 
 * @returns {Boolean} true if a node has changed its community
 */
function partition(A, n_, q_, m) {
    let flag = true
    let cFlag = false
    while(flag) {
        flag = false
        for (let i = 0; i < n_.length; i++) {
            let deltaQ = 0 // modularity gain must be positive
            const c_ = computeC(A, n_, i)
            let inDeltaQ = undefined
            const outDeltaQ = computeOutDeltaQ(q_, m, A, n_, i) // this is the cost of removing i from its own community
            let nodeC = n_[i].c
            for (let c of c_) {
                const inGain = computeInDeltaQ(q_, m, A, n_, i, c) // add i to community c
                const gain = computeDeltaQ(m, n_[i].k, n_[i].loop, inGain, outDeltaQ)
                if (gain > deltaQ) {
                    nodeC = c
                    inDeltaQ = inGain
                    deltaQ = gain
                }
            }
            if (nodeC !== n_[i].c) {
                const C_ = q_.get(nodeC) // move node i to community C (index nodeC)
                const D_ = q_.get(n_[i].c)   // remove node i from community D (index n_[i].c)
                D_.nodes.delete(n_[i])
                D_.sIn -= ( 2 * outDeltaQ.k_iD + n_[i].loop ) // this is the adjacency of i with its own community D_
                D_.sTot -= n_[i].k // we count only the degree
                C_.nodes.add(n_[i])
                C_.sIn += ( 2 * inDeltaQ.k_iC + n_[i].loop ) // this is the adjacency of i with nodes in community C_
                C_.sTot += n_[i].k // we count only the degree
                n_[i].c = nodeC // move node i to community c
                flag = true
                cFlag = true
            }
        }
    }
    return cFlag
}
/**
 * Propagate community index from super nodes to its children nodes. The implementation is recursive.
 * @param {Array} n_, node array with community index
 * @param {Array} nodes, input node array, we need to update the group (community) index
 */
function propagate(n_, nodes) {
    let group = 0
    for (let n of n_) {
        propagate_(n, group, nodes)
        group++
    }
}
/**
 * Recursive function to propagate community index from super nodes to its children nodes.
 * @param {Array} n, nodes
 * @param {Number} group, group index 
 * @param {Array} nodes, input node array, we need to update the group (community) index 
 * @returns 
 */
function propagate_(n, group, nodes) {
    n.group = group
    if (n.children === null) {
        nodes[n.index].group = group
        return
    } else {
        for (let c of n.children) {
            propagate_(c, group, nodes)
        }
    }
}

/**
 * Compute the communities that are connected to node i
 * @param {Array} A adjacency list
 * @param {Array} n_ node array
 * @param {Number} i node index
 */
function computeC(A, n_, i) {
    const s_ = new Set()
    const neighbors = A[i]
    for (let n of neighbors) {
        if (n_[n.index].c !== n_[i].c) {
            s_.add(n_[n.index].c)
        }
    }
    return s_.values()
}
/**
 * Compute the cost of moving node i to community c
 * We need to compute k_iC, the sum of the weights of the links from node i to nodes in community c.
 * We also need to compute sIn, the sum of the weights of the links inside community c before the node
 * i is added to the community.
 * @param {Array} A adjacency list
 * @param {Array} n_ node array
 * @param {Number} i node index
 * @param {Number} n nodes in the community c
 * @returns {Number} the cost of moving node i to community c
 */
function computeInDeltaQ(q_, m, A, n_, i, c) {
    const neighbors = A[i]
    let k_iC = 0
    let sTot = 0
    for (let n of neighbors) {
        if (n_[n.index].c === c) {
            k_iC += n.weight // weight of the links from node i to nodes in community c
        }
    }
    const C_ = q_.get(c)
    sTot = C_.sTot
    return {
        sTot,
        k_iC,
        in_loop: n_[i].loop
    }
}
/**
 * Compute the cost of removing node i from its own community
 * Compute the cost of moving node i out of community D
 * We need to compute k_i( i -> D), this is the number of links from i to nodes in its own community
 * members in D.
 * We also need to compute sTot, this is the total number of links from nodes in D to all nodes in the network,
 * before node i is removed.
 * @param {Array} A adjacency list, A[i] is the neighbors of node i and we assume the diagonal is 0!
 * @param {Array} n_ node array
 * @param {Number} i node index
 * @returns {Object} {sTot, k_iD}, where k_iD is the number of links from i to nodes in its own community
 */
function computeOutDeltaQ(q_, m, A, n_, i) {
    const c = n_[i].c // community of node i
    const neighbors = A[i] // neighbors of 
    let sTot = 0 // total degree of nodes in community D
    let k_iD = 0 // number of links from i to nodes in its own community
    for (let n of neighbors) {
        if (n_[n.index].c === n_[i].c) {
            k_iD += n.weight // number of links from i to nodes in its own community
        }
    }
    const D_ = q_.get(c)
    sTot = D_.sTot
    return {
        sTot,
        k_iD,
        out_loop: n_[i].loop
    }
}
/**
 * Compute the modularity gain
 * @param {Number} m number of edges in the network
 * @param {Object} inDeltaQ {sTot, k_iC}
 * @param {Object} outDeltaQ {sTot, k_iD}
 * @returns {Number} the modularity gain
 */
function computeDeltaQ(m, ki, loop, inDeltaQ, outDeltaQ) {
    const { sTot: sTotIn, k_iC } = inDeltaQ
    const { sTot: sTotOut, k_iD } = outDeltaQ
    const k = ki
    const deltaQ = (k_iC - k_iD) / m - k * (sTotIn - sTotOut + k) / (2 * m * m)
    return deltaQ
}
/**
 * Compute the modularity
 * @param {Array} m number of edges in the network
 * @param {Map} q_ communities
 */
function computeModularity(m, q_) {
    let Q = 0
    for (let c of q_.values()) {
        Q += (c.sIn - ( c.sTot * c.sTot ) / (2 * m)) / (2 * m)
    }
    return Q
}
`
const hlPre = d3.select("#hl-code").append("pre")
const hlCod = hlPre
    .append("code")
    .attr("class", "language-javascript")
    .attr("style", "border: 1px solid #C1BAA9")
    .text(cText)