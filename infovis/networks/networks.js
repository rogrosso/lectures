import { binaryHeapFactory } from '../../common/binaryHeap.js'
import { keyCantor as keyGen } from '../../common/utilities.js'
import { easyRandom } from '../../common/random.js'

// Prepare network for processing, i.e. complete data structure
export function setNetwork(network) {
    const {nodes, edges } = network
    // check, that undirected edges are unique
    const m_ = new Map()
    for (let e of edges) {
        if (typeof e.source === 'string') e.source = +e.source
        if (typeof e.target === 'string') e.target = +e.target
        const key = keyGen(e.source, e.target)
        const s = e.source 
        const t = e.target
        m_.set(key, e)
        e.key = key
    }
    if (m_.size !== edges.length) {
        console.log(`error: undirected edges are not unique`)
    }
    // compute node neighbors
    network.neighbors = new Array(nodes.length).fill(null).map( e => []) 
    network.weights = new Array(nodes.length).fill(null).map( e => [])
    const {neighbors, weights} = network
    // at this point, edges are unique
    for (let e of edges) {
        const s = e.source
        const t = e.target
        neighbors[s].push(t) // { index: t, weight: e.weight })
        neighbors[t].push(s) // ({ index: s, weight: e.weight })
        if (e.hasOwnProperty('weight')) {
            weights[s].push(e.weight)
            weights[t].push(e.weight)
        } else {
            weights[s].push(1)
            weights[t].push(1)
        }
    }
    for (let i = 0; i < neighbors.length; i++) {
        neighbors[i] = Array.from(neighbors[i])
    }
    // compute degree centrality, add id 
    for (let i = 0; i < nodes.length; i++) {
        nodes[i].index = i
        nodes[i].index = nodes[i].index
        nodes[i].c = neighbors[i].length
        if (typeof nodes[i].x === 'string') nodes[i].x = +nodes[i].x
        if (typeof nodes[i].y === 'string') nodes[i].y = +nodes[i].y
        if (!nodes[i].hasOwnProperty('group')) nodes[i].group = 1
        if (!nodes[i].hasOwnProperty('name')) nodes[i].name = 'node ' + nodes[i].index
    }

}

// compute and mark leaves
// there is a root node, and nodes have predecessors
export function leaves(nodes) {
    const allLeaves = []
    nodes.forEach(n => n.type = 'leaf')
    nodes.forEach((n, i) => {
        if (n.p === -1) {
            n.type = 'root'
            //console.log('root: ' + i)
        } else {
            nodes[n.p].type = 'inner'
            //console.log('inner: ' + i)
        }
    })
    nodes.forEach((n, i) => {
        if (n.type === 'leaf') {
            allLeaves.push(i)
        }
    })
    return allLeaves
}

// BFS: breadth-first search with backtracking 
export function bfs(nodes, neighbors, index) {
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

// Modified BFS: breadth-first search with backtracking to count the 
// number of shortest paths from the root node to all other nodes
export function bfsCount(nodes, neighbors, index) {
    nodes.forEach((n) => {
        n.v = false
        n.d = Number.MAX_VALUE
        n.p = -2
        n.n = 0
    })
    nodes[index].d = 0
    nodes[index].v = true
    nodes[index].p = -1
    nodes[index].n = 1
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
                n.n = nodes[s].n
                q.push(n_index)
            } else if (n.d === d + 1) {
                n.n += nodes[s].n
            }
        })
    } // step()
}
// DFS: depth-first search with backtracking
export function dfs(nodes, neighbors, index) {
    nodes.forEach(n => {
        n.v = false
        n.d = Infinity
        n.p = -2
        n.type = 'undefined'
    })
    nodes[index].d = 0
    nodes[index].p = -1
    const q = [index]// queue
    while (q.length > 0) {
        const s = q.pop()
        const d = nodes[s].d
        if (nodes[s].v === false) {
            nodes[s].v = true
            neighbors[s].forEach(n_index => {
                const n = nodes[n_index]
                if (!n.v) {
                    n.p = s
                    n.d = d + 1
                    q.push(n_index)
                }
            })
        }
    } // while
    nodes[index].p = -1 // this is the root node
}

export function dijkstra(nodes, neighbors, weights, index) {
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
            n.d = d + weight //e.weight
            pQ.update(n)
        }
      })
    }
} // dijkstra()

