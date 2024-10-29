import { keyGen } from "../../common/utilities.js"
import { halfedgeFactory } from "../../common/halfedge.js"

const EVEN_VERTEX = 1
const ODD_VERTEX = 2



function triSubdivision(m) {
    // copy mesh
    const faces = []
    const vertices = []
    const vflag = []
    
    // collect vertices
    for (let v of m.vertices) {
        vertices.push([v.x, v.y, v.z])
        vflag.push(EVEN_VERTEX)
    }

    const _m = new Map()
    for (let f of m.faces) {
        const vIndices = m.faceVertices(f)
        const vVertices = []
        for (let i of vIndices) {
            vVertices.push(m.v(i))
        }
        // compute new vertices
        let ve0 = null
        let ve1 = null
        let ve2 = null
        let ie0 = -1
        let ie1 = -1
        let ie2 = -1
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
            vflag.push(ODD_VERTEX)
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
            vflag.push(ODD_VERTEX)
        }
        key = keyGen(vVertices[2].index, vVertices[0].index)
        if (_m.has(key)) {
            const { v, index } = _m.get(key)
            ve2 = v
            ie2 = index
        } else {
            ve2 = [
                (vVertices[2].x + vVertices[0].x) / 2,
                (vVertices[2].y + vVertices[0].y) / 2,
                (vVertices[2].z + vVertices[0].z) / 2,
            ]
            ie2 = vertices.length
            _m.set(key, {v: ve2, index: ie2})
            vertices.push(ve2)
            vflag.push(ODD_VERTEX)
        }
        const f0 = [vVertices[0].index, ie0, ie2]
        const f1 = [vVertices[1].index, ie1, ie0]
        const f2 = [vVertices[2].index, ie2, ie1]
        const f3 = [ie0, ie1, ie2]
        faces.push(f0, f1, f2, f3)
    }
    const om = halfedgeFactory(faces, vertices)
    // set flags
    for (let v of om.vertices) {
        v.type = vflag[v.index]
    }
    return om
}

function smooth(om, im) {
    const iVertices = []
    for (let v of om.vertices) {
        iVertices.push({x: v.x, y: v.y, z: v.z, type: v.type, index: v.index})
    }
    for (let v of om.vertices) {
        if (v.bnd === false) {
            if (v.type === ODD_VERTEX) {
                const onering = om.oneRing(v)
                const neighbors = []
                for (let i of onering) neighbors.push(iVertices[i])
                smoothOddVertex(v, neighbors)
            }
            if (v.type === EVEN_VERTEX) {
                const onering = im.oneRing(v.index)
                const neighbors = []
                for (let i of onering) neighbors.push(iVertices[i])
                smoothEvenVertex(v,neighbors)
            }
        } else { // boundary vertex
            if (v.type === EVEN_VERTEX) {
                const onering = om.oneRing(v)
                const neighbors = []
                for (let i of onering) neighbors.push(iVertices[i])
                const n = neighbors.length
                v.x = (3 / 4) * v.x + (1 / 8) * (neighbors[0].x + neighbors[n-1].x)
                v.y = (3 / 4) * v.y + (1 / 8) * (neighbors[0].y + neighbors[n-1].y)
                v.z = (3 / 4) * v.z + (1 / 8) * (neighbors[0].z + neighbors[n-1].z)
            }
        }
    }

    return om
}

function smoothOddVertex(v, onering) {
    const p = [0, 0, 0]
    for (let nv of onering) {
        let alpha = nv.type === EVEN_VERTEX ? 2 / 8 : nv.type === ODD_VERTEX ? 1 / 8 : 0
        p[0] += alpha * nv.x
        p[1] += alpha * nv.y
        p[2] += alpha * nv.z
    }
    v.x = p[0]
    v.y = p[1]
    v.z = p[2]
    return v
}
function smoothEvenVertex(v, onering) {
    let N = onering.length
    const p = [0, 0, 0]
    for (let nv of onering) {
        p[0] += nv.x
        p[1] += nv.y
        p[2] += nv.z
    }
    const beta = (1 / N) * (5 / 8 - (3 / 8 + (1 / 4) * Math.cos((2 * Math.PI) / N)) ** 2)
    v.x = (1 - beta * N) * v.x + beta * p[0]
    v.y = (1 - beta * N) * v.y + beta * p[1]
    v.z = (1 - beta * N) * v.z + beta * p[2]
    return v
}

export function loopSubdivision(im) {
    let om = triSubdivision(im)
    smooth(om, im)
    return om
}