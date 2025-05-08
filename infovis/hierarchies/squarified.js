import { readFlareHierarchy } from "./tree.js"
import { randColorsHex } from "../common/colors.js"
import { genDivTooltip } from "../common/draw.js"
import { random_seed } from "../../common/random.js"

// draw tree
d3.json("../data/flare.json").then((data) => {
    const divTooltip = genDivTooltip()
    draw(divTooltip, data)
})

/**
 * Map total size of sibling node to the drawing area by a uniform scaling
 * @param {Array} sibling, array of nodes
 * @param {Object} rect, rectangluar drawing area
 */
function normalizeArea(sibling, rect) {
    const totArea = rect.width * rect.height
    let totWeight = 0
    sibling.forEach(s => { 
        totWeight += s.size
        s.weight = s.size
     })
    const factor = totArea / totWeight
    sibling.forEach(c => {
        c.size = factor * c.size
    })
}
/**
 * Compute the aspect ratio of the row and the row with the new node
 * @param {Array} row, array of nodes
 * @param {Object} node, new node
 * @param {Object} rect, rectangluar drawing area
 * @returns {Boolean} true if the aspect ratio of the row is better (closer to one) than the aspect ratio of the row with the new node
 */
function aspectRatios(row, node, rect) {
    const h = (rect.width < rect.height) ? rect.width : rect.height
    const a = []
    let totA = 0
    row.forEach(r => {
        a.push(r.size)
        totA += r.size
    })
    let maxAspectRatio1 = 0
    a.forEach(ai => {
        const r = Math.max(h * h * ai / (totA * totA), totA * totA / (h * h * ai))
        maxAspectRatio1 = (r > maxAspectRatio1) ? r : maxAspectRatio1
    })
    let maxAspectRatio2 = 0
    a.push(node.size)
    totA += node.size
    a.forEach(ai => {
        const r = Math.max(h * h * ai / (totA * totA), totA * totA / (h * h * ai))
        maxAspectRatio2 = (r > maxAspectRatio2) ? r : maxAspectRatio2
    })
    return maxAspectRatio1 > maxAspectRatio2
}
/**
 * Layout the row of nodes
 * @param {Array} row, array of nodes
 * @param {Object} rect, rectangluar drawing area
 */
function layoutrow(row, rect) {
    let totA = 0
    row.forEach(e => { totA += e.size })
    let x = rect.x
    let y = rect.y
    let w = 0
    let h = 0
    if (rect.width < rect.height) {
        row.forEach(e => {
            w = e.size * rect.width / totA
            h = e.size / w
            e.x = x
            e.y = y
            e.width = w
            e.height = h
            x += w
        });
        rect.y += h
        rect.height -= h
    }
    else {
        row.forEach(e => {
            h = e.size * rect.height / totA
            w = e.size / h
            e.x = x
            e.y = y
            e.width = w
            e.height = h
            y += h
        });
        rect.x += w
        rect.width -= w
    }

}
/**
 * Squarified algorithm, recursive implementation
 * @param {Array} sibling, array of nodes
 * @param {Array} row, array of nodes
 * @param {Object} rect, rectangluar drawing area
 * @returns
 */
function squarified(sibling, row, rect) {
    if (sibling.length === 0) {
        if (row.length > 0) {
            layoutrow(row, rect)
        }
        return
    }
    let node = sibling[0]
    if (row.length === 0) {
        row.push(node)
        squarified(sibling.slice(1), row, rect)
    }
    else {
        if (aspectRatios(row, node, rect)) {
            row.push(node)
            squarified(sibling.slice(1), row, rect)
        }
        else {
            layoutrow(row, rect)
            squarified(sibling, [], rect)
        }
    }
}
/**
 * Compute the treemap, recursive implementation
 * @param {Object} tree, tree with main tree functions
 * @param {Object} node, node of the tree
 */
function treemap(tree, node) {
    if (tree.hasChildren(node)) {
        const width = node.width
        const height = node.height
        const x0 = node.x
        const y0 = node.y
        const rect = { width: width, height: height, x: x0, y: y0 }
        const sibling = node.children
        normalizeArea(sibling, rect)
        squarified(sibling.sort((a, b) => b.size - a.size ), [], rect)
        sibling.forEach(n => treemap(tree, n))
    }
}
/**
 * Compute node size/weight based on value and the accumulated size of 
 * its descendants.
 */
function nodeSize(node) {
    if (node.size === undefined) node.size = 0
    for (let c of node.children) {
        nodeSize(c)
        node.size += c.size
    }
}
/**
 * Init node position
 */
function initNode(node) {
    node.x = 0
    node.y = 0
    node.width = 0
    node.height = 0
    for (let c of node.children) {
        initNode(c)
    }
}
/**
 * Draw the tree with the squarified algorithm
 */
