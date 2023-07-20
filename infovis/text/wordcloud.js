import { randColorsHex } from "../common/colors.js"
import { dropdown } from "../common/gui.js"
import { normalRandomFactory, random_seed } from "../../common/random.js"

const width =  550
const height = 550
const margin = { top: 30, right: 30, bottom: 30, left: 30 }
const canvas = d3.select("#word-cloud")

let obbW = undefined
let aabbW = undefined
let words = undefined
let grpWords = undefined
let debGrp = undefined
let debug_flag = false

// gui
const pKeys = ["AABB", "OBB"]
let pSel = "AABB"
const pId = "layout-menu"
const pDiv = canvas.append("div").attr("class", "cell").attr("id", pId)
const guiConfig = {
    divObj: pDiv,
    text: "layout: ",
    selection: pSel,
    keys: pKeys,
    handler: layoutHandler,
}
dropdown(guiConfig)
//const dDiv = canvas.append("div").attr("class", "cell").attr("id", "debug")
const dLabel = pDiv.append("label").attr("class", "gui").attr("for", "debug")
    .attr('padding-left', '10px')
    .text(" | debug: ")
const dInput = pDiv.append("input").attr("type", "checkbox").attr("id", "debug-input")
    .attr("name", "debug")
    .on("click", function(event) {
        let val = d3.select('#debug-input').property('checked')
        if (val) {
            debug_flag = true
        } else {
            debug_flag = false
        }
        redraw()
    })
    
// svg
const svgCanvas = canvas.append("div").attr("class", "cell").attr("id", "svg-canvas")
const svg = svgCanvas.append("svg").attr("width", width).attr("height", height)
const preGroup = svg.append("g").attr('class', 'pre-group')

const url = "../data/theraven.json"
drawAll(url) 
async function drawAll(url) {
    const response = await fetch(url)
    const words = await response.json()
    draw(words)
}

function draw(text) {
    const textStr = text.theraven.replace(/[^a-zA-Z0-9 ]/g, ' ').split(/\b\W+\b/g)
    const words = []
    const nr_w = textStr.length
    const set = new Set()
    let cnt = 0
    const random = random_seed(123)
    while (set.size < 80 && cnt < nr_w) {
        const s = textStr[ Math.floor(random() * nr_w ) ]
        if (s.length > 2) {
            set.add(s)
            cnt++
        }
    }

    const mu = 20
    const sigma = 18
    const maxH = 90
    const minH = 6
    const gaussianNoise = normalRandomFactory(123, mu, sigma)
    set.forEach( e => {
        let h = gaussianNoise()
        /*while (h < minH  || h > maxH){
            h = gaussianNoise()
        }*/
        if (h < minH) h = minH
        if (h > maxH) h = maxH
        words.push({
            word: e,
            fontFalimily: "Impact",
            width: 100,
            height: h
        })
    })
    // compute font-size which is a hint for word height in plot
    words.sort((a,b) => b.height - a.height )
    // compute word width in canvas
    preGroup.selectAll('text')
        .data(words, d => d)
        .join('text')
            .attr('x', 100)
            .attr('y',110)
            .attr('font-size', d => d.height )
            .text(d => d.word)
            .each( function(d) { d.width = this.getComputedTextLength() })
            .remove()
    d3.select(".pre-group").remove()
    // compute word cloud
    const iw = width - margin.left - margin.right
    const ih = height - margin.top - margin.bottom
    aabbW = wordcloud(words, iw, ih, false)
    obbW  = wordcloud(words, iw, ih, true)
    // render
    render(aabbW, obbW)
}
function gaussianNoise(mu, sigma) {
    const pi2 = 2 * Math.PI
    let u1 = 0
    let u2 = 0
    while (u1 < Number.EPSILON) u1 = Math.random()
    u2 = Math.random()
    const mag = sigma * Math.sqrt(-2 * Math.log(u1))
    const z0 = mag * Math.cos(pi2 * u2) + mu
    const z1 = mag * Math.sin(pi2 * u2) + mu
    return z0
}


/**
 * Factory function for path generator
 * Generates a spiral path
 * @returns {Object} pathGenerator
 */
