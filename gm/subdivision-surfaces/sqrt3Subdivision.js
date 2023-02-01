//import { keyGen } from "../../common/utilities.js"
import halfedgeFactory from "../../common/halfedge.js"

const OLD_VERTEX = 1
const NEW_VERTEX = 2
const EDGE_EDGE = 1
const FACE_EDGE = 2
const BOND_EDGE = 3
const FLIP_EDGE = 4

function findBndHalfedge(f,m) {
    // assume it is a triangle
    let he = f.he
    if (m.h(he).twin === -1) return he
    he = m.h(he).next
    if (m.h(he).twin === -1) return he
    he = m.h(he).next
    if (m.h(he).twin === -1) return he
    return -1
}

function subdivision(m) {
    // copy mesh
    const faces = []
    const vertices = []
    const vflag = []
    
    // collect vertices
    for (let v of m.vertices) {
        vertices.push([v.x, v.y, v.z])
        vflag.push(OLD_VERTEX)
    }
    // 1-tp-3 split
    for (let f of m.faces) {
        if (f.bnd === true && m.nrSubdivisions%2 !== 0) { //input mesh was an odd nr. of times subdivided
            let he = findBndHalfedge(f, m)
            const i0 = m.h(he).origin
            he = m.h(he).next
            const i1 = m.h(he).origin
            he = m.h(he).next
            const i2 = m.h(he).origin
            const v0 = m.v(i0)
            const v1 = m.v(i1)
            const v2 = m.v(i2)
            const v3 = [
                v0.x + 1/3* (v1.x-v0.x),
                v0.y + 1/3* (v1.y-v0.y),
                v0.z + 1/3* (v1.z-v0.z),
            ]
            const v4 = [
                v0.x + 2/3* (v1.x-v0.x),
                v0.y + 2/3* (v1.y-v0.y),
                v0.z + 2/3* (v1.z-v0.z),
            ]
            const i3 = vertices.length
            const i4 = i3 + 1
            vertices.push(v3, v4)
            vflag.push(NEW_VERTEX, NEW_VERTEX)
            const f0 = [i2,i0,i3]
            const f1 = [i2,i3,i4]
            const f2 = [i2,i4,i1]
            faces.push(f0, f1, f2)
        } else {
            const [i0, i1, i2] = m.faceVertices(f)
            const v0 = m.v(i0)
            const v1 = m.v(i1)
            const v2 = m.v(i2)
            const i3 = vertices.length
            const center = [
                1/3 * [v0.x + v1.x + v2.x],
                1/3 * [v0.y + v1.y + v2.y],
                1/3 * [v0.z + v1.z + v2.z]
            ]
            vertices.push(center)
            vflag.push(NEW_VERTEX)
            // faces
            const f0 = [i0, i1, i3]
            const f1 = [i1, i2, i3]
            const f2 = [i2, i0, i3]
            faces.push(f0, f1, f2)
        }
    }
    const om = halfedgeFactory(faces, vertices)
    om.nrSubdivisions = m.nrSubdivisions + 1
    for (let v of m.vertices) {
        v.type = OLD_VERTEX
    }
    for (let v of om.vertices) {
        v.type = vflag[v.index]
    }
    // edge flip
    for (let e of om.halfedges) {
        if (e.twin === -1) {
            e.type = BOND_EDGE
        }
        else {
            const v0 = e.origin
            const v1 = om.h(e.next).origin
            if (om.v(v0).type === OLD_VERTEX && om.v(v1).type === OLD_VERTEX) {
                e.type = EDGE_EDGE
            } else {
                e.type = FACE_EDGE
            }
        }
    }
    // flip face edges
    for (let e of om.halfedges) {
        if (e.type === EDGE_EDGE) {
            om.flip(e)
            e.type = FLIP_EDGE
            om.h(e.twin).type = FLIP_EDGE
        } 
    }
    return om
}

function smoothOldVertex(v, onering) {
    const p = [0, 0, 0]
    let k = 0
    onering.forEach((nv) => {
        k++
        p[0] += nv.x
        p[1] += nv.y
        p[2] += nv.z
    })
    const beta = (4 - 2 * Math.cos((2 * Math.PI) / k)) / (9 * k)
    v.x = (1 - k * beta) * v.x + beta * p[0]
    v.y = (1 - k * beta) * v.y + beta * p[1]
    v.z = (1 - k * beta) * v.z + beta * p[2]
    return v
}

function smooth(om, im) {
    const iVertices = []
    for (let v of om.vertices) {
        if (v.type === OLD_VERTEX && v.bnd === false) {
            const onering = im.oneRing(v.index)
            const neighbors = []
            for (let i of onering) neighbors.push(im.v(i))
            smoothOldVertex(v, neighbors)
        }
    }
    if (om.nrSubdivisions%2 === 0) {
        for (let v of im.vertices) {
            if (v.bnd) {
                let onering = im.oneRing(v.index)
                const v1 = im.v(onering[0])
                const v2 = im.v(onering[onering.length-1])
                onering = om.oneRing(v.index)
                const v3 = om.v(onering[0])
                const v4 = om.v(onering[onering.length-1])
                const v0 = om.v(v.index)
                
                v0.x = 19/27 * v.x + 4/27 * v1.x + 4/27 * v2.x
                v0.y = 19/27 * v.y + 4/27 * v1.y + 4/27 * v2.y
                v0.z = 19/27 * v.z + 4/27 * v1.z + 4/27 * v2.z
                
                v3.x = 16/27 * v.x + 10/27 * v1.x + 1/27 * v2.x
                v3.y = 16/27 * v.y + 10/27 * v1.y + 1/27 * v2.y
                v3.z = 16/27 * v.z + 10/27 * v1.z + 1/27 * v2.z

                v4.x = 16/27 * v.x + 1/27 * v1.x + 10/27 * v2.x
                v4.y = 16/27 * v.y + 1/27 * v1.y + 10/27 * v2.y
                v4.z = 16/27 * v.z + 1/27 * v1.z + 10/27 * v2.z
            }
        }
    }
    return om
}
export default function sqrt3Subdivision(im) {
    if (im.nrSubdivisions === undefined) {
        im.nrSubdivisions = 0    
    }
    const om = subdivision(im)
    smooth(om, im)
    return om
}