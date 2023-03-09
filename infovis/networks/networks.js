import { binaryHeapFactory } from '../../common/binaryHeap.js'
import { keyCantor as keyGen } from '../../common/utilities.js'

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