import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"
import { treeFactory } from "./tree.js"
import { genDivTooltip } from "../common/draw.js"
import { dropdown } from "../common/gui.js"

/** node size and paddings */
const nodeSize = 1
const siblingPadding = 3
const treeDistance = 4
/** Drawing */
const nodeRadius = 2
const selNodeRadius = 5
const nodeColor = "#BA5F06"
const selNodeColor = "#842854"
const pathColor = "#5F7186"
const divTooltip = genDivTooltip()

// draw tree
d3.json("../data/flare.json").then((data) => {
    draw(data)
})


/** compute left contour of a subtree */
function leftContour(tree, node, modSum, lcMap) {
    const key = node.y
    if (!lcMap.has(key)) {
        lcMap.set(key, node.x + modSum)
    } else {
        const xVal = Math.min(lcMap.get(key), node.x + modSum)
        lcMap.set(key, xVal)
    }
    modSum += node.mod
    if (tree.hasChildren(node)) {
        node.children.forEach((c) => leftContour(tree, c, modSum, lcMap))
    }
}
/** compute right contour of a subtree */
function rightContour(tree, node, modSum, rcMap) {
    const key = node.y
    if (!rcMap.has(key)) {
        rcMap.set(key, node.x + modSum)
    } else {
        const xVal = Math.max(rcMap.get(key), node.x + modSum)
        rcMap.set(key, xVal)
    }
    modSum += node.mod
    if (tree.hasChildren(node)) {
        node.children.forEach((c) => rightContour(tree, c, modSum, rcMap))
    }
}
/** center smaller trees in-between sibling */
function centerSiblings(lNode, rNode) {
    const lIndex = lNode.parent.children.indexOf(lNode)
    const rIndex = rNode.parent.children.indexOf(rNode)
    const nrNodes = rIndex - lIndex - 1
    if (nrNodes > 0) {
        // there is at least one node in-between
        var stepSize = (rNode.x - lNode.x) / (nrNodes + 1)
        let count = 1
        for (let i = lIndex + 1; i < rIndex; i++) {
            const mNode = lNode.parent.children[i]
            const targetX = lNode.x + stepSize * count
            const offset = targetX - mNode.x
            mNode.x += offset
            mNode.mod += offset
            count++
        }
    }
}
/** solve subtrees overlap by checking for collision between left and right contours */
function contourCollision(tree, node) {
    let maxShift = 0
    let distance = treeDistance + nodeSize
    const lcMap = new Map()
    leftContour(tree, node, 0, lcMap)
    const siblings = tree.allLeftSiblings(node)
    let cNode = undefined
    for (let s of siblings) {
        let shift = 0
        const rcMap = new Map()
        rightContour(tree, s, 0, rcMap)
        const minDepth = node.y + 1
        const maxDepth = node.y + Math.max(lcMap.size, rcMap.size) - 1
        for (let depth = minDepth; depth <= maxDepth; depth++) {
            if (lcMap.has(depth) && rcMap.has(depth)) {
                let d = lcMap.get(depth) - rcMap.get(depth)
                if (d + shift < distance) {
                    shift = distance - d
                }
            }
        }
        if (shift > 0) {
            if (maxShift < shift) {
                maxShift = shift
                cNode = s
            }
        }
    }
    // update position
    node.x += maxShift
    node.mod += maxShift
    // center smaller subtrees
    if (cNode !== undefined) {
        centerSiblings(cNode, node)
    }
}
/** move tree if nodes are outside the scree - check only left contour or root node */
function nodesOnScreen(tree, node) {
    const lcMap = new Map()
    leftContour(tree, node, 0, lcMap)
    let shift = 0
    lcMap.forEach((v) => {
        if (v + shift < 0) {
            shift = -v
        }
    })
    if (shift > 0) {
        node.x += shift
        node.mod += shift
    }
}
/** compute node's initial position - postorder tree traversal */
function initialX(tree, node) {
    if (tree.hasChildren(node)) {
        node.children.forEach((c) => {
            initialX(tree, c)
        })
    }
    if (tree.isLeaf(node)) {
        if (!tree.isLeftMost(node)) {
            node.x = tree.previousSibling(node).x + nodeSize + siblingPadding
        } else {
            node.x = 0
        }
    } else if (node.children.length === 1) {
        if (tree.isLeftMost(node)) {
            node.x = node.children[0].x
        } else {
            node.x = tree.previousSibling(node).x + nodeSize + siblingPadding
            node.mod = node.x - node.children[0].x
        }
    } else {
        const leftChild = tree.leftMostChild(node)
        const rightChild = tree.rightMostChild(node)
        const midpoint = (leftChild.x + rightChild.x) / 2
        if (tree.isLeftMost(node)) {
            node.x = midpoint
        } else {
            node.x = tree.previousSibling(node).x + nodeSize + siblingPadding
            node.mod = node.x - midpoint
        }
    }

    if (tree.hasChildren(node) && !tree.isLeftMost(node)) {
        contourCollision(tree, node)
    }
}
/** compute node's final position - preorder tree traversal */
function finalPosition(tree, node, modSum, bbox) {
    node.x += modSum
    modSum += node.mod
    if (tree.hasChildren(node)) {
        node.children.forEach((c) => {
            finalPosition(tree, c, modSum, bbox)
        })
    }
    const x = node.x
    const y = node.y
    if (x < bbox.xmin) bbox.xmin = x
    if (x > bbox.xmax) bbox.xmax = x
    if (y < bbox.ymin) bbox.ymin = y
    if (y > bbox.ymax) bbox.ymax = y
}
/** initialize node - preorder tree traversal */
function initPosition(tree, node) {
    node.x = -1
    node.y = node.depth
    node.mod = 0
    if (tree.hasChildren(node)) {
        node.children.forEach((c) => {
            initPosition(tree,c)
        })
    }
}
/** construct hierarchy from flare data set */
function hierarchy(data) {
    const hMap = new Map()
    hMap.set("flare", {
        name: "flare",
        children: [],
        parent: undefined,
        key: "flare",
        size: undefined,
        imports: undefined,
    })
    data["flare"].forEach((n) => {
        let n_name = n["name"]
        hMap.set(n["name"], {
            name: n_name.substring(n_name.lastIndexOf(".") + 1),
            children: [],
            parent: undefined,
            key: n_name,
            size: n["size"],
            imports: n["imports"],
        })
        // add parent elements up to root node
        while (n_name.lastIndexOf(".") > -1) {
            n_name = n_name.substring(0, n_name.lastIndexOf("."))
            if (!hMap.has(n_name)) {
                hMap.set(n_name, {
                    name: n_name.substring(n_name.lastIndexOf(".") + 1),
                    children: [],
                    parent: undefined,
                    key: n_name,
                    size: undefined,
                    imports: undefined,
                })
            }
        }
    })
    // connect parents and children
    hMap.forEach((e, k, m) => {
        // compute parent
        let n_name = k
        const pKey = n_name.substring(0, n_name.lastIndexOf("."))
        if (pKey.length > 0) {
            hMap.get(pKey).children.push(hMap.get(n_name))
            hMap.get(n_name).parent = hMap.get(pKey)
        }
    })
    return treeFactory(hMap.get("flare"))
}
/** main function */
function draw(data) {
    const guiId = "walker-div"
    const gridObj = d3.select("#walker_grid")
    const guiDiv = gridObj.append("div").attr("class", "cell").attr("id", guiId)

    let wSel = "vertical"
    const dataKeys = ["vertical", "circular"]
    const dataDefs = [{ name: "vertical" }, { name: "circular" }]
    const dataMap = new Map()
    for (let i = 0; i < dataKeys.length; i++) {
        dataMap.set(dataKeys[i], dataDefs[i])
    }
    const guiConfig = {
        divObj: guiDiv,
        text: "select layout: ",
        selection: wSel,
        keys: dataMap.keys(),
        handler: wHandler,
    }
    dropdown(guiConfig)

    // canvas
    const canvas = gridObj
        .append("div")
        .attr("class", "cell")
        .attr("id", "walker-canvas")
        .style("border", "solid")
        .style("border-width", "0.5px")
        .style("border-color", "red")

    /** read data from file and generate hierarchy */
    const tree = hierarchy(data)
    /** Walker's algorithm to draw a tree */
    initPosition(tree, tree.root)
    initialX(tree, tree.root)
    nodesOnScreen(tree, tree.root)
    const bbox = {
        xmin: Infinity,
        xmax: 0,
        ymin: Infinity,
        ymax: 0,
    }
    finalPosition(tree, tree.root, 0, bbox)
    /** render tree on screen with d3 */
    const width = 600
    const height = 500
    const margin = { top: 10, right: 10, bottom: 10, left: 10 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const xLinearScale = d3
        .scaleLinear()
        .domain([bbox.xmin, bbox.xmax])
        .range([0, innerWidth])
    const yLinearScale = d3
        .scaleLinear()
        .domain([bbox.ymin, bbox.ymax])
        .range([0, innerHeight])
    const linearPath = d => {
        return d3.linkVertical()({
            source: [xLinearScale(d.parent.x), yLinearScale(d.parent.y)],
            target: [xLinearScale(d.x), yLinearScale(d.y)]
        })
    }
    const linearX = (x, y) => xLinearScale(x)
    const linearY = (x, y) => yLinearScale(y)

    const xRadialScale = d3
        .scaleLinear()
        .domain([bbox.xmin, bbox.xmax])
        .range([-Math.PI, Math.PI])
    const yRadialScale = d3
        .scaleLinear()
        .domain([bbox.ymin, bbox.ymax])
        .range([0, Math.min(innerWidth, innerHeight) / 2])
    const link = d3.linkRadial()
        .angle( d => d.angle )
        .radius( d => d.radius )
    const radialPath = (d) => {
        const sR = yScale(d.y)
        const tR = yScale(d.parent.y)
        const sA = xScale(d.x)
        const tA = xScale(d.parent.x)
        return link({
            source: { radius: tR, angle: tA },
            target: { radius: sR, angle: sA },
        })
    }
    const radialX = (x, y) => yScale(y) * Math.cos(xScale(x)-Math.PI/2)
    const radialY = (x, y) => yScale(y) * Math.sin(xScale(x)-Math.PI/2)

    let x = undefined
    let y = undefined
    let path = undefined
    let xScale = undefined
    let yScale = undefined
    let xtrans = undefined
    let ytrans = undefined
    let raidal = false
    if (raidal) {
        x = radialX
        y = radialY
        path = radialPath
        xScale = xRadialScale
        yScale = yRadialScale
        xtrans = margin.left + innerWidth/2
        ytrans = margin.top + innerHeight/2
    } else {
        x = linearX
        y = linearY
        path = linearPath
        xScale = xLinearScale
        yScale = yLinearScale
        xtrans = margin.left
        ytrans = margin.top
    }

    const svg = canvas
        .append("svg")
        .attr("class", "walker_svg")
        .attr("width", width)
        .attr("height", height)

    const g = svg
        .append("g")
        .attr("class", "walker_g")
        .attr("transform", `translate(${xtrans},${ytrans})`)

    const tNodes = tree.descendants()
    const edges = g.selectAll("path").data(tNodes.slice(1))
        .join("path")
        .attr("d", d => path(d))
        .attr("stroke", pathColor)
        .attr("fill", "none")

    const nodes = g.selectAll("circle").data(tNodes)
        .join("circle")
        .attr("cx", (d) => x(d.x, d.y))
        .attr("cy", (d) => y(d.x, d.y))
        .attr("r", nodeRadius)
        .attr("fill", nodeColor)
        .on("mouseover", function (event, d) {
            mouseOver(divTooltip, event, d)
        })
        .on("mousemove", function (event, d) {
            const pos = d3.pointer(event)
            mouseMove(divTooltip, d.name, {
                x: event.pageX,
                y: event.pageY
            })
        })
        .on("mouseout", function (event, d) {
            mouseOut(divTooltip, event, d)
        })
    // zoom
    svg.call(
        d3.zoom()
        .extent([
                [0, 0],
                [width, height],
        ])
        .scaleExtent([1, 8])
        .on("zoom", zoomed)
    )

    function zoomed(event, d) {
        g.attr("transform", event.transform)
    }
    function wHandler(text, event) {
        wSel = event
        if (event === "vertical") {
            x = linearX
            y = linearY
            path = linearPath
            xScale = xLinearScale
            yScale = yLinearScale
            xtrans = margin.left
            ytrans = margin.top
        } else if (event === "circular") {
            x = radialX
            y = radialY
            path = radialPath
            xScale = xRadialScale
            yScale = yRadialScale
            xtrans = margin.left + innerWidth/2
            ytrans = margin.top + innerHeight/2
        }

        const t2 = svg.transition().duration(1000)
        t2.select(".walker_g")
            .attr("transform", `translate(${xtrans},${ytrans})`)
        t2.selectAll("circle")
            .attr("cx", (d) => x(d.x, d.y))
            .attr("cy", (d) => y(d.x, d.y))
        t2.selectAll("path").attr("d", (d) => path(d))
    }
}
function mouseOver(tooltip, event, d) {
    tooltip.style("display", "inline-block")
    d3.select(event.target).attr("fill", selNodeColor)
    d3.select(event.target).attr("r", selNodeRadius)
}
function mouseMove(tooltip, name, pos) {
    const { x, y } = pos
    tooltip
        .html(name)
        .style("left", `${x + 10}px`)
        .style("top", `${y}px`)
}
function mouseOut(divTooltip, event, d) {
    divTooltip.style("display", "none")
    d3.select(event.target).attr("fill", nodeColor)
    d3.select(event.target).attr("r", nodeRadius)
}

const cText = `
/** compute left contour of a subtree */
function leftContour(tree, node, modSum, lcMap) {
    const key = node.y
    if (!lcMap.has(key)) {
        lcMap.set(key, node.x + modSum)
    } else {
        const xVal = Math.min(lcMap.get(key), node.x + modSum)
        lcMap.set(key, xVal)
    }
    modSum += node.mod
    if (tree.hasChildren(node)) {
        node.children.forEach((c) => leftContour(tree, c, modSum, lcMap))
    }
}
/** compute right contour of a subtree */
function rightContour(tree, node, modSum, rcMap) {
    const key = node.y
    if (!rcMap.has(key)) {
        rcMap.set(key, node.x + modSum)
    } else {
        const xVal = Math.max(rcMap.get(key), node.x + modSum)
        rcMap.set(key, xVal)
    }
    modSum += node.mod
    if (tree.hasChildren(node)) {
        node.children.forEach((c) => rightContour(tree, c, modSum, rcMap))
    }
}
/** center smaller trees in-between sibling */
function centerSiblings(lNode, rNode) {
    const lIndex = lNode.parent.children.indexOf(lNode)
    const rIndex = rNode.parent.children.indexOf(rNode)
    const nrNodes = rIndex - lIndex - 1
    if (nrNodes > 0) {
        // there is at least one node in-between
        var stepSize = (rNode.x - lNode.x) / (nrNodes + 1)
        let count = 1
        for (let i = lIndex + 1; i < rIndex; i++) {
            const mNode = lNode.parent.children[i]
            const targetX = lNode.x + stepSize * count
            const offset = targetX - mNode.x
            mNode.x += offset
            mNode.mod += offset
            count++
        }
    }
}
/** solve subtrees overlap by checking for collision between left and right contours */
function contourCollision(tree, node) {
    let maxShift = 0
    let distance = treeDistance + nodeSize
    const lcMap = new Map()
    leftContour(tree, node, 0, lcMap)
    const siblings = tree.allLeftSiblings(node)
    let cNode = undefined
    for (let s of siblings) {
        let shift = 0
        const rcMap = new Map()
        rightContour(tree, s, 0, rcMap)
        const minDepth = node.y + 1
        const maxDepth = node.y + Math.max(lcMap.size, rcMap.size) - 1
        for (let depth = minDepth; depth <= maxDepth; depth++) {
            if (lcMap.has(depth) && rcMap.has(depth)) {
                let d = lcMap.get(depth) - rcMap.get(depth)
                if (d + shift < distance) {
                    shift = distance - d
                }
            }
        }
        if (shift > 0) {
            if (maxShift < shift) {
                maxShift = shift
                cNode = s
            }
        }
    }
    // update position
    node.x += maxShift
    node.mod += maxShift
    // center smaller subtrees
    if (cNode !== undefined) {
        centerSiblings(cNode, node)
    }
}
/** move tree if nodes are outside the scree - check only left contour or root node */
function nodesOnScreen(tree, node) {
    const lcMap = new Map()
    leftContour(tree, node, 0, lcMap)
    let shift = 0
    lcMap.forEach((v) => {
        if (v + shift < 0) {
            shift = -v
        }
    })
    if (shift > 0) {
        node.x += shift
        node.mod += shift
    }
}
/** compute node's initial position - postorder tree traversal */
function initialX(tree, node) {
    if (tree.hasChildren(node)) {
        node.children.forEach((c) => {
            initialX(tree, c)
        })
    }
    if (tree.isLeaf(node)) {
        if (!tree.isLeftMost(node)) {
            node.x = tree.previousSibling(node).x + nodeSize + siblingPadding
        } else {
            node.x = 0
        }
    } else if (node.children.length === 1) {
        if (tree.isLeftMost(node)) {
            node.x = node.children[0].x
        } else {
            node.x = tree.previousSibling(node).x + nodeSize + siblingPadding
            node.mod = node.x - node.children[0].x
        }
    } else {
        const leftChild = tree.leftMostChild(node)
        const rightChild = tree.rightMostChild(node)
        const midpoint = (leftChild.x + rightChild.x) / 2
        if (tree.isLeftMost(node)) {
            node.x = midpoint
        } else {
            node.x = tree.previousSibling(node).x + nodeSize + siblingPadding
            node.mod = node.x - midpoint
        }
    }

    if (tree.hasChildren(node) && !tree.isLeftMost(node)) {
        contourCollision(tree, node)
    }
}
/** compute node's final position - preorder tree traversal */
function finalPosition(tree, node, modSum, bbox) {
    node.x += modSum
    modSum += node.mod
    if (tree.hasChildren(node)) {
        node.children.forEach((c) => {
            finalPosition(tree, c, modSum, bbox)
        })
    }
    const x = node.x
    const y = node.y
    if (x < bbox.xmin) bbox.xmin = x
    if (x > bbox.xmax) bbox.xmax = x
    if (y < bbox.ymin) bbox.ymin = y
    if (y > bbox.ymax) bbox.ymax = y
}
/** initialize node - preorder tree traversal */
function initPosition(tree, node) {
    node.x = -1
    node.y = node.depth
    node.mod = 0
    if (tree.hasChildren(node)) {
        node.children.forEach((c) => {
            initPosition(tree,c)
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