import { colorsUno, colorsDos, randColorsHex } from "../common/colors.js"
import { genDivTooltip } from "../common/draw.js"
import { dropdown } from "../common/gui.js"
import { random_seed } from "../../common/random.js"
import { dijkstra, bfs, setNetwork } from "./networks.js"
//import test01 from "test01" assert { type: "json" }
//import test02 from "test02" assert { type: "json" }

const url1 = "../data/test01.json"
const url2 = "../data/test02.json"
drawAll(url1, url2)

async function drawAll(url1, url2) {
    const response1 = await fetch(url1)
    const test01 = await response1.json()
    const response2 = await fetch(url2)
    const test02 = await response2.json()

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
        "#b15928",
    ]
    let dataSel = "test01"
    let algSel = "dijkstra"
    let traversal = "dijkstra"
    let network = test01

    const dijkId = "dijkstra-traversal-div"
    const gridObj = d3.select("#dijkstra-traversal")
    const guiDiv = gridObj
        .append("div")
        .attr("class", "cell")
        .attr("id", dijkId)

    const dataKeys = ["test01", "test02"]
    const dataDefs = [{ name: "Test 01" }, { name: "Test 02" }]
    const dataMap = new Map()
    for (let i = 0; i < dataKeys.length; i++) {
        dataMap.set(dataKeys[i], dataDefs[i])
    }

    const guiConfig = {
        divObj: guiDiv,
        text: "select a network: ",
        selection: dataSel,
        keys: dataMap.keys(),
        handler: dijHandler,
    }
    dropdown(guiConfig)
    guiDiv.append("span").text(" | ")
    const algKeys = ["dijkstra", "bfs"]
    const algDefs = [{ name: "Dijkstra" }, { name: "Breadth-first search" }]
    const algMap = new Map()
    for (let i = 0; i < algKeys.length; i++) {
        algMap.set(algKeys[i], algDefs[i])
    }
    ;(guiConfig.text = "select an algorithm: "),
        (guiConfig.selection = algSel),
        (guiConfig.keys = algMap.keys())
    dropdown(guiConfig)

    // canvas
    const canvas = gridObj
        .append("div")
        .attr("class", "cell")
        .attr("id", "dijkstra-canvas")
        .style("border", "solid")
        .style("border-width", "0.5px")
        .style("border-color", "red")

    const width = 500
    const height = 500
    const margin = { top: 5, bottom: 5, left: 5, right: 5 }
    const svg = canvas
        .append("svg")
        .attr("class", "dijkstra-svg")
        .attr("width", width)
        .attr("height", height)
    const rectG = svg.append("g").attr("class", "rect-click")
    rectG
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "#FFFFFF") //'white')
        .on("click", (event, d) => {
            event.stopPropagation()
            dijHandler("clear", dataSel)
        })
    const netwG = svg.append("g").attr("class", "network-group")

    // check for weighted edges
    function checkWeights({ edges }) {
        const rand = random_seed(11)
        const factor = 10
        for (let e of edges) {
            const s = e.source
            const t = e.target
            if (!e.hasOwnProperty("weight"))
                e.weight = Math.floor(1 + rand() * factor)
            else {
                if (typeof e.weight === "string") e.weight = +e.weight
            }
        }
    }
    checkWeights(test01)
    checkWeights(test02)
    setNetwork(test01)
    setNetwork(test02)

    const drawConfig = {
        selection: netwG,
        width: width,
        height: height,
        margin: margin,
    }
    draw(test01, drawConfig)

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

    function wrapText(text) {
        text.each(() => {
            const textPath = text
                .text(null)
                .append("textPath")
                .attr("xlink:href", (d) =>  "#" + "_" + d.key)
                .style("text-anchor", "middle")
                .attr("startOffset", "45%")
                .attr(
                    "font-family",
                    `'Lucida Sans Unicode', 'Lucida Grande', 'sans-serif'`
                )
                .attr("font-size", 12)
                .attr("font-weight", "bold")
                .attr("opacity", (d) => 1)
                .text((d) => d3.format(",d")(d.weight))
        })
    }
    function draw(network, drawConfig) {
        const { selection, width, height, margin } = drawConfig
        selection.selectAll("*").remove()
        const g = selection
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
        const iw = width - margin.left - margin.right
        const ih = height - margin.top - margin.bottom
        const center = { x: margin.left + iw / 2, y: margin.top + ih / 2 }
        const { nodes, edges, neighbors, weights } = network
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
        const maxRad = 8
        const nScale = d3
            .scaleLinear()
            .domain([d3.min(nodes, (d) => d.c), d3.max(nodes, (d) => d.c)])
            .range([minRad, maxRad])
        const offset = 20
        const xscale = d3
            .scaleLinear()
            .domain([d3.min(nodes, (d) => d.x), d3.max(nodes, (d) => d.x)])
            .range([offset, iw - offset])
        const yscale = d3
            .scaleLinear()
            .domain([d3.min(nodes, (d) => d.y), d3.max(nodes, (d) => d.y)])
            .range([ih - offset, offset])
        const lineGenerator = d3.line().curve(d3.curveBasis)
        const alpha = 0.5 // for quadratic Bezier of curved edges
        const beta = 0.1
        const controlPoints = (d) => {
            const d0 = [xscale(nodes[d.source].x), yscale(nodes[d.source].y)]
            const d2 = [xscale(nodes[d.target].x), yscale(nodes[d.target].y)]
            const x = (d0[0] + d2[0]) / 2
            const y = (d0[1] + d2[1]) / 2
            const vx = -(d0[1] - d2[1])
            const vy = d0[0] - d2[0]
            const d1 = [x + beta * vx, y + beta * vy]
            return [d0, d1, d2]
        }
        const pathColor = "#6D191B"
        const eGroup = g
            .selectAll("path")
            .data(edges, (d) => d.key)
            .join("path")
            .attr("d", (d) => lineGenerator(controlPoints(d)))
            .attr("id", (d, i) => "_" + d.key)
            .attr("stroke", pathColor)
            .attr("stroke-width", 1.5)
            .attr("fill", "none")
        const strokeColor = "#193556"
        const nodeColor = "#193556"
        const nGroup = g
            .selectAll("circle")
            .data(nodes, (d) => d.index)
            .join("circle")
            .attr("cx", (d) => xscale(d.x))
            .attr("cy", (d) => yscale(d.y))
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
                    y: event.pageY,
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
                    weights,
                    colorScale,
                    sourceAccessor,
                    targetAccessor,
                    traversal,
                    event,
                    d
                )
            })
        const tGroup = g
            .selectAll(".path-weight")
            .data(edges, (d) => d.weight)
            .join("text")
            .attr("class", "path-weight")
            .call(wrapText)
    }

    function mouseOver(tooltip) {
        tooltip.style("display", "inline-block")
    }
    function mouseMove(tooltip, d, pos) {
        const text = "node " + d.name + "<br>" + "distance: " + d.d
        const { x, y } = pos
        tooltip
            .html(text)
            .style("left", `${x + 10}px`)
            .style("top", `${y}px`)
    }
    function mouseOut(tooltip) {
        tooltip.style("display", "none")
    }

    function dijHandler(text, event) {
        clearTimeouts()
        switch (event) {
            case "test01":
                dataSel = event
                network = test01
                break
            case "test02":
                dataSel = event
                network = test02
                break
            default: {
                algSel = event
                // this is not nice
                //if (event === "dijkstra") traversal = dijkstra
                //else traversal = bfs
                traversal = event 
            }
        }
        draw(network, drawConfig)
    }

    function onClick(
        nGroup,
        eGroup,
        nodes,
        edges,
        neighbors,
        weights,
        colorScale,
        sourceAccessor,
        targetAccessor,
        searchAlg,
        event,
        d
    ) {
        if (searchAlg === undefined) return
        else if (searchAlg === "dijkstra") {
            dijkstra(nodes, neighbors, weights, d.index)
        } else if (searchAlg === "bfs") {
            bfs(nodes, neighbors, d.index)
        }
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
                    }
                })
                .attr("stroke-width", 2)
                .attr("stroke-opacity", (d) => {
                    const n0 = nodes[sourceAccessor(d)]
                    const n1 = nodes[targetAccessor(d)]
                    //if ((n0.index === 36 || n0.index === 52) && (n1.index === 36 || n1.index === 52))
                    //    debugger
                    if (n0.p === n1.index || n1.p === n0.index) {
                        const dist = Math.max(n0.d, n1.d)
                        if (dist > distRange[distIndex]) return 0
                        else {
                            return 1
                        }
                    } else {
                        return 0
                    }
                })
            nGroup
                .attr("fill", (d) => {
                    if (d.d <= distRange[distIndex]) return colScale(d.d)
                    else return colorScale(d.group)
                })
            d3.selectAll(".path-weight")
                .data(edges, (d) => d.key)
                .join("text")
                .attr("class", "path-weight")
                .attr("opacity", (d) => {
                    if (distIndex >= nrDistances) return 1
                    const n0 = nodes[sourceAccessor(d)]
                    const n1 = nodes[targetAccessor(d)]
                    if (n0.p === n1.index || n1.p === n0.index) {
                        const dist = Math.max(n0.d, n1.d)
                        if (dist > distRange[distIndex]) return 0
                        else return 1
                    } else {
                        return 0
                    }
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
}
const cText = `
// Dijkstra: Single-source shortest path with backtracing
function dijkstra(nodes, neighbors, weights, index) {
    const pQ = binaryHeapFactory( n => n.d )
    nodes.forEach(n => {
      n.d = Infinity
      n.p = -2
    })
    nodes[index].d = 0
    nodes[index].p = -1
    nodes.forEach(n => pQ.push(n))
    while (!pQ.empty()) {
      const s = pQ.pop()
      const d = s.d
      const n_weights = weights[s.index]
      neighbors[s.index].forEach((n_index, i) => {
        const n = nodes[n_index]
        const weight = n_weights[i] 
        if (d + weight < n.d) {
            // update this element
            n.p = s.index
            n.d = d + weight
            pQ.update(n)
        }
      })
    }
} 
`
const hlPre = d3.select("#hl-code").append("pre")
const hlCod = hlPre
    .append("code")
    .attr("class", "language-javascript")
    .attr("style", "border: 1px solid #C1BAA9")
    .text(cText)