function pathGenerator(w,h) {
    const cx = w / 2
    const cy = h / 2
    const nrSteps = 5000
    const dr = 0.1
    const dp = 0.1
    let r = 0
    let p = 0
    let step = 0
    function end() {
        return step > nrSteps ? true : false
    }
    function next() {
        step++
        const x = r * Math.cos(p) + cx
        const y = r * Math.sin(p) + cy
        r += dr
        p += dp
        return { x: x, y: y }
    }
    return {
        end: end,
        next: next
    }

}
/**
 * Returns a function which generates random orientations
 * @returns {Object} orientationGenerator
 */
function orientationGenerator() {
    const nrO = 7
    let pos = 0
    const angle = Math.PI / 4
    const da =  2 * angle / (nrO - 1)
    const orientation = []
    let a = -angle
    for (let i = 0; i < nrO; i++) {
        orientation.push(a)
        a += da
    }
    function next() {
        const i = Math.floor(nrO * Math.random()) // pos++
        return orientation[i%nrO]
    }
    return { next: next }
}
/**
 * Compute word cloud
 * The factory pathGenerator() returns a function with computes the positions
 * of the words in the word cloud. The path is a spiral. If the AABB test indicates
 * that there are no collision, the position of the word is accepted.
 * @param {Array} words, array of words
 * @param {Number} width, width of canvas
 * @param {Number} height, height of canvas
 * @param {Boolean} flag, true if OBB test is used, false if AABB test is used
 * @returns {Array} array of words with their positions
 */
function wordcloud(words, width, height, flag) {
    let orientation =  {  next: () => { return 0 } }
    if (flag) orientation = orientationGenerator()
    const obbs = []
    
    const res = []
    for(let w of words) {
        const path = pathGenerator(width, height)
        const angle = orientation.next()
        let insertion_failed = true
        let xCoord = 0
        let yCoord = 0
        let obb = undefined
        while (!path.end()) {
            const {x, y} = path.next() // randomizePosition( w )
            xCoord = x
            yCoord = y
            obb = getObb( w, x, y, angle )
            if (!bbox(width, height, obb)) continue
            if( !intersectsOBB( obb , obbs) ) { // there is no overlap
                obbs.push( obb )
                insertion_failed = false
                break
            }
        }
        if (!bbox(width, height, obb)) {
            insertion_failed = true
        }
        res.push({word: w, obb: obb, insertion_failed: insertion_failed})
    }
    return res
}
/**
 * 
 * @param {Number} w, width of canvas 
 * @param {Number} h 
 * @param {Object} obb, oriented bounding box 
 * @returns {Boolean} true if bounding box is inside canvas
 */
function bbox(w, h, obb) {
    const minX = Math.min(obb.v0.x, obb.v1.x, obb.v2.x, obb.v3.x)
    const maxX = Math.max(obb.v0.x, obb.v1.x, obb.v2.x, obb.v3.x)
    const minY = Math.min(obb.v0.y, obb.v1.y, obb.v2.y, obb.v3.y)
    const maxY = Math.max(obb.v0.y, obb.v1.y, obb.v2.y, obb.v3.y)
    if (minX < 0 || maxX > w) return false
    if (minY < 0 || maxY > h) return false
    return true
}
/**
 * Computes the oriented bounding box of a word
 * @param {Object} word, word object
 * @param {Number} x, x-coordinate of center of word
 * @param {Number} y, y-coordinate of center of word
 * @param {Number} angle, orientation of word
 * @returns {Object} obb, oriented bounding box
 */
function getObb( word, x, y, angle ) {
    const w = word.width
    const h = word.height
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    // rotate
    const v0 = {x: -w/2, y: -h/2}
    const v1 = {x:  w/2, y: -h/2}
    const v2 = {x: -w/2, y:  h/2}
    const v3 = {x:  w/2, y:  h/2}
    const v = [v0, v1, v2, v3]
    for (let k = 0; k < 4; k++) {
        const x = v[k].x
        const y = v[k].y
        v[k].x = cos * x - sin * y
        v[k].y = sin * x + cos * y
    }
    // translate
    for (let k = 0; k < 4; k++) {
        v[k].x += x
        v[k].y += y
    }

    return { c: {x, y}, angle: angle, v0, v1, v2, v3 }
}
/**
 * 
 * @param {Object} obb, oriented bounding box
 * @param {Array} obbs, array of oriented bounding boxes to test against
 * @returns {Boolean} true if there is overlap, false if there is no overlap
 */
