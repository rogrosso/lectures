

import { dropdown } from "../common/gui.js"
import { genDivTooltip } from "../common/draw.js"
import { randColorsHex } from "../common/colors.js"
import { easyRandom } from "../../common/random.js"
import { keyCantor } from "../../common/utilities.js"
import {
    jiggle,
    collisionForce,
    gravitationalForce,
    attractiveForceF,
    attractiveForceA,
    repulsiveForceF,
    repulsiveForceA,
} from "./networks.js"
import { betweenness } from "./centrality.js"
import { louvain } from "./communities.js"


const url1 = "../data/lesmiserables.json"
const url2 = "../data/celegans_modularity.json"
const url3 = "../data/louvain_unweighted.json"
const url4 = "../data/louvain_weighted.json"
drawAll(url1, url2, url3, url4)
async function drawAll(url1, url2, url3, url4) {
    // global variables
    let dataset = "Les Miserables"
    let force = "Fruchterman-Reingold"
    let nodeG = undefined // group of nodes in svg
    let linkG = undefined // group of links in svg
    let netwG = undefined // group of network in svg
    let network = undefined // current network
    // rendering parameters
    const beta = 0.2
    const minNodeRadius = 4
    const maxNodeRadius = 16
    const nodeStrokeWidth = 1.5
    const selNodeStrokeWidth = 3
    const nodeStrokeColor = "#ffffff"
    const selNodeStrokeColor = "#867979"
    const offsetX = 7
    const offsetY = 7

    // collenct data
    const lesmiserables = await d3.json(url1)
    const celegans = await d3.json(url2)
    const louvain_unweighted = await d3.json(url3)
    const louvain_weighted = await d3.json(url4)
    // prepare data
    lesmiserables.edges = []
    for (let i = 0; i < lesmiserables.links.length; i++) {
        const e = lesmiserables.links[i]
        e.weight = 1
        lesmiserables.edges.push(e)
    }
    for (let e of celegans.edges) {
        e.weight = 1
    }
    for (let n of celegans.nodes) {
        n.name = n.label
        delete n.label
    }
    for (let e of louvain_unweighted.edges) {
        e.weight = 1
    }
    const louvain_un = []
    for (let i = 0; i < louvain_unweighted.nodes.length; i++) {
        louvain_un.push({ name: i.toString() })
    }
    louvain_unweighted.nodes = louvain_un
    const louvain_w = [] 
    for (let i = 0; i < louvain_weighted.nodes.length; i++) {
        louvain_w.push({ name: i.toString() })
    }
    louvain_weighted.nodes = louvain_w

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
    function conservativeForces(K, Kc, Kg, cR, attractiveForce, repulsiveForce, nodes, edges, bbox, disp) {
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
            attractiveForce(K, nodes, e, disp)
        })
        // collision force
        for (let i = 0; i < nrNodes; i++) {
            for (let j = i + 1; j < nrNodes; j++) {
                collisionForce(Kc, cR, nodes, i, j, disp)
            }
        }
        // apply a gravitational force
        nodes.forEach((n, i) => {
            gravitationalForce(Kg, n, bbox, disp)
        })
    }
    function positionVerlet(physConfig, nodes, edges, bbox, disp) {
        const {
            K,
            Kc,
            Kg,
            cR,
            damping,
            attractiveForce,
            repulsiveForce,
        } = physConfig
        // compute conservative forces
        conservativeForces(K, Kc, Kg, cR, attractiveForce, repulsiveForce, nodes, edges, bbox, disp)
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
    const width = 550
    const height = 550
    const margin = { top: 10, bottom: 10, left: 10, right: 10 }
    const iW = width - margin.left - margin.right
    const iH = height - margin.top - margin.bottom
    // init networks to this size
    initNetwork(lesmiserables, iW, iH)
    initNetwork(celegans, iW, iH)
    initNetwork(louvain_unweighted, iW, iH)
    initNetwork(louvain_weighted, iW, iH)

    // menu
    const menuCanvas = d3.select("#verlet-integration-layout")
    const svgCanvas = d3.select("#verlet-integration-svg")
    // gui
    const dKeys = ['Les Miserables', 'C. Elegans', 'test01', 'test02']
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

    // force-directed layout configuration
    const dampConst = 100
    const physConfig = {
        damping: undefined, // friction force
        force: undefined, // force-directed layout
        C: 0.5, //0.45, // Fruchterman-Reingold constant
        Kf: undefined, // Fructerman-Reingold constant
        Ka: undefined, // ForceAtlas
        Kg: undefined, // gravitation
        Kc: undefined, // collision 
        K:  undefined, // general force constant
        cR: undefined, // collision radius
        attractiveForce: null,
        repulsiveForce: null
    }
    
    // data
    let { nodes, edges, disp, minDeg, maxDeg, minC, maxC, bbox, nr_g } = lesmiserables
    physConfig.Kf = physConfig.C * Math.sqrt((width * height) / nodes.length)

    function forceHandler(text, value) {
        physConfig.damping = dampConst
        if (value === "Fruchterman-Reingold") {
            physConfig.attractiveForce = attractiveForceF
            physConfig.repulsiveForce = repulsiveForceF
            physConfig.Kg = 15
            physConfig.Kc = 1200
            physConfig.cR = 4
            if (dataset === 'C. Elegans') {
                physConfig.Kg = 1
                physConfig.cR = 5
                physConfig.Kc = 2500
            }
            physConfig.K = physConfig.Kf
            physConfig.force = "Fruchterman-Reingold"
        } else if (value === "ForceAtlas2") {
            physConfig.attractiveForce = attractiveForceA
            physConfig.repulsiveForce = repulsiveForceA
            physConfig.Ka = 10//5
            physConfig.Kg = 12
            physConfig.Kc = 1000
            physConfig.cR = 3
            physConfig.force = "ForceAtlas2"
            if (dataset === 'C. Elegans') {
                physConfig.Kg = 60
                physConfig.Ka = 2.5 //0.9
                physConfig.Kc = 1000
                physConfig.cR = 3
            }
            physConfig.K = physConfig.Ka
        }
    }
    function dataHandler(text, value) {
        physConfig.damping = dampConst
        dataset = value
        switch(value) {
            case "Les Miserables":
                network = lesmiserables
                break
            case 'C. Elegans':
                network = celegans
                break
            case 'test01':
                network = louvain_unweighted
                break
            case 'test02':
                network = louvain_weighted
                break
        }
        ( { nodes, edges, disp, minDeg, maxDeg, minC, maxC, bbox, nr_g } = network )
        physConfig.Kf = physConfig.C * Math.sqrt((width * height) / nodes.length)
        forceHandler(text, physConfig.force)
        updateNetwork()
    }
    function centralityHandler(text, value) {
        if (value === "degree") {
            for (let n of nodes) n.r = lerp([minDeg, maxDeg], [minNodeRadius, maxNodeRadius], n.degree)
        } else if (value === "betweenness") { 
            for (let n of nodes) n.r = lerp([minC, maxC], [minNodeRadius, maxNodeRadius], n.c)
        }
    }
    // Init data
    forceHandler("layout", "Fruchterman-Reingold")
    network = lesmiserables

    // Init SVG
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


    // d3
    // line generator
    const lineGenerator = d3.line().curve(d3.curveBasis)
    // draw and animate
    updateNetwork() 
    animate()

    // functions
    function updateNetwork() {
        // can be done better, but for now this is simple
        netwG.selectAll("g").remove()
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
        linkG = netwG
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
        nodeG = netwG
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
    }
    function dragstarted(event, d) {
        physConfig.damping = dampConst
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
        physConfig.damping = dampConst
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
    function animate() {
        requestAnimationFrame(animate)
        if (physConfig.damping > 3) physConfig.damping *= 0.99
        positionVerlet(physConfig, nodes, edges, bbox, disp)
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
        let nodes = data.nodes
        let edges = data.edges
        const displacements = []
        for (let i = 0; i < nodes.length; i++) { // }.forEach((n, index) => {
            nodes[i].index = i
            nodes[i].x = 0,
            nodes[i].y = 0,
            nodes[i].xprev = 0,
            nodes[i].yprev = 0,
            nodes[i].vx = 0,
            nodes[i].vy = 0,
            nodes[i].fx = 0,
            nodes[i].fy = 0,
            nodes[i].r = 0,
            nodes[i].c = 0,
            nodes[i].degree = 0,
            nodes[i].key = (100000 * Math.random()).toFixed(0)
            displacements.push( { x: 0, y: 0, d: 0 } )
        }
        // check that edges are unique
        const eMap = new Map()
        for (let e of edges) {
            const key = keyCantor(e.source, e.target)
            eMap.set(key, e)
        }
        edges.length = 0
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
            n.x = 0.1 * ( 1 - 2 * random() ) * width / 2 
            n.y = 0.1 * ( 1 - 2 * random() ) * height / 2 
        }
        // compute bounding box
        const bbox = {
            xmin: -width / 2,
            xmax: width / 2,
            ymin: -height / 2,
            ymax: height / 2,
        }
        data.disp = displacements
        data.minDeg = minDeg
        data.maxDeg = maxDeg
        data.minC = minC
        data.maxC = maxC
        data.bbox = bbox
        data.nr_g = nr_g
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