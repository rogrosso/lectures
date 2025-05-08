import { 
    keyGen,
    dot,
    cross,
    normalize,
    normal,
    isObject
} from './utilities.js'

export function halfedgeFactory(fList, vList) {
    const v_array = []
    const n_array = []
    const f_array = []
    const h_array = []
    const e_array = []

    let boundary_ = false
    vList.forEach((v, index) => { 
        if (v.x === undefined) {
            v_array.push({ 
                index: index, 
                he: -1, 
                x: v[0], 
                y: v[1], 
                z: v[2], 
                bnd: false 
            })
        } else {
            v_array.push({ 
                index: index, 
                he: -1, 
                x: v.x, 
                y: v.y, 
                z: v.z, 
                bnd: false 
            })
        }
    })
    let e_index = 0
    fList.forEach((f, index) => {
        if (isObject(f)) {
            const nr_v = f.nr_v
            let i = 0
            for (let p in f) {
                if (p[0] === 'v') {
                    const he = { 
                        index: e_index + i, 
                        origin: f[p], 
                        face: f.index, 
                        next: e_index + (i+1)%nr_v, 
                        twin: -1 
                    }
                    v_array[f[p]].he = he.index
                    h_array.push(he)
                    i++
                }
            }
            const face = { 
                index: index, 
                he: e_index, 
                v_length: nr_v, 
                bnd: false 
            }
            f_array.push(face)
            e_index += nr_v
        } else {
            const nr_v = f.length
            for (let i = 0; i < nr_v; i++) {
                const he = { 
                    index: e_index + i, 
                    origin: f[i], 
                    face: index, 
                    next: e_index + (i+1)%nr_v, 
                    twin: -1 
                }
                v_array[f[i]].he = he.index
                h_array.push(he)
            }
            const face = { index: index, he: e_index, v_length: nr_v, bnd: false }
            f_array.push(face)
            e_index += nr_v
        }
    })
    // connectivity
    const m_ = new Map()
    for (let e of h_array) {
        const v0 = e.origin
        const v1 = h_array[e.next].origin
        const key = keyGen(v0, v1)
        const element = m_.get(key)
        if (element === undefined) {
            m_.set(key, { he0: e.index, he1: -1 })
        } else {
            element.he1 = e.index
        }
    }
    let edge_index = 0
    m_.forEach( (value, key) => {
        const e0 = value.he0
        const e1 = value.he1
        h_array[e0].twin = e1
        if (e1 !== -1) h_array[e1].twin = e0
        const v0 = h_array[e0].origin
        const v1 = h_array[h_array[e0].next].origin
        e_array.push({ index: edge_index, h0: e0, h1: e1, v0: v0, v1: v1 })
        h_array[e0].edge = edge_index
        if (e1 !== -1) h_array[e1].edge = edge_index
        edge_index++
    })
    // set he at boundary vertices, mark boundary vertices and faces
    let cnt = 0
    for(let e of h_array) {
        if (e.twin === -1) {
            v_array[e.origin].he = e.index
            v_array[e.origin].bnd = true
            f_array[e.face].bnd = true
            cnt++
        }
    }
    if (cnt > 0) {
        boundary_ = true
    }
    m_.clear()

    /**
     * Computes the one-ring of a vertex, i.e. all vertices of the
     *  incident edges.
     * @param {Object|number} v vertex or vertex index
     * @returns {Array} array containing the indices of the vertices in the one-ring.
     */
    function oneRing(v) { 
        const onering = []
        let h0 = -1
        if (typeof v === 'number') h0 = v_array[v].he
        else h0 = v.he
        let hn = h0
        let s = -1
        do {
            s = h_array[hn].next
            let e = h_array[s].next
            while(e !== hn) {
                s = e
                e = h_array[s].next
            }
            onering.push(h_array[s].origin)
            hn = h_array[s].twin
        } while(hn != h0 && hn !== -1)
        return onering
    }
    /**
     * Computes vertices of the incident faces. These might
     * be different than the one-ring, e.g. quad mesh.  
     * @param {Object|number} v vertex or vertex index
     * @returns {Array}  array containing indices vertices of the incident faces.
     */
    function vertexVertices(v) { 
        const neighbors = []
        let h0 = -1
        if (typeof v === 'number') h0 = v_array[v].he
        else h0 = v.he
        let hn = h0
        let s = -1
        do {
            s = h_array[hn].next
            let e = h_array[s].next
            while(e !== hn) {
                neighbors.push(h_array[s].origin)
                s = e
                e = h_array[s].next
            }
            hn = h_array[s].twin
        } while(hn != h0 && hn !== -1)
        if (hn === -1) {
            neighbors.push(h_array[s].origin)
        }
        return neighbors
    }
    // vertexFaces() : computes incident faces
    /**
     * Computes all incident faces.
     * @param {Object|number} v vertex or vertex index
     * @returns {Array} array containing the indices of the incident faces.
     */
    function vertexFaces(v) { 
        const neigh = []
        let h0 = -1
        if (typeof v === 'number') h0 = v_array[v].he
        else h0 = v_array[v.index].he
        let hn = h0
        do {
            let s = hn
            let e = h_array[s].next
            while(e !== hn) {
                s = e
                e = h_array[s].next
            }
            neigh.push(h_array[s].face)
            hn = h_array[s].twin
        } while (hn != h0 && hn !== -1)
        return neigh
    }
    /**
     * Compute all incident vertices, i.e. the vertices 
     * of a face.
     * @param {Object|number} f face or face index
     * @returns {Array} array containing the indices of the face vertices
     */
    function faceVertices(f) { 
        let h0 = -1
        if (typeof f === 'number') h0 = f_array[f].he
        else h0 = f.he
        const vertices = []
        let s = h0
        do {
            vertices.push(h_array[s].origin)
            s = h_array[s].next
        } while( s !== h0)
        return vertices
    }
    /**
     * Computes the halfedges pointing to the vertex
     * @param {Object|nummber} v vertex or vertex index
     * @returns {Array} array containing the indices of the halfedges
     */
    function inHalfedges(v) { 
        const inhalfedges = []
        let h0 = -1
        if (typeof v === 'number') h0 = v_array[v].he
        else h0 = v.he
        let hn = h0
        let s = -1
        do {
            s = h_array[hn].next
            let e = h_array[s].next
            while(e !== hn) {
                s = e
                e = h_array[s].next
            }
            inhalfedges.push(s) // s = h_array[s].index
            hn = h_array[s].twin
        } while(hn != h0 && hn !== -1)
        return inhalfedges
    }
    /**
     * Computes the halfedges for which the vertex is the origin.
     * @param {Object|number} v vertex or vertex index
     * @returns {Array} array of indices of the halfedges
     */
    function outHalfedges(v) { 
        const outhalfedges = []
        let h0 = -1
        if (typeof v === 'number') h0 = v_array[v].he
        else h0 = v.he
        let hn = h0
        let s = -1
        do {
            outhalfedges.push(hn)
            s = h_array[hn].next
            let e = h_array[s].next
            while(e !== hn) {
                s = e
                e = h_array[s].next
            }
            hn = h_array[s].twin
        } while(hn != h0 && hn !== -1)
        return outhalfedges
    }
    /**
     * Compute the normal at the vertex.
     * @param {Object|number} v vertex or vertex index
     * @returns {Object} normal at vertex
     */
    function vertexNormal(v) {
        if (typeof v === 'number') v = v_array[v]
        const n = { x: 0, y: 0, z: 0 }
        const onering = oneRing(v)
        if (v.bnd) {
            for (let i = 1; i < onering.length; i++) {
                const v1 = v_array[onering[i - 1]]
                const v2 = v_array[onering[i]]
                const fn = normal(v, v1, v2) 
                n.x += fn.x
                n.y += fn.y
                n.z += fn.z
            }
        } else {
            for (let i = 0; i < onering.length; i++) {
                const v1 = v_array[onering[i]]
                const v2 = v_array[onering[(i + 1) % onering.length]]
                const fn = normal(v, v1, v2)
                n.x += fn.x
                n.y += fn.y
                n.z += fn.z
            }
        }
        return normalize(n)
    }
    /**
     * Compute the normals at the vertices in the mesh. Save the normals
     * in the array n_array.
     */
    function computeVertexNormals() {
        n_array.length = 0
        for (let v of v_array) {
            n_array.push(vertexNormal(v))
        }
    }
    /**
     * Computes the normal to the face. If the face is not a triangle, 
     * this function uses the first three vertices for computing the normal.
     * @param {Object|number} f face or face index
     * @returns {Object} normal to the face
     */
    function faceNormal(f) {
        const [i0, i1, i2, ...rest ] = faceVertices(f)
        const fn = normal(v_array[i0], v_array[i1], v_array[i2])
        return normalize(fn)
    }
    /**
     * Flip the edge. This method works only for the case, that the
     * edge is shared by two triangles.
     * @param {Object} h0 halfedge shared by the two triangles.
     */
    function flip(h0) {
        // works only if tris share this edge
        // collect
        const i0 = h0.index
        const h1 = h_array[h0.next]
        const i1 = h1.index
        const h2 = h_array[h1.next]
        const i2 = h2.index
        const h3 = h_array[h0.twin]
        const i3 = h3.index
        const h4 = h_array[h3.next]
        const i4 = h4.index
        const h5 = h_array[h4.next]
        const i5 = h5.index
        //const v0 = h0.origin
        //const v1 = h1.origin
        const v2 = h2.origin
        const v3 = h5.origin
        // connect
        h0.next = i5
        h1.next = i0
        h2.next = i4
        h3.next = i2
        h4.next = i3
        h5.next = i1 
        h0.origin = v2
        h3.origin = v3        
    }
    /**
     * Computes the halfedge collapse for one edge
     * @param {Object} e halfedge to be collapsed
     * @return {boolean} true if success
     */
    function halfedgeCollapse(e) {
        // collect edges
        const he1 = e
        const he2 = h_array[he1.next]
        const he3 = h_array[he2.next]
        const he4 = h_array[he2.twin]
        const he5 = h_array[he3.twin]
        const he6 = h_array[he1.twin]
        const he7 = h_array[he6.next]
        const he8 = h_array[he7.next]
        const he9 = h_array[he7.twin]
        const he10 = h_array[he8.twin]
        // faces
        const f1 = f_array[he1.face]
        const f2 = f_array[he6.face]
        // vertices
        const v1 = v_array[he1.origin]
        const v2 = v_array[he2.origin]
        const v3 = v_array[he3.origin]
        const v4 = v_array[he8.origin]

        // collect edges that have to be recomputed
        const inhalfedges = inHalfedges(v1) // inEdges(vertices[v1], heMesh)
        // collect edges which origin changes
        const outhalfedges = outHalfedges(v1)
        // reconnect
        he4.twin = he5.index
        he5.twin = he4.index
        he9.twin = he10.index
        he10.twin = he9.index
        // set vertex halfedge
        v2.he = he5.index
        v3.he = he4.index
        v4.he = he9.index
        //.mark deleted
        v1.deleted = true
        f1.deleted = true
        f2.deleted = true
        he1.deleted = true
        he2.deleted = true
        he3.deleted = true
        he6.deleted = true
        he7.deleted = true
        he8.deleted = true
        // reconnect outgoing edges
        outhalfedges.forEach( eId => {
            const e = h_array[eId]
            if (!e.deleted) e.origin = v2.index
        })
        // update degree of vertices
        const deg1 = v1.degree
        const deg2 = v2.degree
        const deg3 = v3.degree
        const deg4 = v4.degree
        v2.degree = deg1 + deg2 - 4
        v3.degree = deg3 - 1
        v4.degree = deg4 - 1

        return {
            deletedHalfedges: [he1, he2, he3, he6, he7, he8],
            inhalfedges,
            outhalfedges
        }
    }
    /**
     * Remove unused elements, i.e. a kind of garbage collection
     */
    function clean() {
        const nv = []
        const nh = []
        const nf = []
        const ne = []
        const nn = []
        const vMap = new Array(v_array.length).fill(-1)
        const hMap = new Array(v_array.length).fill(-1)
        const fMap = new Array(v_array.length).fill(-1)
        const eMap = new Array(v_array.length).fill(-1)
        for (let v of v_array) {
            if (!v.deleted) {
                const v_ = {}
                for (let [key, value] of Object.entries(v)) {
                    v_[key] = value
                }
                v_.index = nv.length
                nv.push(v_)
                vMap[v.index] = v_.index
            }
        }
        for (let f of f_array) {
            if (!f.deleted) {
                const f_ = {}
                for (let [key, value] of Object.entries(f)) {
                    f_[key] = value
                }
                f_.index = nf.length
                nf.push(f_)
                fMap[f.index] = f_.index
            }
        }
        for (let h of h_array) {
            if (!h.deleted) {
                const h_ = {}
                for (let [key, value] of Object.entries(h)) {
                    h_[key] = value
                }
                h_.index = nh.length
                nh.push(h_)
                hMap[h.index] = h_.index
            }
        }
        for (let e of e_array) {
            const h0 = h_array[e.h0]
            let h1 = undefined
            if (e.h1 !== -1) h1 = h_array[e.h1]
            if (!h0.deleted || (h1 !== undefined && !h1.deleted)) {
                const e_ = {}
                for (let [key, value] of Object.entries(e)) {
                    e_[key] = value
                }
                e_.index = ne.length
                ne.push(e_)
                eMap[e.index] = e_.index
            }
        }
        // map indices
        for (let v of nv) {
            v.he = hMap[v.he]
        }
        for (let f of nf) {
            f.he = hMap[f.he]
        }
        for (let h of nh) {
            h.origin = vMap[h.origin]
            h.face = fMap[h.face]
            h.next = hMap[h.next]
            if (h.twin !== -1) h.twin = hMap[h.twin]
        }
        for (let e of ne) {
            if (e.h0 === -1) {
                e.h0 = hMap[e.h1]
                e.h1 = -1
            } else if (e.h1 === -1) {
                e.h0 = hMap[e.h0]
            } else {
                e.h0 = hMap[e.h0]
                e.h1 = hMap[e.h1]
            }
            e.v0 = hMap[e.v0]
            e.v1 = hMap[e.v1]
        }
        // copy back
        v_array.length = 0
        f_array.length = 0
        h_array.length = 0
        e_array.length = 0
        for (let v of nv) v_array.push(v)
        for (let f of nf) f_array.push(f)
        for (let h of nh) h_array.push(h)
        for (let e of ne) e_array.push(e)
        computeVertexNormals()
    }
    /**
     * Computes the bounding box of the mesh defined by the minimum and
     * maximum value of the coordinates of all the vertices in the mesh.
     * @returns {Object} Bounding box of the mesh
     */
    function boundingBox() {
        const bbox = {
            xMin :  Number.MAX_VALUE,
            xMax : -Number.MAX_VALUE,
            yMin :  Number.MAX_VALUE,
            yMax : -Number.MAX_VALUE,
            zMin :  Number.MAX_VALUE,
            zMax : -Number.MAX_VALUE
        }
        for (let v of v_array) {
            bbox.xMin = Math.min(bbox.xMin,v.x)
            bbox.xMax = Math.max(bbox.xMax,v.x)
            bbox.yMin = Math.min(bbox.yMin,v.y)
            bbox.yMax = Math.max(bbox.yMax,v.y)
            bbox.zMin = Math.min(bbox.zMin,v.z)
            bbox.zMax = Math.max(bbox.zMax,v.z)
        }
        return bbox
    }
    /**
     * Computes the degree or valence for all vertices in the 
     * mesh. The degree is saved as the degree property for each vertex.
     */
    function vertexDegree() {
        for (let v of v_array) {
            v.degree = 0
        }
        for (let e of e_array) {
            v_array[e.v0].degree++
            v_array[e.v1].degree++
        }
    }
    /**
     * The existence of a boundary is determined by generating the mesh from an 
     * indexed face set data structure. This topological feature should no change.
     * @returns {boolean} true, if mesh has a boundary
     */
    function hasBoundary() {
        return boundary_
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
    /// Iterator for halfedges
    const halfedges = {
        *[Symbol.iterator]() {
            for (let e of h_array) {
                yield e
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
    /// Interface
    return {
        vertices: vertices,
        normals: normals,
        faces: faces,
        halfedges: halfedges,
        edges: edges,
        oneRing: oneRing,
        vertexDegree,
        vertexVertices,
        faceVertices: faceVertices,
        vertexFaces: vertexFaces,
        vertexNormal: vertexNormal,
        inHalfedges: inHalfedges,
        outHalfedges, outHalfedges,
        computeVertexNormals: computeVertexNormals,
        faceNormal: faceNormal,
        flip: flip,
        halfedgeCollapse,
        clean,
        hasBoundary: hasBoundary,
        boundingBox: boundingBox,
        get v_length() { return v_array.length },
        get f_length() { return f_array.length },
        get h_length() { return h_array.length },
        get e_length() { return e_array.length },
        x: function(i) { return v_array[i].x },
        y: function(i) { return v_array[i].y },
        z: function(i) { return v_array[i].z },
        v: function(i) { return v_array[i] },
        f: function(i) { return f_array[i] },
        h: function(i) { return h_array[i] },
        e: function(i) { return e_array[i] }
    }
}