function intersectsOBB( obb, obbs ) {
    for(let b of obbs){
        if (obbIntersectsOBB(obb, b)) return true // there is overlap
    }
    //console.log('no overlap')
    return false // there is no overlap
}
/**
 * Normalizes a vector to length 1
 * @param {Object} v, vector 
 * @returns {Object} normalized vector {x, y}
 */
function normalize(v) {
    const l = Math.sqrt(v.x * v.x + v.y * v.y)
    v.x /= l
    v.y /= l
    return v
}
/**
 * Intersects two oriented bounding boxes
 * It uses the Separating Axis Theorem
 * @param {Object} obb_a, oriented bounding box
 * @param {Object} obb_b, oriented bounding box
 * @returns {Boolean} true if there is overlap, false if there is no overlap
 */
function obbIntersectsOBB( obb_a, obb_b ) {
    // check Separating Axis Theorem
    // obb_a
    let p0 = obb_a.c
    let n0 = {x: obb_a.v1.x - obb_a.v0.x, y: obb_a.v1.y - obb_a.v0.y}
    n0 = normalize(n0)
    // project obb_a onto n0
    if (sat(p0, n0, obb_a, obb_b)) return false // there is no overlap
    n0 = {x: obb_a.v2.x - obb_a.v0.x, y: obb_a.v2.y - obb_a.v0.y}
    n0 = normalize(n0)
    if (sat(p0, n0, obb_a, obb_b)) return false // there is no overlap
    // obb_b
    p0 = obb_b.c
    n0 = {x: obb_b.v1.x - obb_b.v0.x, y: obb_b.v1.y - obb_b.v0.y}
    n0 = normalize(n0)
    if (sat(p0, n0, obb_a, obb_b)) return false // there is no overlap
    n0 = {x: obb_b.v2.x - obb_b.v0.x, y: obb_b.v2.y - obb_b.v0.y}
    n0 = normalize(n0)
    if (sat(p0, n0, obb_a, obb_b)) return false // there is no overlap
    return true // there is overlap, no separating axis
}
/**
 * Computes the intersection of two oriented bounding boxes
 * along a given axis
 * @param {Object} p0, point on axis
 * @param {Object} n0, axis
 * @param {Object} obb_a, oriented bounding box
 * @param {Object} obb_b, oriented bounding box
 * @returns {Boolean} true if there is overlap, false if there is no overlap
 */
function sat (p0, n0, obb_a, obb_b) {
    const c0 = project(p0, n0, obb_a.v0)
    const c1 = project(p0, n0, obb_a.v1)
    const c2 = project(p0, n0, obb_a.v2)
    const c3 = project(p0, n0, obb_a.v3)
    const c4 = project(p0, n0, obb_b.v0)
    const c5 = project(p0, n0, obb_b.v1)
    const c6 = project(p0, n0, obb_b.v2)
    const c7 = project(p0, n0, obb_b.v3)
    const e0 = Math.min(c0, c1, c2, c3)
    const e1 = Math.max(c0, c1, c2, c3)
    const e2 = Math.min(c4, c5, c6, c7)
    const e3 = Math.max(c4, c5, c6, c7)
    if (e0 > e3 || e1 < e2) return true // there is no overlap
    return false // there is overlap
}
/**
 * 
 * @param {Object} p, point
 * @param {Object} n, normal 
 * @param {Object} v, vector 
 * @returns {Number} projection of v onto n
 */
function project(p, n, v) {
    return (v.x - p.x) * n.x + (v.y - p.y) * n.y
}


function toDegree(a) {
    return a * 180 / Math.PI
}

