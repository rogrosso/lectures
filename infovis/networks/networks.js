import binaryHeapFactory from '../../common/binaryHeap.js'
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
        e.id = key
    }
    if (m_.size !== edges.length) {
        console.log(`error: undirected edges are not unique`)
    }
    // compute node neighbors
    network.neighbors = new Array(nodes.length).fill(null).map( e => []) 
    const {neighbors} = network
    // at this point, edges are unique
    for (let e of edges) {
        const s = e.source
        const t = e.target
        neighbors[s].push({ index: t, weight: e.weight })
        neighbors[t].push({ index: s, weight: e.weight })
    }
    for (let i = 0; i < neighbors.length; i++) {
        neighbors[i] = Array.from(neighbors[i])
    }
    // compute degree centrality, add id 
    for (let i = 0; i < nodes.length; i++) {
        nodes[i].id = i
        nodes[i].index = nodes[i].id
        nodes[i].c = neighbors[i].length
        if (typeof nodes[i].x === 'string') nodes[i].x = +nodes[i].x
        if (typeof nodes[i].y === 'string') nodes[i].y = +nodes[i].y
        if (!nodes[i].hasOwnProperty('group')) nodes[i].group = 1
        if (!nodes[i].hasOwnProperty('name')) nodes[i].name = 'node ' + nodes[i].id
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
        neighbors[s].forEach((e) => {
            const n = nodes[e.index]
            if (n.v === false) {
                n.v = true
                n.p = s
                n.d = d + 1
                q.push(n.index)
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
            neighbors[s].forEach(n => {
                if (!nodes[n.index].v) {
                    nodes[n.index].p = s
                    nodes[n.index].d = d + 1
                    q.push(n.index)
                }
            })
        }
    } // while
    nodes[index].p = -1 // this is the root node
}

export function dijkstra(nodes, neighbors, index) {
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
      neighbors[s.index].forEach(e => {
        const n = nodes[e.index]
        if (d + e.weight < n.d) {
            // update this element
            n.p = s.index
            n.d = d + e.weight
            pQ.update(n)
        }
      })
    }
} // dijkstra()


export function collisionForce(k, beta, nodes, i, j, disp) {
    const d = distance(nodes[i], nodes[j]) // vector pointing from nodes[i] to nodes[j]
    const s = beta * (nodes[i].r + nodes[j].r)
    const l = d.d - s 
    if (l < 0 && d.d > 0.001) {
        const fr = k * Math.abs(l / (l + s))
        disp[i].x -= fr * d.x
        disp[i].y -= fr * d.y
        disp[j].x += fr * d.x
        disp[j].y += fr * d.y
    } 
}
export function gravitationalForce(kg, n, bbox, disp) {
    const x = (bbox.xmax+bbox.xmin) / 2 - n.x
    const y = (bbox.ymax+bbox.ymin) / 2 - n.y
    const s = Math.sqrt(x**2 + y**2)
    const r = n.r
    const dx = x / s
    const dy = y / s
    const g = kg / r
    disp[n.id].x += g * dx
    disp[n.id].y += g * dy
}
export function attractingForceF(K, nodes, e, disp) {
    const d = distance(nodes[e.source], nodes[e.target])
    const fa = d.d * d.d / K
    disp[e.source].x += fa * d.x
    disp[e.source].y += fa * d.y
    disp[e.target].x -= fa * d.x
    disp[e.target].y -= fa * d.y
}
export function repulsiveForceF(K, nodes, i, j, disp) {
    const d = distance(nodes[i], nodes[j]) // vector pointing from nodes[i] to nodes[j], and Euclidean distance
    const fr = K * K / d.d
    disp[i].x -= fr * d.x
    disp[i].y -= fr * d.y
    disp[j].x += fr * d.x
    disp[j].y += fr * d.y
}
export function attractingForceA(K, nodes, e, disp) {
    const d = distance(nodes[e.source], nodes[e.target]) // vector pointing from n1 to n2, and Euclidean distance
    const fa = d.d
    disp[e.source].x += fa * d.x
    disp[e.source].y += fa * d.y
    disp[e.target].x -= fa * d.x
    disp[e.target].y -= fa * d.y
}
export function repulsiveForceA(K, nodes, i, j, disp) {
    const d = distance(nodes[i], nodes[j]) // vector pointing from nodes[i] to nodes[j], and Euclidean distance
    const fr = K * (nodes[i].degree + 1) * (nodes[j].degree + 1) / d.d
    disp[i].x -= fr * d.x
    disp[i].y -= fr * d.y
    disp[j].x += fr * d.x
    disp[j].y += fr * d.y
}
const randJiggle = easyRandom(13)
export function jiggle() { return (randJiggle() - 0.5) * 1e-4 }
export function distance(n1,n2) {
    let dx = n2.x - n1.x
    let dy = n2.y - n1.y
    let l = Math.sqrt(dx * dx + dy * dy)
    if (l === 0) {
        dx = jiggle()
        dy = jiggle()
        l = Math.sqrt(dx * dx + dy * dy)
    }
    return { x: dx / l, y: dy / l, d: l }
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