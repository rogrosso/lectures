/**
 * Implements an indexed face set.
 */
export default function indexedFaceSetFactory(v_, f_) {
    const v_array = v_
    const n_array = []
    const f_array = f_
    const e_array = []
    let boundary_ = false
    /**
     * Find boundary vertices
     */
    function findBoundaryVertices() {
        for (let v of v_array) {
            v.bnd = false
        }
        const pairing = (v1, v2) => {
            if (v1 > v2) {
                return ((v1 + v2) * (v1 + v2 + 1)) / 2 + v2 //
            } else {
                return ((v1 + v2) * (v1 + v2 + 1)) / 2 + v1
            }
        }
        let flag = false
        const m_ = new Map()
        f_array.forEach((f) => {
            // edge 0
            let key = pairing(f.v0, f.v1)
            let element = m_.get(key)
            if (element === undefined) {
                m_.set(key, { v0: f.v0, v1: f.v1, bnd: true })
            } else {
                element.bnd = false
            }
            key = pairing(f.v1, f.v2)
            element = m_.get(key)
            if (element === undefined) {
                m_.set(key, { v0: f.v1, v1: f.v2, bnd: true })
            } else {
                element.bnd = false
            }
            key = pairing(f.v2, f.v0)
            element = m_.get(key)
            if (element === undefined) {
                m_.set(key, { v0: f.v2, v1: f.v0, bnd: true })
            } else {
                element.bnd = false
            }
        })
        let e_index = 0
        for (let e of m_.values()) {
            e_array.push({ index: e_index++, v0: e.v0, v1: e.v1, bnd: e.bnd })
            if (e.bnd === true) {
                v_array[e.v0].bnd = true
                v_array[e.v1].bnd = true
                flag = true
            }
        }
        boundary_ = flag
    }
    /**
     * Compute vertex normals
     */
    function computeVertexNormals() {
        if (n_array.length === 0) {
            let i = 0
            for (let v of v_array) {
                n_array.push({ index: i++, x: 0, y: 0, z: 0 })
            }
        } else {
            for (let n of n_array) {
                n.x = 0
                n.y = 0
                n.z = 0
            }
        }
        for (let f of f_array) {
            const e1 = [
                v_array[f.v1].x - v_array[f.v0].x,
                v_array[f.v1].y - v_array[f.v0].y,
                v_array[f.v1].z - v_array[f.v0].z
            ]
            const e2 = [
                v_array[f.v2].x - v_array[f.v0].x,
                v_array[f.v2].y - v_array[f.v0].y,
                v_array[f.v2].z - v_array[f.v0].z
            ]
            const n = [
                e1[1] * e2[2] - e1[2] * e2[1],
                e1[2] * e2[0] - e1[0] * e2[2],
                e1[0] * e2[1] - e1[1] * e2[0]
            ]
            n_array[f.v0].x += n[0]
            n_array[f.v0].y += n[1]
            n_array[f.v0].z += n[2]
            n_array[f.v1].x += n[0]
            n_array[f.v1].y += n[1]
            n_array[f.v1].z += n[2]
            n_array[f.v2].x += n[0]
            n_array[f.v2].y += n[1]
            n_array[f.v2].z += n[2]
        }
        for (let n of n_array) {
            const s = Math.sqrt( n.x ** 2 + n.y ** 2 + n.z ** 2 )
            n.x /= s
            n.y /= s
            n.z /= s
        }
    }
    function hasBoundary() {
        return boundary_
    }
    function faceVertices(f) {
        return [f.v0, f.v1, f.v2]
    }
    /// Iterator for vertices
    const vertices = {
        *[Symbol.iterator]() {
            for (let v of v_array) {
                yield v
            }
        }
        
    }
    /// Iterator for normals
    const normals = {
        *[Symbol.iterator]() {
            for (let n of n_array) {
                yield n
            }
        }
    }
    /// Iterator for faces
    const faces = {
        *[Symbol.iterator]() {
            for (let f of f_array) {
                yield f
            }
        }
    }
    /// Iterator for edges
    const edges = {
        *[Symbol.iterator]() {
            for (let e of e_array) {
                yield e
            }
        }
    }
    return {
        vertices,
        normals,
        faces,
        edges,
        x: function(i) { return v_array[i].x },
        y: function(i) { return v_array[i].y },
        z: function(i) { return v_array[i].z },
        v: function(i) { return v_array[i] },
        n: function(i) { return n_array[i] },
        f: function(i) { return f_array[i] },
        e: function(i) { return e_array[i] },
        get v_length() { return v_array.length },
        get f_length() { return f_array.length },
        get e_length() { return e_array.length },
        faceVertices,
        findBoundaryVertices,
        computeVertexNormals,
        hasBoundary
    }
} // indexedFaceSetFactory()