function render( ) {
    // default is aabb
    words = aabbW
    // drawing
    const iW = width - margin.left - margin.right
    const iH = height - margin.top - margin.bottom
    const word = d => d.word.word
    const x = d => d.insertion_failed? 0 : d.obb.c.x
    const y = d => d.insertion_failed? 0 : d.obb.c.y
    const bboxX = d => d.insertion_failed? 0 : d.obb.v0.x
    const bboxY = d => d.insertion_failed? 0 : d.obb.v0.y
    const angle = d => d.insertion_failed? 0 : d.obb.angle
    const wWidth = d => d.insertion_failed? 0 : d.word.width
    const wHeight = d => d.insertion_failed? 0 : d.word.height
    const fontFalimily = d => d.word.fontFalimily
    const t = d3.transition().duration(1000)

    // center plot 
    const minX = d3.min(words, d => x(d))
    const maxX = d3.max(words, d => x(d))
    const minY = d3.min(words, d => y(d))
    const maxY = d3.max(words, d => y(d))
    const x0 = width / 2 - (minX+maxX) / 2
    const y0 = height / 2 - (minY+maxY) / 2

    const g = svg.append("g")
    g.selectAll("text").remove()
    g.selectAll("rect").remove()
    g.attr('transform', `translate(${x0},${y0})`)

    const randCol = randColorsHex(11)
    grpWords = g.selectAll("text").data(words)
        .join("text")
        .attr("text-anchor","middle")
        .attr("dominant-baseline","middle")
        .attr("font-size",d => wHeight(d))
        .attr("font-family",d => fontFalimily(d))
        .attr("x",d => x(d))
        .attr("y",d => y(d))
        .attr("transform", d => `rotate(${toDegree(angle(d))}, ${x(d)}, ${y(d)})`)
        .attr('fill', d => randCol())
        .text(d => d.insertion_failed? "" : word(d))
    // debug word cloud 
    
    debGrp = g.selectAll("rect").data(words)
        .join("rect")
        .attr("x", d => bboxX(d))
        .attr("y", d => bboxY(d))
        .attr("width",  d => wWidth(d))
        .attr("height", d => wHeight(d))
        .attr("stroke", "green")
        .attr("stroke-width",0.5)
        .attr("fill","none")
        .attr('visibility', d => debug_flag && !d.insertion_failed ? 'visible' : 'hidden')
        .attr('transform', d => `rotate(${toDegree(angle(d))}, ${bboxX(d)}, ${bboxY(d)})`)
}

function redraw() {
    const word = d => d.word.word
    const x = d => d.obb.c.x
    const y = d => d.obb.c.y
    const bboxX = d => d.insertion_failed? 0 : d.obb.v0.x
    const bboxY = d => d.insertion_failed? 0 : d.obb.v0.y
    const angle = d => d.obb.angle
    const wWidth = d => d.word.width
    const wHeight = d => d.word.height
    const t = d3.transition().duration(1000)
    grpWords.data(words)
        .transition(t)
        .attr("x",d => x(d))
        .attr("y",d => y(d))
        .attr("transform", d => `rotate(${toDegree(angle(d))}, ${x(d)}, ${y(d)})`)
        //.attr('fill', d => randCol())
        .text(d => d.insertion_failed? "" : word(d))
    debGrp.data(words)
            .attr("x",d => bboxX(d))
            .attr("y",d => bboxY(d))
            .attr("width", d => wWidth(d))
            .attr("height", d => wHeight(d))
            .attr("stroke","green")
            .attr("stroke-width",0.5)
            .attr("fill","none")
            .attr('visibility', d => debug_flag && !d.insertion_failed ? 'visible' : 'hidden')
            .attr('transform', d => `rotate(${toDegree(angle(d))}, ${bboxX(d)}, ${bboxY(d)})`)
}

function layoutHandler(text, value) {
    if (value === "AABB") {
        words = aabbW
    } else if (value === "OBB") {
        words = obbW
    }
    redraw()
}