function draw(divTooltip, data) {
    const width = 600
    const height = 400
    const top = 1
    const bottom = 1
    const left = 1
    const right = 1
    const margin = { top, left, bottom, right }
    const iW = 600 - margin.left - margin.right
    const iH = 400 - margin.top - margin.bottom
    const tree = readFlareHierarchy(data)
    const rootNode = tree.root
    nodeSize(rootNode)
    initNode(rootNode)
    rootNode.width = iW
    rootNode.height = iH
    treemap(tree, rootNode)
    // draw
    const svg = d3.select("#squarified_canvas").append("svg")
        .attr("width", width)
        .attr("height", height)
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)
    // numeber of groups is the number of children of the root
    const nodes = []
    const colSeed = 11
    const colGen = randColorsHex(colSeed)
    const random = random_seed(colSeed)
    for (let g of rootNode.children) {
        const descendants = tree.leaves(g)
        const color = colGen()
        for (const n of descendants) {
            n.color = color
            n.pSize = g.size
        }
        nodes.push(...descendants)
    }
    // draw rectangles
    const bordersColor = '#BD2D28'
    const nGroup = g.append("g")
    nGroup.selectAll("rect")
        .data(nodes, d => d.key)
        .join("rect") 
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("width", d => d.width)
        .attr("height", d => d.height)
        .attr("fill", d => {
            let col = undefined
            const flag = random() > 0.5
            if (flag) col = d3.hsl(d.color).brighter(0.9 * random())
            else col = d3.color(d.color).darker(0.9 * random())
            return col
        })
        .attr("stroke", d3.color(bordersColor).brighter(0.5))
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
    const pGroup = g.append("g")
    pGroup.selectAll("rect")
        .data(rootNode.children, d => d.key)
        .join("rect")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("width", d => d.width)
        .attr("height", d => d.height)
        .attr("fill", 'none')
        .attr("stroke", d3.hsl(bordersColor).darker(0.5))
        .attr("stroke-width", 2)
}


function mouseOver(tooltip, event, d) {
    tooltip.style("display", "inline-block")
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
}


const cText = `
/**
 * Map total size of sibling node to the drawing area by a uniform scaling
 * @param {Array} sibling, array of nodes
 * @param {Object} rect, rectangluar drawing area
 */
function normalizeArea(sibling, rect) {
    const totArea = rect.width * rect.height
    let totWeight = 0
    sibling.forEach(s => { 
        totWeight += s.size
        s.weight = s.size
     })
    const factor = totArea / totWeight
    sibling.forEach(c => {
        c.size = factor * c.size
    })
}
/**
 * Compute the aspect ratio of the row and the row with the new node
 * @param {Array} row, array of nodes
 * @param {Object} node, new node
 * @param {Object} rect, rectangluar drawing area
 * @returns {Boolean} true if the aspect ratio of the row is better (closer to one) than the 
 *                    aspect ratio of the row with the new node
 */
function aspectRatios(row, node, rect) {
    const h = (rect.width < rect.height) ? rect.width : rect.height
    const a = []
    let totA = 0
    row.forEach(r => {
        a.push(r.size)
        totA += r.size
    })
    let maxAspectRatio1 = 0
    a.forEach(ai => {
        const r = Math.max(h * h * ai / (totA * totA), totA * totA / (h * h * ai))
        maxAspectRatio1 = (r > maxAspectRatio1) ? r : maxAspectRatio1
    })
    let maxAspectRatio2 = 0
    a.push(node.size)
    totA += node.size
    a.forEach(ai => {
        const r = Math.max(h * h * ai / (totA * totA), totA * totA / (h * h * ai))
        maxAspectRatio2 = (r > maxAspectRatio2) ? r : maxAspectRatio2
    })
    return maxAspectRatio1 > maxAspectRatio2
}
/**
 * Layout the row of nodes
 * @param {Array} row, array of nodes
 * @param {Object} rect, rectangluar drawing area
 */
function layoutrow(row, rect) {
    let totA = 0
    row.forEach(e => { totA += e.size })
    let x = rect.x
    let y = rect.y
    let w = 0
    let h = 0
    if (rect.width < rect.height) {
        row.forEach(e => {
            w = e.size * rect.width / totA
            h = e.size / w
            e.x = x
            e.y = y
            e.width = w
            e.height = h
            x += w
        });
        rect.y += h
        rect.height -= h
    }
    else {
        row.forEach(e => {
            h = e.size * rect.height / totA
            w = e.size / h
            e.x = x
            e.y = y
            e.width = w
            e.height = h
            y += h
        });
        rect.x += w
        rect.width -= w
    }

}
/**
 * Squarified algorithm, recursive implementation
 * @param {Array} sibling, array of nodes
 * @param {Array} row, array of nodes
 * @param {Object} rect, rectangluar drawing area
 * @returns
 */
function squarified(sibling, row, rect) {
    if (sibling.length === 0) {
        if (row.length > 0) {
            layoutrow(row, rect)
        }
        return
    }
    let node = sibling[0]
    if (row.length === 0) {
        row.push(node)
        squarified(sibling.slice(1), row, rect)
    }
    else {
        if (aspectRatios(row, node, rect)) {
            row.push(node)
            squarified(sibling.slice(1), row, rect)
        }
        else {
            layoutrow(row, rect)
            squarified(sibling, [], rect)
        }
    }
}
/**
 * Compute the treemap, recursive implementation
 * @param {Object} tree, tree with main tree functions
 * @param {Object} node, node of the tree
 */
function treemap(tree, node) {
    if (tree.hasChildren(node)) {
        const width = node.width
        const height = node.height
        const x0 = node.x
        const y0 = node.y
        const rect = { width: width, height: height, x: x0, y: y0 }
        const sibling = node.children
        normalizeArea(sibling, rect)
        squarified(sibling.sort((a, b) => b.size - a.size ), [], rect)
        sibling.forEach(n => treemap(tree, n))
    }
}
`

const hlPre = d3.select("#hl-code").append("pre")
const hlCod = hlPre
    .append("code")
    .attr("class", "language-javascript")
    .attr("style", "border: 1px solid #C1BAA9")
    .text(cText)