import { randColorsHex } from "../common/colors.js"
import { genDivTooltip } from "../common/draw.js"
import { dropdown } from "../common/gui.js"
import { bfs, setNetwork } from "./networks.js"

const url1 = "../data/test01.json"
const url2 = "../data/lesmiserables.json"
drawAll(url1, url2)

async function drawAll(url1, url2) {
    const response1 = await fetch(url1)
    const test01 = await response1.json()
    const response2 = await fetch(url2)
    const lesmiserables = await response2.json()
    draw(test01, lesmiserables)
}
// global variables
const pathColor = "#6D191B"

function draw(test01, lesmiserables) {
    const divTooltip = genDivTooltip()
    let value = null
    const textOffset = 1
    const timeOuts = []
    const clearTimeouts = () => timeOuts.forEach((t) => clearTimeout(t))
    const clearNetwork = (network) => {
        network.nodes.forEach((n) => {
            n.v = false
            n.p = -2
            n.d = Number.MAX_VALUE
        })
    }
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
        "#b15928"
    ]
    let bfsSel = "test01"
    const bfsId = "bfs-traversla-div"
    const gridObj = d3.select("#bfs-traversal")
    const guiDiv = gridObj.append("div").attr("class", "cell").attr("id", bfsId)

    const bfsKeys = ["test01", "lesmiserable"]
    const bfsDefs = [{ name: "Test 01" }, { name: "Les Miserables" }]
    const bfsMap = new Map()
    for (let i = 0; i < bfsKeys.length; i++) {
        bfsMap.set(bfsKeys[i], bfsDefs[i])
    }
    const guiConfig = {
        divObj: guiDiv,
        text: "select a network: ",
        selection: bfsSel,
        keys: bfsMap.keys(),
        handler: bfsHandler
    }
    dropdown(guiConfig)

    // canvas
    const canvas = gridObj
        .append("div")
        .attr("class", "cell")
        .attr("id", "bfs-canvas")
        .style("border", "solid")
        .style("border-width", "0.5px")
        .style("border-color", "red")

    const width = 500
    const height = 500
    const margin = { top: 5, bottom: 5, left: 5, right: 5 }
    const svg = canvas
        .append("svg")
        .attr("class", "bfs-svg")
        .attr("width", width)
        .attr("height", height)
    const rectG = svg.append("g").attr("class", "rect-click")
    rectG
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "#FFFDFD") //'white')
        .on("click", (event, d) => {
            event.stopPropagation()
            bfsHandler("clear", bfsSel)
        })
    const netwG = svg.append("g").attr("class", "network-group")

    // process data
    lesmiserables["edges"] = lesmiserables["links"]
    setNetwork(lesmiserables)
    setNetwork(test01)

    const drawConfig = {
        selection: netwG,
        width: width,
        height: height,
        margin: margin
    }
    //drawLesmiserables(lesmiserables, drawConfig)
    drawTest01(test01, drawConfig)

    function clearNodes(nodes) {
        for (let n of nodes) {
            delete n.d
            delete n.p
            delete n.v
            delete n.x
            delete n.y
            delete n.vx
            delete n.vy
        }
    }
    function initNodes(nodes) {
        for (let n of nodes) {
            n.d = undefined
        }
    }
    function drawLesmiserables(lesmiserables, drawConfig) {
        const { selection, width, height, margin } = drawConfig
        selection.selectAll("*").remove()
        const g = selection
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
        const iw = width - margin.left - margin.right
        const ih = height - margin.top - margin.bottom
        const center = { x: margin.left + iw / 2, y: margin.top + ih / 2 }
        const { nodes, links, edges, neighbors } = lesmiserables
        //clearNodes(nodes)
        const sourceAccessor = (l) => l.source.index
        const targetAccessor = (l) => l.target.index
        //return
        const gSet = new Set()
        nodes.forEach((n) => {
            gSet.add(n.group)
        })
        const lineGenerator = d3.line().curve(d3.curveBasis)
        const colorScale = d3
            .scaleOrdinal()
            .domain(Array.from(gSet).sort())
            .range(colors)
        // text scaling
        const minRad = 4
        const maxRad = 19
        const nScale = d3
            .scaleLinear()
            .domain([d3.min(nodes, (d) => d.c), d3.max(nodes, (d) => d.c)])
            .range([minRad, maxRad])
        const dScale = d3
            .scaleLinear()
            .domain([
                d3.min(nodes, (d) => d.degree),
                d3.max(nodes, (d) => d.degree)
            ])
            .range([minRad, maxRad])
        // layout
        const simulation = d3
            .forceSimulation(nodes)
            .force("link", d3.forceLink(links))
            .force("charge", d3.forceManyBody().strength(-55))
            .force("center", d3.forceCenter(center.x, center.y).strength(0.1))
            .force("x", d3.forceX().x(center.x)) //.strength( 0.01 )
            .force("y", d3.forceY().y(center.y + 1)) // .strength( 0.01 )
            .force(
                "collision",
                d3.forceCollide().radius(function (d) {
                    return 1.15 * nScale(d.c)
                })
            )
            .alpha(0.2)
            .alphaDecay(0.008)
            .alphaMin(0.0001)
        const beta = 0.2
        const eGroup = g
            .append("g")
            .attr("fill", "none")
            .attr("stroke-opacity", 0.6)
            .selectAll("path")
            .data(links)
            .join("path")
            .attr("stroke-width", (d) => Math.log(d.value + 3)) 
            .attr("stroke", (d) => {
                const g =
                    d.source.c > d.target.c ? d.source.group : d.target.group
                return colorScale(g)
            })
            .attr("d", (d) => {
                const d0 = [d.source.x, d.source.y]
                const d2 = [d.target.x, d.target.y]
                const x = (d0[0] + d2[0]) / 2
                const y = (d0[1] + d2[1]) / 2
                const vx = (d2[0] - d0[0]) / 2
                const vy = (d2[1] - d0[1]) / 2
                const d1 = [x - beta * vy, y + beta * vx]
                return lineGenerator([d0, d1, d2])
            })
        const nGroup = g
            .append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", (d) => nScale(d.c))
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
            .on("click", function (event, d) {
                onClick(
                    nGroup,
                    eGroup,
                    nodes,
                    edges,
                    neighbors,
                    colorScale,
                    sourceAccessor,
                    targetAccessor,
                    event,
                    d
                )
            })
            .call(drag(simulation))
        simulation.on("tick", () => {
            eGroup.attr("d", (d) => {
                const d0 = [d.source.x, d.source.y]
                const d2 = [d.target.x, d.target.y]
                const x = (d0[0] + d2[0]) / 2
                const y = (d0[1] + d2[1]) / 2
                const vx = (d2[0] - d0[0]) / 2
                const vy = (d2[1] - d0[1]) / 2
                const d1 = [x - beta * vy, y + beta * vx]
                return lineGenerator([d0, d1, d2])
            })
            nGroup.attr("cx", (d) => d.x).attr("cy", (d) => d.y)
        })
        function drag(simulation) {
            function dragstarted(event) {
                if (!event.active) simulation.alphaTarget(0.3).restart()
                event.subject.fx = event.subject.x
                event.subject.fy = event.subject.y
            }

            function dragged(event) {
                event.subject.fx = event.x
                event.subject.fy = event.y
            }

            function dragended(event) {
                if (!event.active) simulation.alphaTarget(0)
                event.subject.fx = null
                event.subject.fy = null
            }

            return d3
                .drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended)
        } // drag()
    }

    function drawTest01(network, drawConfig) {
        const { selection, width, height, margin } = drawConfig
        selection.selectAll("*").remove()
        const g = selection
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
        const iw = width - margin.left - margin.right
        const ih = height - margin.top - margin.bottom
        const center = { x: margin.left + iw / 2, y: margin.top + ih / 2 }
        const { nodes, edges, neighbors } = network
        const sourceAccessor = (l) => l.source
        const targetAccessor = (l) => l.target
        //return
        const gSet = new Set()
        nodes.forEach((n) => {
            gSet.add(n.group)
        })
        // colors
        const colorScale = d3
            .scaleOrdinal()
            .domain(Array.from(gSet).sort())
            .range(colors)
        // set circle radius proportional to centrality
        const minRad = 4
        const maxRad = 19
        const nScale = d3
            .scaleLinear()
            .domain([d3.min(nodes, (d) => d.c), d3.max(nodes, (d) => d.c)])
            .range([minRad, maxRad])
        const l = d3.min(nodes, (d) => Math.min(d.x, d.y))
        const r = d3.max(nodes, (d) => Math.max(d.x, d.y))
        const offset = 20
        const scale = d3
            .scaleLinear()
            .domain([l, r])
            .range([offset, iw - offset])

        const lineGenerator = d3.line().curve(d3.curveBasis)
        const alpha = 0.5 // for quadratic Bezier of curved edges
        const beta = 0.1
        const controlPoints = (d) => {
            const d0 = [scale(nodes[d.source].x), scale(nodes[d.source].y)]
            const d2 = [scale(nodes[d.target].x), scale(nodes[d.target].y)]
            const x = (d0[0] + d2[0]) / 2
            const y = (d0[1] + d2[1]) / 2
            const vx = -(d0[1] - d2[1])
            const vy = d0[0] - d2[0]
            const d1 = [x + beta * vx, y + beta * vy]
            return [d0, d1, d2]
        }
        //const pathColor = "#6D191B"
        const eGroup = g
            .selectAll("path")
            .data(edges, (d) => d.index)
            .join("path")
            .attr("d", (d) => lineGenerator(controlPoints(d)))
            .attr("stroke", pathColor)
            .attr("stroke-width", 1.5)
            .attr("fill", "none")
        const strokeColor = "#193556"
        const nodeColor = "#193556"
        const nGroup = g
            .selectAll("circle")
            .data(nodes, (d) => d.index)
            .join("circle")
            .attr("cx", (d) => scale(d.x))
            .attr("cy", (d) => scale(d.y))
            .attr("r", (d) => nScale(d.c))
            .attr("fill", (d) => colorScale(d.group))
            .attr("stroke", (d) => strokeColor)
            .attr("stroke-width", (d) => 1)
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
            .on("click", function (event, d) {
                onClick(
                    nGroup,
                    eGroup,
                    nodes,
                    edges,
                    neighbors,
                    colorScale,
                    sourceAccessor,
                    targetAccessor,
                    event,
                    d
                )
            })
    }

    function mouseOver(tooltip) {
        tooltip.style("display", "inline-block")
    }
    function mouseMove(tooltip, d, pos) {
        const text = d.name + '<br>' + 'distance: ' + d.d
        const { x, y } = pos
        tooltip
            .html(text)
            .style("left", `${x + 10}px`)
            .style("top", `${y}px`)
    }
    function mouseOut(divTooltip) {
        divTooltip.style("display", "none")
    }

    function bfsHandler(text, event) {
        clearTimeouts()
        bfsSel = event
        if (event === "lesmiserable") {
            initNodes(lesmiserables.nodes)
            drawLesmiserables(lesmiserables, drawConfig)
        } else if (event === "test01") {
            initNodes(test01.nodes)
            drawTest01(test01, drawConfig)
        }
    }

    function onClick(
        nGroup,
        eGroup,
        nodes,
        edges,
        neighbors,
        colorScale,
        sourceAccessor,
        targetAccessor,
        event,
        d
    ) {
        bfs(nodes, neighbors, d.index)
        clearTimeouts()
        event.stopPropagation()
        const s_ = new Set()
        for (let n of nodes) s_.add(n.d)
        const distRange = Array.from(s_)
        distRange.sort((a, b) => a - b)
        const colGen = randColorsHex(17)
        const colors = []
        for (let i = 0; i < distRange.length; i++) colors.push(colGen())
        const colScale = d3.scaleOrdinal().domain(distRange).range(colors)
        let distIndex = 0
        const nrDistances = distRange.length
        const recursiveColoring = () => {
            eGroup
                .attr("stroke", (d) => {
                    const n0 = nodes[sourceAccessor(d)]
                    const n1 = nodes[targetAccessor(d)]
                    const dist = Math.max(n0.d, n1.d)
                    if (dist <= distRange[distIndex]) {
                        return colScale(dist)
                    } else {
                        return pathColor
                    }
                })
                .attr("stroke-width", 2)
                .attr("stroke-opacity", (d) => {
                    const n0 = nodes[sourceAccessor(d)]
                    const n1 = nodes[targetAccessor(d)]
                    if (n0.p === n1.index || n1.p === n0.index) {
                        const dist = Math.max(n0.d, n1.d)
                        if (dist > distRange[distIndex]) {
                            return 0
                        } else {
                            return 1
                        }
                    } else {
                        return 0
                    }
                })
            nGroup
                .join("circle")
                .attr("fill", (d) => {
                    if (d.d <= distRange[distIndex]) return colScale(d.d)
                    else return colorScale(d.group)
                })

            distIndex++
            if (distIndex < nrDistances) {
                timeOuts.push(setTimeout(recursiveColoring, 300))
            } else {
                return
            }
        }
        recursiveColoring()
    }
} // draw()
const cText = `
// Breadth-first search with backtracing
function bfs(nodes, neighbors, index) {
    nodes.forEach((n) => {
        n.v = false
        n.d = Number.MAX_VALUE
        n.p = -2
    })
    nodes[index].d = 0
    nodes[index].v = true
    nodes[index].p = -1
    const q = [index] // queue
    while (q.length > 0) {
        const s = q.shift()
        const d = nodes[s].d
        neighbors[s].forEach((n_index) => {
            const n = nodes[n_index]
            if (n.v === false) {
                n.v = true
                n.p = s
                n.d = d + 1
                q.push(n_index)
            }
        })
    } // step()
}
`
const hlPre = d3.select("#hl-code").append("pre")
const hlCod = hlPre
    .append("code")
    .attr("class", "language-javascript")
    .attr("style", "border: 1px solid #C1BAA9")
    .text(cText)
