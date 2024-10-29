import { halfedgeFactory } from "./halfedge.js"

export function boundingBox(xMin, xMax, yMin, yMax, zMin, zMax) {
    const bbox = []
    bbox.push(xMin, yMin, zMin, xMax, yMin, zMin) // edge 0
    bbox.push(xMax, yMin, zMin, xMax, yMax, zMin) // edge 1
    bbox.push(xMax, yMax, zMin, xMin, yMax, zMin) // edge 2
    bbox.push(xMin, yMax, zMin, xMin, yMin, zMin) // edge 3

    bbox.push(xMin, yMin, zMax, xMax, yMin, zMax) // edge 4
    bbox.push(xMax, yMin, zMax, xMax, yMax, zMax) // edge 5
    bbox.push(xMax, yMax, zMax, xMin, yMax, zMax) // edge 6
    bbox.push(xMin, yMax, zMax, xMin, yMin, zMax) // edge 7

    bbox.push(xMin, yMin, zMin, xMin, yMin, zMax) // edge 8
    bbox.push(xMax, yMin, zMin, xMax, yMin, zMax) // edge 9
    bbox.push(xMax, yMax, zMin, xMax, yMax, zMax) // edge 10
    bbox.push(xMin, yMax, zMin, xMin, yMax, zMax) // edge 11

    return bbox
}

// translate barycenter to origin
function centerMesh(mesh) {
    let x = 0
    let y = 0
    let z = 0
    for (let v of mesh.vertices) {
        x += v.x
        y += v.y
        z += v.z
    }
    x /= mesh.v_length
    y /= mesh.v_length
    z /= mesh.v_length
    for (let v of mesh.vertices) {
        v.x -= x
        v.y -= y
        v.z -= z
    }
    return mesh
}

// uniform scaling by factor s
function uniformScale(mesh, s) {
    for (let v of mesh.vertices) {
        v.x *= s
        v.y *= s
        v.z *= s
    }
    return mesh
}

// normalize mesh: translate barycenter to origin and 
// scale to fit into [-1,1]^3
export function normalizeMesh(m) {
    centerMesh(m)
    const { xMin, xMax, yMin, yMax, zMin, zMax } = m.boundingBox()
    const s = Math.max(
        Math.abs(xMin),
        Math.abs(xMax),
        Math.abs(yMin),
        Math.abs(yMax),
        Math.abs(zMin),
        Math.abs(zMax)
    )
    uniformScale(m,1/s)
    return m
}

/**
 * Compute vertex, normals, faces, wireframe and bounding box buffers
 * for THREE.js rendering
 * @param {Object} m, mesh
 * @param {Boolean} nFlag, normal flag
 * @param {Boolean} wFlag, wireframe flag
 * @param {Boolean} bFlag, bounding box flag
 * @returns {Object} buffers, {vBuff, nBuff, iBuff, wBuff, bBuff
 */
export function renderBuffers(m, nFlag, wFlag, bFlag) {
    const vBuff = []
    const nBuff = []
    const iBuff = []
    let   bBuff = []
    const wBuff = []
    
    for(let v of m.vertices) {
        vBuff.push(v.x, v.y, v.z)
    }
    for(let f of m.faces) {
        const indices = m.faceVertices(f)
        for (let i = 1; i < indices.length-1; i++) {
            iBuff.push(indices[0], indices[i], indices[i + 1])
        }
    }
    if (nFlag) {
        m.computeVertexNormals()
        for(let n of m.normals) {
            nBuff.push(n.x, n.y, n.z)
        }
    }
    if (wFlag) {
        for (let e of m.edges) {
            //const {x: x0, y: y0, z: z0} = m.v(m.h(e.h0).origin)
            //const {x: x1, y: y1, z: z1} = m.v(m.h(m.h(e.h0).next).origin)
            const {x: x0, y: y0, z: z0} = m.v(e.v0)
            const {x: x1, y: y1, z: z1} = m.v(e.v1)
            wBuff.push(x0, y0, z0 )
            wBuff.push(x1, y1, z1 )
        }
    }
    if (bFlag) {
        const { xMin, xMax, yMin, yMax, zMin, zMax } = m.boundingBox()
        bBuff = boundingBox(xMin, xMax, yMin, yMax, zMin, zMax)  
    }
    return {
        vBuff: vBuff,
        nBuff: nBuff,
        iBuff: iBuff,
        wBuff: wBuff,
        bBuff: bBuff
    }
}