const cText = `
/**
 * Factory function for path generator
 * Generates a spiral path
 * @returns {Object} pathGenerator
 */
function pathGenerator(w,h) {
    const cx = w / 2
    const cy = h / 2
    const nrSteps = 5000
    const dr = 0.1
    const dp = 0.1
    let r = 0
    let p = 0
    let step = 0
    function end() {
        return step > nrSteps ? true : false
    }
    function next() {
        step++
        const x = r * Math.cos(p) + cx
        const y = r * Math.sin(p) + cy
        r += dr
        p += dp
        return { x: x, y: y }
    }
    return {
        end: end,
        next: next
    }

}
/**
 * Returns a function which generates random orientations
 * @returns {Object} orientationGenerator
 */
function orientationGenerator() {
    const nrO = 7
    let pos = 0
    const angle = Math.PI / 4
    const da =  2 * angle / (nrO - 1)
    const orientation = []
    let a = -angle
    for (let i = 0; i < nrO; i++) {
        orientation.push(a)
        a += da
    }
    function next() {
        const i = Math.floor(nrO * Math.random()) // pos++
        return orientation[i%nrO]
    }
    return { next: next }
}
/**
 * Compute word cloud
 * The factory pathGenerator() returns a function with computes the positions
 * of the words in the word cloud. The path is a spiral. If the AABB test indicates
 * that there are no collision, the position of the word is accepted.
 * @param {Array} words, array of words
 * @param {Number} width, width of canvas
 * @param {Number} height, height of canvas
 * @param {Boolean} flag, true if OBB test is used, false if AABB test is used
 * @returns {Array} array of words with their positions
 */
function wordcloud(words, width, height, flag) {
    let orientation =  {  next: () => { return 0 } }
    if (flag) orientation = orientationGenerator()
    const obbs = []
    
    const res = []
    for(let w of words) {
        const path = pathGenerator(width, height)
        const angle = orientation.next()
        let insertion_failed = true
        let xCoord = 0
        let yCoord = 0
        let obb = undefined
        while (!path.end()) {
            const {x, y} = path.next() // randomizePosition( w )
            xCoord = x
            yCoord = y
            obb = getObb( w, x, y, angle )
            if (!bbox(width, height, obb)) continue
            if( !intersectsOBB( obb , obbs) ) { // there is no overlap
                obbs.push( obb )
                insertion_failed = false
                break
            }
        }
        if (!bbox(width, height, obb)) {
            insertion_failed = true
        }
        res.push({word: w, obb: obb, insertion_failed: insertion_failed})
    }
    return res
}
/**
 * 
 * @param {Number} w, width of canvas 
 * @param {Number} h 
 * @param {Object} obb, oriented bounding box 
 * @returns {Boolean} true if bounding box is inside canvas
 */
function bbox(w, h, obb) {
    const minX = Math.min(obb.v0.x, obb.v1.x, obb.v2.x, obb.v3.x)
    const maxX = Math.max(obb.v0.x, obb.v1.x, obb.v2.x, obb.v3.x)
    const minY = Math.min(obb.v0.y, obb.v1.y, obb.v2.y, obb.v3.y)
    const maxY = Math.max(obb.v0.y, obb.v1.y, obb.v2.y, obb.v3.y)
    if (minX < 0 || maxX > w) return false
    if (minY < 0 || maxY > h) return false
    return true
}
/**
 * Computes the oriented bounding box of a word
 * @param {Object} word, word object
 * @param {Number} x, x-coordinate of center of word
 * @param {Number} y, y-coordinate of center of word
 * @param {Number} angle, orientation of word
 * @returns {Object} obb, oriented bounding box
 */
function getObb( word, x, y, angle ) {
    const w = word.width
    const h = word.height
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    // rotate
    const v0 = {x: -w/2, y: -h/2}
    const v1 = {x:  w/2, y: -h/2}
    const v2 = {x: -w/2, y:  h/2}
    const v3 = {x:  w/2, y:  h/2}
    const v = [v0, v1, v2, v3]
    for (let k = 0; k < 4; k++) {
        const x = v[k].x
        const y = v[k].y
        v[k].x = cos * x - sin * y
        v[k].y = sin * x + cos * y
    }
    // translate
    for (let k = 0; k < 4; k++) {
        v[k].x += x
        v[k].y += y
    }

    return { c: {x, y}, angle: angle, v0, v1, v2, v3 }
}
/**
 * 
 * @param {Object} obb, oriented bounding box
 * @param {Array} obbs, array of oriented bounding boxes to test against
 * @returns {Boolean} true if there is overlap, false if there is no overlap
 */
function intersectsOBB( obb, obbs ) {
    for(let b of obbs){
        if (obbIntersectsOBB(obb, b)) return true // there is overlap
    }
    //console.log('no overlap')
    return false // there is no overlap
}
/**
 * Normalizes a vector to length 1
 * @param {Object} v, vector 
 * @returns {Object} normalized vector {x, y}
 */
function normalize(v) {
    const l = Math.sqrt(v.x * v.x + v.y * v.y)
    v.x /= l
    v.y /= l
    return v
}
/**
 * Intersects two oriented bounding boxes
 * It uses the Separating Axis Theorem
 * @param {Object} obb_a, oriented bounding box
 * @param {Object} obb_b, oriented bounding box
 * @returns {Boolean} true if there is overlap, false if there is no overlap
 */
function obbIntersectsOBB( obb_a, obb_b ) {
    // check Separating Axis Theorem
    // obb_a
    let p0 = obb_a.c
    let n0 = {x: obb_a.v1.x - obb_a.v0.x, y: obb_a.v1.y - obb_a.v0.y}
    n0 = normalize(n0)
    // project obb_a onto n0
    if (sat(p0, n0, obb_a, obb_b)) return false // there is no overlap
    n0 = {x: obb_a.v2.x - obb_a.v0.x, y: obb_a.v2.y - obb_a.v0.y}
    n0 = normalize(n0)
    if (sat(p0, n0, obb_a, obb_b)) return false // there is no overlap
    // obb_b
    p0 = obb_b.c
    n0 = {x: obb_b.v1.x - obb_b.v0.x, y: obb_b.v1.y - obb_b.v0.y}
    n0 = normalize(n0)
    if (sat(p0, n0, obb_a, obb_b)) return false // there is no overlap
    n0 = {x: obb_b.v2.x - obb_b.v0.x, y: obb_b.v2.y - obb_b.v0.y}
    n0 = normalize(n0)
    if (sat(p0, n0, obb_a, obb_b)) return false // there is no overlap
    return true // there is overlap, no separating axis
}
/**
 * Computes the intersection of two oriented bounding boxes
 * along a given axis
 * @param {Object} p0, point on axis
 * @param {Object} n0, axis
 * @param {Object} obb_a, oriented bounding box
 * @param {Object} obb_b, oriented bounding box
 * @returns {Boolean} true if there is overlap, false if there is no overlap
 */
function sat (p0, n0, obb_a, obb_b) {
    const c0 = project(p0, n0, obb_a.v0)
    const c1 = project(p0, n0, obb_a.v1)
    const c2 = project(p0, n0, obb_a.v2)
    const c3 = project(p0, n0, obb_a.v3)
    const c4 = project(p0, n0, obb_b.v0)
    const c5 = project(p0, n0, obb_b.v1)
    const c6 = project(p0, n0, obb_b.v2)
    const c7 = project(p0, n0, obb_b.v3)
    const e0 = Math.min(c0, c1, c2, c3)
    const e1 = Math.max(c0, c1, c2, c3)
    const e2 = Math.min(c4, c5, c6, c7)
    const e3 = Math.max(c4, c5, c6, c7)
    if (e0 > e3 || e1 < e2) return true // there is no overlap
    return false // there is overlap
}
/**
 * 
 * @param {Object} p, point
 * @param {Object} n, normal 
 * @param {Object} v, vector 
 * @returns {Number} projection of v onto n
 */
function project(p, n, v) {
    return (v.x - p.x) * n.x + (v.y - p.y) * n.y
}
`
const hlPre = d3.select("#hl-code").append("pre")
const hlCod = hlPre
    .append("code")
    .attr("class", "language-javascript")
    .attr("style", "border: 1px solid #C1BAA9")
    .text(cText)