
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
            const n = nodes[e]
            if (n.v === false) {
                n.v = true
                n.p = s
                n.d = d + 1
                q.push(n.index)
            }
        })
    } // step()
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
                if (!nodes[n].v) {
                    nodes[n].p = s
                    nodes[n].d = d + 1
                    q.push(n)
                }
            })
        }
    } // while
    nodes[index].p = -1 // this is the root node
}