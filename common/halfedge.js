import { 
    keyGen,
    dot,
    cross,
    normalize,
    normal
} from './utilities.js'

export default function halfedgeFactory(fList, vList) {
    const v_array = []
    const n_array = []
    const f_array = []
    const h_array = []
    const e_array = []

    let hasBoundary = false
    vList.forEach((v, index) => v_array.push({ index: index, he: -1, x: v[0], y: v[1], z: v[2], bnd: false }))
    let e_index = 0
    fList.forEach((f, index) => {
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
        const face = { index: index, he: e_index, v_length: nr_v, bnd: false}
        f_array.push(face)
        e_index += nr_v
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
    m_.forEach((value, index) => {
        const e0 = value.he0
        const e1 = value.he1
        h_array[e0].twin = e1
        if (e1 !== -1) h_array[e1].twin = e0
        const v0 = h_array[e0].origin
        const v1 = h_array[h_array[e0].next].origin
        e_array.push({index: index, h0: e0, h1: e1 })
        h_array[e0].edge = index
        if (e1 !== -1) h_array[e1].edge = index
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
        hasBoundary = true
    }
    m_.clear()

    // Methods
    // input vertex or vertex index
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
    // input vertex of vertex index
    function vertexFaces(v) { // compute incident faces for vertex
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
    // input face or face index
    function faceVertices(f) { // compute incident vertices for faces
        let h0 = -1
        if (typeof f === 'number') h0 = f_array[f].he
        else h0 = f.he
        const v = []
        let s = h0
        do {
            v.push(h_array[s].origin)
            s = h_array[s].next
        } while( s !== h0)
        return v
    }
    function vertexNormal(v) {
        const n = { x: 0, y: 0, z: 0 }
        const { openFan, onering } = oneRing(v)
        if (openFan) {
            for (let i = 1; i < onering.length; i++) {
                const v1 = onering[i - 1]
                const v2 = onering[i]
                const fn = normal(v, v1, v2) 
                n.x += fn.x
                n.y += fn.y
                n.z += fn.z
            }
        } else {
            for (let i = 0; i < onering.length; i++) {
                const v1 = onering[i]
                const v2 = onering[(i + 1) % onering.length]
                const fn = normal(v, v1, v2)
                n.x += fn.x
                n.y += fn.y
                n.z += fn.z
            }
        }
        return normalize(n)
    }
    function computeVertexNormals() {
        n_array.length = 0
        for (let v of v_array) {
            n_array.push(vertexNormal(v))
        }
    }
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
    // iteration
    const vertices = {
        *[Symbol.iterator]() {
            for (let v of v_array) {
                yield v
            }
        }
        
    }
    const normals = {
        *[Symbol.iterator]() {
            for (let n of n_array) {
                yield n
            }
        }
    }
    const faces = {
        *[Symbol.iterator]() {
            for (let f of f_array) {
                yield f
            }
        }
    }
    const halfedges = {
        *[Symbol.iterator]() {
            for (let e of h_array) {
                yield e
            }
        }
    }
    const edges = {
        *[Symbol.iterator]() {
            for (let e of e_array) {
                yield e
            }
        }
    }

    return {
        vertices: vertices,
        normals: normals,
        faces: faces,
        halfedges: halfedges,
        edges: edges,
        boundingBox: boundingBox,
        oneRing: oneRing,
        flip: flip,
        vertexVertices,
        computeVertexNormals: computeVertexNormals,
        faceVertices: faceVertices,
        vertexFaces: vertexFaces,
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