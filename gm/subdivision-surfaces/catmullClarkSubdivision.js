import { keyGen } from "../../common/utilities.js"
import halfedgeFactory from "../../common/halfedge.js"

const FACE_VERTEX = 1
const EDGE_VERTEX = 2
const VERTEX_VERTEX = 3

function quadSubdivision(m) {
    const vertices = []
    const faces = []
    const vflag = []
    
    // collect vertices
    for (let v of m.vertices) {
        vertices.push([v.x, v.y, v.z])
        vflag.push(VERTEX_VERTEX)
    }

    // subdivision: face 1-to-4 split
    const _m = new Map()
    for (let f of m.faces) {
        const vIndices = m.faceVertices(f)
        const vVertices = []
        for (let i of vIndices) {
            vVertices.push(m.v(i))
        }
        const center = [0,0,0]
        for (let v of vVertices) {
            center[0] += v.x
            center[1] += v.y
            center[2] += v.z
        }
        center[0] /= 4
        center[1] /= 4
        center[2] /= 4
        const ice = vertices.length
        vertices.push(center)
        vflag.push(FACE_VERTEX)
        let ve0 = null
        let ve1 = null
        let ve2 = null
        let ve3 = null
        let ie0 = -1
        let ie1 = -1
        let ie2 = -1
        let ie3 = -1
        let key = keyGen(vVertices[0].index, vVertices[1].index)
        if (_m.has(key)) {
            const { v, index } = _m.get(key)
            ve0 = v
            ie0 = index
        } else {
            ve0 = [
                (vVertices[0].x + vVertices[1].x) / 2,
                (vVertices[0].y + vVertices[1].y) / 2,
                (vVertices[0].z + vVertices[1].z) / 2,
            ]
            ie0 = vertices.length
            _m.set(key, { v: ve0, index: ie0 })
            vertices.push(ve0)
            vflag.push(EDGE_VERTEX)
        }
        key = keyGen(vVertices[1].index, vVertices[2].index)
        if (_m.has(key)) {
            const { v, index } = _m.get(key)
            ve1 = v
            ie1 = index
        } else {
            ve1 = [
                (vVertices[1].x + vVertices[2].x) / 2,
                (vVertices[1].y + vVertices[2].y) / 2,
                (vVertices[1].z + vVertices[2].z) / 2,
            ]
            ie1 = vertices.length
            _m.set(key, {v: ve1, index: ie1})
            vertices.push(ve1)
            vflag.push(EDGE_VERTEX)
        }
        key = keyGen(vVertices[2].index, vVertices[3].index)
        if (_m.has(key)) {
            const { v, index } = _m.get(key)
            ve2 = v
            ie2 = index
        } else {
            ve2 = [
                (vVertices[2].x + vVertices[3].x) / 2,
                (vVertices[2].y + vVertices[3].y) / 2,
                (vVertices[2].z + vVertices[3].z) / 2,
            ]
            ie2 = vertices.length
            _m.set(key, {v: ve2, index: ie2})
            vertices.push(ve2)
            vflag.push(EDGE_VERTEX)
        }
        key = keyGen(vVertices[3].index, vVertices[0].index)
        if (_m.has(key)) {
            const { v, index } = _m.get(key)
            ve3 = v
            ie3 = index
        } else {
            ve3 = [
                (vVertices[3].x + vVertices[0].x) / 2,
                (vVertices[3].y + vVertices[0].y) / 2,
                (vVertices[3].z + vVertices[0].z) / 2,
            ]
            ie3 = vertices.length
            _m.set(key, {v: ve3, index: ie3})
            vertices.push(ve3)
            vflag.push(EDGE_VERTEX)
        }
        const f0 = [vVertices[0].index, ie0, ice, ie3]
        const f1 = [vVertices[1].index, ie1, ice, ie0]
        const f2 = [vVertices[2].index, ie2, ice, ie1]
        const f3 = [vVertices[3].index, ie3, ice, ie2]
        faces.push(f0, f1, f2, f3)
    }
    m = halfedgeFactory(faces, vertices)
    // set flags
    for (let v of m.vertices) {
        v.type = vflag[v.index]
    }
    return m
}
function smoothEdgeVertex(v, onering) {
    const p = [0, 0, 0]
    for (let nv of onering) {
        if (nv.type === FACE_VERTEX || nv.type === VERTEX_VERTEX) {
            p[0] += nv.x
            p[1] += nv.y
            p[2] += nv.z
        }
    }
    v.x = p[0] / 4
    v.y = p[1] / 4
    v.z = p[2] / 4
    return v
}
function smoothVertexVertex(v, onering) {
    let F = [0, 0, 0]
    let E = [0, 0, 0]
    let N = 0
    for (let nv of onering) {
        if (nv.type === FACE_VERTEX) {
            N++
            F[0] += nv.x
            F[1] += nv.y
            F[2] += nv.z
        } else if (nv.type === EDGE_VERTEX) {
            E[0] += nv.x
            E[1] += nv.y
            E[2] += nv.z
        }
    }
    F = F.map((e) => e / N)
    E = E.map((e) => e / N)
    v.x = (F[0] + 2 * E[0] + (N - 3) * v.x) / N
    v.y = (F[1] + 2 * E[1] + (N - 3) * v.y) / N
    v.z = (F[2] + 2 * E[2] + (N - 3) * v.z) / N
    return v
}
function smooth(m) {
    // copy position of input vertices
    const iVertices = []
    for (let v of m.vertices) {
        iVertices.push({x: v.x, y: v.y, z: v.z, type: v.type, index: v.index})
    }
    for (let v of m.vertices) {
        const onering = m.vertexVertices(v)
        const neighbors = []
        for (let i of onering) neighbors.push(iVertices[i])
        if (v.bnd === false) {
            if (v.type === EDGE_VERTEX) {
                smoothEdgeVertex(v, neighbors)
            }
            if (v.type === VERTEX_VERTEX) {
                smoothVertexVertex(v,neighbors)
            }
        } // inner vertex
        else {
            // boundary vertex
            if (v.type === VERTEX_VERTEX) {
                const n = neighbors.length
                const v0 = neighbors[0]
                const v1 = neighbors[n-1]
                v.x = (1 / 2) * v.x + (1 / 4) * (v0.x + v1.x)
                v.y = (1 / 2) * v.y + (1 / 4) * (v0.y + v1.y)
                v.z = (1 / 2) * v.z + (1 / 4) * (v0.z + v1.z)
            }
        }
    }
    return m
}


export default function catmullClarkSubdivison(im) {
    const om = quadSubdivision(im)
    smooth(om)
    return om
}