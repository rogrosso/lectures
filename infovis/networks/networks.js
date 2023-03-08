
// BFS compute distance to selected node
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