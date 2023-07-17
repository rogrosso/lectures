const width =  550
const height = 550
const margin = { top: 30, right: 30, bottom: 30, left: 30 }
const canvas = d3.select("#word-cloud")
const svgCanvas = canvas.append("div").attr("class", "cell").attr("id", "svg-canvas")
const svg = svgCanvas.append("svg").attr("width", width).attr("height", height)
const preGroup = svg.append("g")

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
    while (set.size < 80 || cnt >= nr_w) {
        const s = textStr[ Math.floor(Math.random() * nr_w )]
        if (s.length > 2) set.add(s)
    }
    set.forEach( e => {
        const mu = 20
        const sigma = 18
        const maxH = 50
        const minH = 6
        let h = gaussianNoise(mu,sigma)

        while (h < minH  || h > maxH){
            h = gaussianNoise(mu,sigma)
        }
        if (h < minH) h = minH
        if (h > maxH) h = maxH
        words.push({
            word: e,
            x: 0,
            y: 0,
            width: 100,
            height: h,
            insertion_failed: false,
            ww: width - margin.left - margin.right,
            wh: height - margin.top - margin.bottom
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
    // compute word cloud   
    wordcloud(words)
    // render
    render(words)
}
/**
 * Factory function for path generator
 * @returns {Object} pathGenerator
 */
function pathGenerator( ) {
    const nrSteps = 1000
    const dt = 1 / (nrSteps - 1)
    const dr = 0.004
    const dp = 0.004
    let r = 0
    let p = 0
    let t = 0
    function end() {
        t > nrSteps ? true : false
    }
    function next() {
        const x = r * Math.cos(p)
        const y = r * Math.sin(p)
        r += dr
        p += dp
        t += dt
        return { x: x, y: y }
    }
    return {
        end: end,
        next: next
    }

}
/**
 * Compute word cloud
 * The factory pathGenerator() returns a function with computes the positions
 * of the words in the word cloud. The path is a spiral. If the AABB test indicates
 * that there are no collision, the position of the word is accepted.
 * @param {Array} words, array of words
 */
function wordcloud(words) {
    const aabbs = []
    function intersectsAny( aabb ){
        for(let b of aabbs){
            if(aabbsIntersect(aabb, b)) return true
        }
        return false
    }
    for(let w of words){
        const path = pathGenerator()
        w.insertion_failed = true
        while (!path.end()) {
            const {x , y } = path.next() // randomizePosition( w )
            w.x = x
            w.y = y
            const aabb = getAabb( w )
            if( !intersectsAny( aabb ) ){
                aabbs.push( aabb )
                w.insertion_failed = false
                break
            }
        }
    }
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
        
function testPosition(z0, width, offset) {
    if (z0 <= 10) return false
    if (z0 + offset >= width) return false
    return true
}
function randomDistribute( width, offset ) {
    let z0 = gaussianNoise(width / 2, width / 10)
    while (!testPosition(z0,width,offset)) {
        z0 = gaussianNoise(width / 2, width / 10)
    }
    return z0
}

function randomizePosition( word ) {
    const width = word.ww
    const height = word.wh
    word.x = randomDistribute( width, word.width + 30 )
    word.y = randomDistribute( height, word.height + 10 )
}

function getAabb( word ){ return {x:word.x, y:word.y, dh:word.height/2, dw:word.width/2}; }
function aabbsIntersect( aabb_a, aabb_b ) {
    const ax = aabb_a.x - 1
    const bx = aabb_b.x - 1
    const ay = aabb_a.y - 1
    const by = aabb_b.y - 1
    const aw = aabb_a.dw + 1
    const bw = aabb_b.dw + 1
    const ah = aabb_a.dh + 1
    const bh = aabb_b.dh + 1
    return !(Math.abs(ax - bx) > (aw + bw) || Math.abs(ay - by) > (ah + bh))
}

function render(words) {
    // drawing
    const iW = width - margin.left - margin.right
    const iH = height - margin.top - margin.bottom

    const nonFailedWords = []
    words.forEach( w => {
        if (!w.insertion_failed) nonFailedWords.push(w)
    })
    words.length = 0
    nonFailedWords.forEach( w => words.push(w) )
    let xMin = Infinity 
    let xMax = -Infinity
    words.forEach( w => {
        const v = w.x - w.width/2
        xMin = xMin < v ? xMin : v
        const r = w.x + w.width / 2
        xMax = xMax > r ? xMax : r
    })
    const x0 = width / 2 - (xMin+xMax) / 2
    let yMin = Infinity 
    let yMax = -Infinity
    words.forEach( w => {
        const v = w.y - w.height/2
        yMin = yMin < v ? yMin : v
        const r = w.y + w.height / 2
        yMax = yMax > r ? yMax : r
    })
    const y0 = height / 2 - (yMin+yMax) / 2

    const g = svg.append("g")
    g.selectAll("text").remove()
    g.selectAll("rect").remove()
    g.attr('transform', `translate(${x0},${y0})`)

    const colorScale1 = d3.scaleOrdinal().domain(d3.range(12)).range(d3.schemePaired)
    const colorScale2 = d3.scaleOrdinal().domain(d3.range(10)).range(d3.schemeTableau10)
    g.selectAll("text").data(words)
        .join("text")
        .attr("text-anchor","middle")
        .attr("dominant-baseline","middle")
        .attr("font-size",d=>d.height)
        .attr("x",d=>d.x)
        .attr("y",d=>d.y)
        //.attr("transform", d => `rotate(${-30}, ${d.x}, ${d.y})`)
        .attr('fill', d => {
            const index = Math.floor(Math.random() * 22)
            if (index < 12) {
                if (index === 10) {
                    return d3.color(colorScale1(index)).darker()
                } else {
                    return colorScale1(index)
                }
            } else {
                const idx = index - 12
                return colorScale2(idx)
            }
        })
        .text(d=>d.insertion_failed?"":d.word);
    const debug_aabbs  = false
    if(debug_aabbs){
        g.selectAll("rect").data(words).enter().append("rect")
            .attr("x",d=>d.x - d.width*0.5)
            .attr("y",d=>d.y - d.height*0.5)
            .attr("width",d=>d.width)
            .attr("height",d=>d.height)
            .attr("stroke",d=>d.insertion_failed?"red":"green")
            .attr("stroke-width",0.5)
            .attr("fill","none");
    }
}


const cText = `
/**
 * Factory function for path generator
 * @returns {Object} pathGenerator
 */
function pathGenerator( ) {
    const nrSteps = 1000
    const dt = 1 / (nrSteps - 1)
    const dr = 0.004
    const dp = 0.004
    let r = 0
    let p = 0
    let t = 0
    function end() {
        t > nrSteps ? true : false
    }
    function next() {
        const x = r * Math.cos(p)
        const y = r * Math.sin(p)
        r += dr
        p += dp
        t += dt
        return { x: x, y: y }
    }
    return {
        end: end,
        next: next
    }

}
/**
 * Compute word cloud
 * The factory pathGenerator() returns a function with computes the positions
 * of the words in the word cloud. The path is a spiral. If the AABB test indicates
 * that there are no collision, the position of the word is accepted.
 * @param {Array} words, array of words
 */
function wordcloud(words) {
    const aabbs = []
    function intersectsAny( aabb ){
        for(let b of aabbs){
            if(aabbsIntersect(aabb, b)) return true
        }
        return false
    }
    for(let w of words){
        const path = pathGenerator()
        w.insertion_failed = true
        while (!path.end()) {
            const {x , y } = path.next() // randomizePosition( w )
            w.x = x
            w.y = y
            const aabb = getAabb( w )
            if( !intersectsAny( aabb ) ){
                aabbs.push( aabb )
                w.insertion_failed = false
                break
            }
        }
    }
}
`
const hlPre = d3.select("#hl-code").append("pre")
const hlCod = hlPre
    .append("code")
    .attr("class", "language-javascript")
    .attr("style", "border: 1px solid #C1BAA9")
    .text(cText)