// set total force (displacement) on nodes to zero for each iteration
export function initDisplacements(disp) {
    for (let d of disp) {
        d.x = 0
        d.y = 0
        d.d = 0
    }
}
// compute conservative forces for Fruchterman-Reingold model
export function conservativeForcesF(K, Kc, Kg, beta, nodes, edges, bbox, disp) {
    initDisplacements(disp)
    // compute displacements from repelling forces
    const nrNodes = nodes.length
    for (let i = 0; i < nrNodes; i++) {
        for (let j = i + 1; j < nrNodes; j++) {
            repulsiveForceF(K, nodes[i], nodes[j], disp)
            collisionForce(Kc, beta, nodes[i], nodes[j], disp)
        }
        gravitationalForce(Kg, nodes[i], bbox, disp)
    }
    // compute displacements from attracting forces
    for (let e of edges) {
        attractiveForceF(K, nodes[e.source], nodes[e.target], disp)
    }
}
// compute conservative forces for ForceAtlas2 model
export function conservativeForcesA(K, Kc, Kg, beta, nodes, edges, bbox, disp) {
    initDisplacements(disp)
    const nrNodes = nodes.length
    for (let i = 0; i < nrNodes; i++) {
        for (let j = i + 1; j < nrNodes; j++) {
            repulsiveForceA(K, nodes[i], nodes[j], disp)
            collisionForce(Kc, beta, nodes[i], nodes[j], disp)
        }
        gravitationalForce(Kg, nodes[i], bbox, disp)
    }
    // compute displacements from attracting forces
    for (let e of edges) {
        attractiveForceA(K, nodes[e.source], nodes[e.target], disp)
    }
}
// Position Verlet integration modified to include a non-conservative damping
// factor to lose energy and find a steady state
export function positionVerlet(model, K, Kc, Kg, damping, beta, nodes, edges, bbox, disp) {
    // compute conservative forces
    switch (model) {
        case 'Fruchterman-Reingold':
            conservativeForcesF(K, Kc, Kg, beta, nodes, edges, bbox, disp)
            break
        case 'ForceAtlas2':
            conservativeForcesA(K, Kc, Kg, beta, nodes, edges, bbox, disp)
            break
    }
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
// fix positions of nodes after an iteration step
// to keep the network centered in the drawing area
// and to avoid nodes going out of the drawing area
export function fixPositions(nodes, bbox) {
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
// collision force to avoid overlapping nodes
export function collisionForce(k, beta, n1, n2, disp) {
    const d = distance(n1, n2) // vector pointing from node n1 to node n2
    const s = beta * (n1.r + n2.r)
    const r = d.d - s 
    const alpha = 0.05
    if (r < 0) {
        const fr = (d.d > alpha) ? k * Math.abs(r / d.d) : k * Math.abs(r / alpha)
        disp[n1.index].x -= fr * d.x
        disp[n1.index].y -= fr * d.y
        disp[n2.index].x += fr * d.x
        disp[n2.index].y += fr * d.y
    }
}
// gravitational force to keep the network in the center of the drawing area
// and avoid nodes with few neighbors (or disconnected) to go out of the drawing area
export function gravitationalForce(kg, n, bbox, disp) {
    const x = (bbox.xmax+bbox.xmin) / 2 - n.x
    const y = (bbox.ymax+bbox.ymin) / 2 - n.y
    const s = Math.sqrt(x**2 + y**2)
    const r = n.r
    const dx = x / s
    const dy = y / s
    const g = kg / r
    disp[n.index].x += g * dx
    disp[n.index].y += g * dy
}
// Fruchtman-Reingold forces
export function attractiveForceF(K, n1, n2, disp) {
    const d = distance(n1, n2)
    const fa = d.d * d.d / K
    disp[n1.index].x += fa * d.x
    disp[n1.index].y += fa * d.y
    disp[n2.index].x -= fa * d.x
    disp[n2.index].y -= fa * d.y
}
export function repulsiveForceF(K, n1, n2, disp) {
    const d = distance(n1, n2) // vector pointing from nodes[i] to nodes[j], and Euclidean distance
    const fr = K * K / d.d
    disp[n1.index].x -= fr * d.x
    disp[n1.index].y -= fr * d.y
    disp[n2.index].x += fr * d.x
    disp[n2.index].y += fr * d.y
}
// ForceAtlas2 forces
export function attractiveForceA(K, n1, n2, disp) {
    const d = distance(n1, n2) // vector pointing from n1 to n2, and Euclidean distance
    const fa = d.d
    disp[n1.index].x += fa * d.x
    disp[n1.index].y += fa * d.y
    disp[n2.index].x -= fa * d.x
    disp[n2.index].y -= fa * d.y
}
export function repulsiveForceA(K, n1, n2, disp) {
    const d = distance(n1, n2) // vector pointing from nodes[i] to nodes[j], and Euclidean distance
    const fr = K * (n1.degree + 1) * (n2.degree + 1) / d.d
    disp[n1.index].x -= fr * d.x
    disp[n1.index].y -= fr * d.y
    disp[n2.index].x += fr * d.x
    disp[n2.index].y += fr * d.y
}
// add some noise to the position of nodes to avoid them to be stuck in a local minimum
const randJiggle = easyRandom(13)
export function jiggle() { return (randJiggle() - 0.5) * 1e-4 }
export function distance(n1,n2) {
    let dx = n2.x - n1.x
    let dy = n2.y - n1.y
    let d = Math.sqrt(dx * dx + dy * dy)
    if (d === 0) {
        dx = jiggle()
        dy = jiggle()
        d = Math.sqrt(dx * dx + dy * dy)
    }
    return { x: dx / d, y: dy / d, d: d }
}
export function controlFunction(mAlpha, iAlpha, vDump) {
    const minAlpha = mAlpha
    const initialAlpha = iAlpha
    const velDump = vDump
    let iter = 0
    let alpha = iAlpha
    function next() {
        if (iter < Number.MAX_SAFE_INTEGER) iter++
        if (alpha < minAlpha) return minAlpha
        //else return minAlpha * (1 + initialAlpha / ( minAlpha + Math.log( 1 + velDump * iter )))
        else return minAlpha * (1 + initialAlpha /  minAlpha * Math.exp( -velDump * iter ))
    }
    function reset(val) {
        if (arguments.length > 0) {
            const a = -1/velDump * Math.log( minAlpha / initialAlpha * (val/minAlpha - 1))
            if (a < 1) iter = 0
            else iter = Math.floor(a)
        }
        else iter = 0
    }
    return {
        next,
        reset
    }   
}