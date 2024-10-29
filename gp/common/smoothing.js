/**
 * Umbrella smoothing
 * @param {Object} heMesh, half-edge mesh 
 */
export function umbrella(mesh) {
    const { vertices } = mesh
    const nv = []
    //vertices.forEach((v, index) => {
    for (let v of vertices) {
        if (!v.bnd) {
            const index = v.index
            const p = { index: index, x: 0, y: 0, z: 0 }
            const onering = mesh.oneRing(v)
            for (let i of onering) {
                const n = mesh.v(i)
                p.x += n.x - v.x
                p.y += n.y - v.y
                p.z += n.z - v.z
            }
            const nr_v = onering.length
            p.x /= nr_v
            p.y /= nr_v
            p.z /= nr_v
            nv.push(p)
        }
    }
    // copy back
    const t = 0.9
    for (let v of nv) {
        const vertex = mesh.v(v.index)
        vertex.x = vertex.x + t * v.x
        vertex.y = vertex.y + t * v.y
        vertex.z = vertex.z + t * v.z
    }
}
/**
 * Taubin smoothing
 * @param {Object} heMesh, half-edge mesh 
 * @param {Number} w, weight
 */
export function taubin(heMesh, w) {
    const { vertices, oneRing } = heMesh
    const nv = []
    //vertices.forEach((v, index) => {
    for (let v of vertices) {
        const p = { index: v.index, x: 0, y: 0, z: 0 }
        const onering = oneRing(v)
        const openFlag = v.bnd
        if (!openFlag) {
            for (let i of onering) { //.forEach((n) => {
                const n = heMesh.v(i)
                p.x += n.x - v.x
                p.y += n.y - v.y
                p.z += n.z - v.z
            }
            const nr_v = onering.length
            p.x /= nr_v
            p.y /= nr_v
            p.z /= nr_v
        } else {
            p.x = v.x
            p.y = v.y
            p.z = v.z
        }
        nv.push(p)
    }
    // copy back
    //nv.forEach((v, index) => {
    for (let v of nv) {
        const vertex = heMesh.v(v.index)
        vertices.x += w * v.x
        vertices.y += w * v.y
        vertices.z += w * v.z
    }
}