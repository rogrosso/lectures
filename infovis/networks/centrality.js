/**
 * Computes the and accumulate the betweenness centrality for a source node
 * @param {Array} A, adjacency list 
 * @param {Number} source, index of source node
 * @param {Array} c_, array which accumulate centrality values
 */
function bc_( A, source, c_ ){
    const n = A.length
    const d_ = new Array(n).fill(-1)
    const sigma_ = new Array(n).fill(0)
    const delta_ = new Array(n).fill(0)
    d_[source] = 0
    sigma_[source] = 1
    const q_ = [source] // queue
    const s_ = [] // stack
    const p_ = new Array(n).fill(null).map( e => []) // list of parent
    while (q_.length > 0) {
        const v = q_.shift()
        const d = d_[v]
        s_.push(v)
        for (let w of A[v]) {
            if (d_[w] < 0) {
                d_[w] = d + 1
                q_.push(w)
            }
            if (d_[w] === d + 1) {
                sigma_[w] += sigma_[v]
                p_[w].push(v)
            }
        }
    }
    while (s_.length > 0) {
        let w = s_.pop()
        for (let v of p_[w]) {
            delta_[v] += (sigma_[v] / sigma_[w]) * (1 + delta_[w])
        }
        if (w !== source) {
            c_[w] += delta_[w]
        }
    }
}
/**
 * Computes betweenness centrality for each node in the graph
 * @param {Array} nodes, array of nodes
 * @param {Array} neighbors, adjacency list
 * @returns {Array} c_, array of betweenness centrality values for each node in nodes
 * @see https://en.wikipedia.org/wiki/Betweenness_centrality
 * @see Brandes, Ulrik (2001). "A faster algorithm for betweenness centrality". Journal of Mathematical Sociology. 25 (2): 163–177. doi:10.1080/0022250X.2001.9990249. S2CID 14548872.
 */
export function betweenness(nodes, neighbors) {
    const c_ = new Array(nodes.length).fill(0)
    for (let n of nodes) {
        bc_(neighbors, n.index, c_)
    }
    return c_
}
/**
 * Computes the distance from source node to all other nodes in the graph
 * @param {Array} A, adjacency list
 * @param {Number} source, index of source node
 * @returns {Number} s, sum of shortest paths from source node to all other nodes
 */
function cc_(A, source) {
    const d_ = new Array(A.length).fill(Infinity)
    const v_ = new Array(A.length).fill(false)
    const q_ = [source]
    let s = 0
    d_[source] = 0
    v_[source] = true
    while (q_.length > 0) {
        const v = q_.shift()
        for (let w of A[v]) {
            if (!v_[w]) {
                v_[w] = true
                d_[w] = d_[v] + 1
                s += d_[w]
                q_.push(w)
            }
        }
    }
    return s
}
/**
 * Computes closeness centrality for each node in nodes
 * @param {Array} nodes, array of nodes
 * @param {Array} neighbors, adjacency list
 * @returns {Array} c_, array of closeness centrality values for each node in nodes
 */
export function closeness(nodes, neighbors) {
    const c_ = new Array(nodes.length).fill(0)
    for (let n of nodes) {
        c_[n.index] = 1 / cc_(neighbors, n.index, c_)
    }
    return c_
}
/**
 * Computes the eigenvector centrality for each node in the graph
 * @param {Array} A, adjacency list
 * @param {Number} maxIter, maximum number of iterations
 * @param {Number} eps, tolerance
 * @returns {Array} b_, array of eigenvector centrality values for each node in the graph
 */
export function eigenvector(A, maxIter, eps) {
    let b_ = new Array(A.length).fill(1)
    let c_ = new Array(A.length).fill(0)
    let e_ = Infinity
    while (e_ > eps && maxIter-- > 0) {
        let r_ = 0
        for (let i = 0; i < A.length; i++) {
            for (let j of A[i]) {
                c_[i] += b_[j]
            }
            r_ += c_[i] * c_[i]
        }
        r_ = Math.sqrt(r_)
        for (let i = 0; i < A.length; i++) {
            c_[i] /= r_
        }
        e_ = 0
        for (let i = 0; i < A.length; i++) {
            e_ += Math.abs((b_[i] - c_[i])**2)
            b_[i] = c_[i]
        }
    }
    const m_ = Math.max(...b_)
    for (let i = 0; i < A.length; i++) {
        b_[i] /= m_
    }
    return b_
}
/**
 * Computes the PageRank for each node in the graph
 * @param {Array} I, adjacency list of incoming edges
 * @param {Array} O, adjacency list of outgoing edges
 * @param {Number} d, damping factor
 * @param {Number} maxIter, maximum number of iterations
 * @param {Number} eps, tolerance
 * @returns {Array} b_, array of PageRank values for each node in the graph
 */
export function pagerank(I, O, d, maxIter, eps) {
    const N = I.length
    let b_ = new Array(N).fill(1/N)
    let c_ = new Array(N).fill((1-d)/N)
    let e_ = Infinity
    while (e_ > eps && maxIter-- > 0) {
        for (let i = 0; i < N; i++) {
            //if (I[i].length === 0) continue
            for (let j of I[i]) {
                c_[i] += d * b_[j]/O[j].length
            }
        }
        e_ = 0
        for (let i = 0; i < N; i++) {
            e_ += Math.abs((b_[i] - c_[i])**2)
            b_[i] = c_[i]
            c_[i] = (1-d)/N
        }
    }
    const m_ = Math.max(...b_)
    for (let i = 0; i < N; i++) {
        b_[i] /= m_
    }
    return b_
}