import halfedgeFactory from '../../common/halfedge.js'

// input is a halfedge mesh
export default function dooSabinSubdivision(mesh) {
    // create first an indexed face set
    const ifaces = []
    const ivertices = []
    // helper structure
    const edgeFaces = [] 
    const vertexFaces = [...Array(mesh.v_length)].map(e => [])
    // subdivision: face wise
    for(let f of mesh.faces) {
        const vIds = mesh.faceVertices(f)
        const n = vIds.length
        const fVertices = []
        for(let i of vIds) {
            const {x, y, z} = mesh.v(i)
            fVertices.push([x,y,z])
        }
        // compute face center
        const center = [0, 0, 0]
        for(let v of fVertices) {
            center[0] += v[0]
            center[1] += v[1]
            center[2] += v[2]
        }
        center[0] /= n
        center[1] /= n
        center[2] /= n
        // compute edge vertices
        const eVertices = []
        for (let i = 0; i < n; i++) {
            eVertices.push([
                1 / 2 * (fVertices[i][0] + fVertices[(i+1)%n][0]),
                1 / 2 * (fVertices[i][1] + fVertices[(i+1)%n][1]),
                1 / 2 * (fVertices[i][2] + fVertices[(i+1)%n][2])
            ])
        }
        // compute new vertices
        const id = ivertices.length
        for (let i = 0; i < n; i++) {
            // collect vertices
            const v0 = fVertices[i] 
            const v1 = eVertices[i]
            const v2 = center
            const v3 = eVertices[(i - 1 + n) % n]
            ivertices.push([
                1 / 4 * (v0[0] + v1[0] + v2[0] + v3[0]),
                1 / 4 * (v0[1] + v1[1] + v2[1] + v3[1]),
                1 / 4 * (v0[2] + v1[2] + v2[2] + v3[2])
            ])
        }
        // create face-face
        const iface = []
        for (let i = 0; i < n; i++) iface.push(id + i)
        ifaces.push(iface)

        // create edge-faces
        let he = f.he
        for (let i = 0; i < n; i++) {
            const v0 = iface[i]
            const v1 = iface[(i + 1) % n]
            edgeFaces[he] = [{ v0, v1 }, false]
            he = mesh.h(he).next
        }
        // create vertex-face 
        he = f.he
        for (let i = 0; i < n; i++) {
            vertexFaces[mesh.h(he).origin].push({ v: iface[i], f: f.index })
            he = mesh.h(he).next
        }
    } // loop over the faces
    // compute edge-faces
    const nr_ef = edgeFaces.length
    for (let i = 0; i < nr_ef; i++) {
        if (!mesh.v(mesh.h(i).origin).bnd) {
            if (!edgeFaces[i][1]) {
                const h0 = i
                const h1 = mesh.h(h0).twin
                const v0 = edgeFaces[h0][0].v0
                const v1 = edgeFaces[h1][0].v1
                const v2 = edgeFaces[h1][0].v0
                const v3 = edgeFaces[h0][0].v1
                ifaces.push([v0, v1, v2, v3])
                edgeFaces[h0][1] = true
                edgeFaces[h1][1] = true
            }
        }
    }
    // compute vertex faces
    vertexFaces.forEach((f, index) => {
        const incident = mesh.vertexFaces(index)
        const vface = []
        for (let fId of incident) {
            for (let k of f) {
                if (fId === k.f) {
                    vface.push(k.v)
                }
            }
        } 
        if (vface.length > 0)
            ifaces.push(vface)
    })
    // construct halfedge mesh from indexed face set
    return halfedgeFactory(ifaces, ivertices)    
}