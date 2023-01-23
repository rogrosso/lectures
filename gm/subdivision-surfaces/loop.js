import * as THREE from "three"
import { OrbitControls } from "OrbitControls"
import GUI from "GUI"
import trisToroidalTetrahedron from "trisToroidalTetrahedron" assert { type: "json" }
import trisCube24 from "trisCube24" assert { type: "json" }
import trisCube12 from "trisCube12" assert { type: "json" }
import trisTetrahedron from "trisTetrahedron" assert { type: "json" }
import icosahedron_with_bnd from "icosahedron_with_bnd" assert { type: "json" }

const canvas = threejs_canvas
const width = 600
const height = 350
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xf0f8ff)
const camera = new THREE.PerspectiveCamera(45, width / height, 0.11, 1000)
//const camInitPos = new THREE.Vector3(0, 3.2, 8)
const camInitPos = new THREE.Vector3(0, 1.23, 8)
camera.position.copy(camInitPos)
// add a ground plane to improve perspective view
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30, 10, 10),
    new THREE.MeshLambertMaterial({
        color: 0xa0adaf,
        side: THREE.DoubleSide
    })
)
ground.rotation.x = -Math.PI / 2
ground.position.set(0, -2, 0)
ground.castShadow = false
ground.receiveShadow = true
scene.add(ground)
// Light sources
const light1 = new THREE.PointLight(0xffffff, 1, 100, 1.5)
light1.position.set(2, 10, 15)
light1.castShadow = true
light1.shadow.camera.near = 0.5
light1.shadow.camera.far = 500
light1.shadow.mapSize.width = 1024
light1.shadow.mapSize.height = 1024
const light2 = new THREE.DirectionalLight(0x333333, 1, 100, 1.5)
light2.position.copy(camera.position)
const aLight = new THREE.AmbientLight(0xA0A0A0)
scene.add(light1)
scene.add(light2)
scene.add(aLight)
const g = new THREE.Group()
scene.add(g)

// renderer
const renderer = new THREE.WebGLRenderer()
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(width, height)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.domElement.style.border = "solid #a0adaf"
canvas.appendChild(renderer.domElement)
//window.addEventListener( 'resize', onWindowResize )

// controls: camera
const controls = new OrbitControls(camera, renderer.domElement)
controls.minDistance = 0.1
controls.maxDistance = 80
//const ctTarget = new THREE.Vector3(0, 1, 0)
const ctTarget = new THREE.Vector3(0, -0.19, -0.025)
controls.target.copy(ctTarget)
controls.target0.copy(ctTarget)
controls.update()
/*
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize( window.innerWidth, window.innerHeight )
}
*/

// build up gui
let rotationFlag = true
const gui = new GUI({ container: threejs_canvas })
gui.close()
gui.domElement.classList.add("catmullClark-gui")
gui.domElement.style.border = "solid blue"
gui.domElement.style.zIndex = "100"
const folderModel = gui.addFolder("Model")
const folderRendering = gui.addFolder("Rendering")
const guiProps = {
    model: {
        toroidalTetrahedron: true,
        cube1: false,
        cube2: false,
        tetrahedron: false,
        icosahedron: false
    },
    rendering: {
        wireframe: true,
        flatShading: true,
        bbox: true,
        rotation: true,
        camera: function () {
            controls.reset()
        }
    }
}
const setModel = (grp, guiProps, objKey, v) => {
    if (v) {
        for (const [key, value] of Object.entries(guiProps.model))
            guiProps.model[key] = !v
    }
    guiProps.model[objKey] = v
    const flag = []
    for (const [key, value] of Object.entries(guiProps.model)) {
        flag.push(value)
    }
    grp.children.forEach((c, index) => {
        const { children } = c
        if (!flag[index]) {
            children.forEach((m) => (m.material.visible = false))
        } else {
            children.forEach((m, i) => {
                if (i % 3 === 0) m.material.visible = flag[index]
                else if (i % 3 === 1)
                    m.material.visible = guiProps.rendering.wireframe
                else if (i % 3 === 2)
                    m.material.visible = guiProps.rendering.bbox
            })
        }
    })
}
const tBox = folderModel
    .add(guiProps.model, "toroidalTetrahedron")
    .name("toroidal tetrahedron")
    .listen()
    .onChange((v) => setModel(g, guiProps, "toroidalTetrahedron", v))
const cBox1 = folderModel
    .add(guiProps.model, "cube1")
    .name("cube 1")
    .listen()
    .onChange((v) => setModel(g, guiProps, "cube1", v))
const cBox2 = folderModel
    .add(guiProps.model, "cube2")
    .name("cube 2")
    .listen()
    .onChange((v) => setModel(g, guiProps, "cube2", v))
const pBox = folderModel
    .add(guiProps.model, "tetrahedron")
    .name("tetrahedron")
    .listen()
    .onChange((v) => setModel(g, guiProps, "tetrahedron", v))
const iBox = folderModel
    .add(guiProps.model, "icosahedron")
    .name("icosahedron")
    .listen()
    .onChange((v) => setModel(g, guiProps, "icosahedron", v))

const w = folderRendering
    .add(guiProps.rendering, "wireframe")
    .listen()
    .onChange((v) => {
        let mIndex = 0
        if (guiProps.model.toroidalTetrahedron === true) mIndex = 0
        else if (guiProps.model.cube1 === true) mIndex = 1
        else if (guiProps.model.cube2 === true) mIndex = 2
        else if (guiProps.model.tetrahedron === true) mIndex = 3
        else if (guiProps.model.icosahedron === true) mIndex = 4
        g.children[mIndex].children.forEach((c, index) => {
            if (index % 3 === 1) {
                c.material.needsUpdate = true
                c.material.visible = v
            }
        })
    })
const f = folderRendering
    .add(guiProps.rendering, "flatShading")
    .name("flat shading")
    .listen()
    .onChange((v) => {
        g.children.forEach((c) =>
            c.children.forEach((m, index) => {
                if (index % 3 === 0) {
                    m.material.needsUpdate = true
                    m.material.flatShading = v
                }
            })
        )
    })
const b = folderRendering
    .add(guiProps.rendering, "bbox")
    .name("bounding box")
    .listen()
    .onChange((v) => {
        let mIndex = 0
        if (guiProps.model.toroidalTetrahedron === true) mIndex = 0
        else if (guiProps.model.cube1 === true) mIndex = 1
        else if (guiProps.model.cube2 === true) mIndex = 2
        else if (guiProps.model.tetrahedron === true) mIndex = 3
        else if (guiProps.model.icosahedron === true) mIndex = 4
        g.children[mIndex].children.forEach((c, index) => {
            if (index % 3 === 2) {
                c.material.needsUpdate = true
                c.material.visible = v
            }
        })
    })
const r = folderRendering
    .add(guiProps.rendering, "rotation")
    .name("rotation")
    .listen()
    .onChange((v) => (rotationFlag = v))
const c = folderRendering
    .add(guiProps.rendering, "camera")
    .name("reset camera")

draw(g)


// create vertex and index buffers for rendering
// generate a set of pairs of points to render wireframe
function heTessellation(heMesh) {
    const mesh = {}
    const vBuff = []
    const iBuff = []
    const edges = []
    const bBox = []
    heMesh.vertices.forEach((v) => {
        vBuff.push(v.v[0], v.v[1], v.v[2])
    })
    heMesh.faces.forEach((f) => {
        // collect vertices
        const h0 = f.he
        const h1 = heMesh.halfedges[h0].next
        const h2 = heMesh.halfedges[h1].next
        const v1 = heMesh.halfedges[h0].origin
        const v2 = heMesh.halfedges[h1].origin
        const v0 = heMesh.halfedges[h2].origin
        iBuff.push(v0, v1, v2)
    })
    // wireframe
    heMesh.edges.forEach((e) => {
        const v0 = heMesh.vertices[e.v0]
        const v1 = heMesh.vertices[e.v1]
        edges.push(new THREE.Vector3(v0.v[0], v0.v[1], v0.v[2]))
        edges.push(new THREE.Vector3(v1.v[0], v1.v[1], v1.v[2]))
    })

    // bounding box
    const { bbox } = heMesh
    for (let i = 0; i < bbox.length; i += 3) {
        bBox.push(new THREE.Vector3(bbox[i], bbox[i + 1], bbox[i + 2]))
    }

    mesh.vertices = vBuff
    mesh.faces = iBuff
    mesh.edges = edges
    mesh.bbox = bBox
    return mesh
}

// subdivision of quad mesh
function triSubdivision(heMesh) {
    const mesh = {}
    // copy mesh
    const halfedges = []
    const edges = []
    const heFaces = []
    const heVertices = []
    heMesh.vertices.forEach((v) => {
        const nv = {
            index: v.index,
            he: -1,
            v: [v.v[0], v.v[1], v.v[2]],
            type: "even"
        }
        heVertices.push(nv)
    })

    // subdivision: face wise
    /////////////////////////////////////////////////////////////////////////////
    const vmap = new Map()
    heMesh.faces.forEach((f) => {
        // collect
        const h0 = f.he
        const h1 = heMesh.halfedges[h0].next
        const h2 = heMesh.halfedges[h1].next
        const v0 = heMesh.halfedges[h0].origin
        const v1 = heMesh.halfedges[h1].origin
        const v2 = heMesh.halfedges[h2].origin
        const p0 = heVertices[v0].v
        const p1 = heVertices[v1].v
        const p2 = heVertices[v2].v
        // create new vertices
        const p3 = [
            // edge 0
            (1 / 2) * (p1[0] + p2[0]),
            (1 / 2) * (p1[1] + p2[1]),
            (1 / 2) * (p1[2] + p2[2])
        ]
        const p4 = [
            // edge 1
            (1 / 2) * (p2[0] + p0[0]),
            (1 / 2) * (p2[1] + p0[1]),
            (1 / 2) * (p2[2] + p0[2])
        ]
        const p5 = [
            // edge 2
            (1 / 2) * (p0[0] + p1[0]),
            (1 / 2) * (p0[1] + p1[1]),
            (1 / 2) * (p0[2] + p1[2])
        ]

        // add vertices to list, check if vertex was already created by neighbor
        const id = heVertices.length
        // vertex at edge 0, opposite to vertex 0
        let id0 = -1
        let ev0 = null
        let key = cantor(v1, v2)
        let val = vmap.get(key)
        if (val === undefined) {
            // vertex does not exists
            id0 = heVertices.length
            ev0 = { index: id0, v: p3, type: "odd" }
            heVertices.push(ev0)
            vmap.set(key, ev0)
        } else {
            ev0 = val
            id0 = ev0.index
        }
        // vertex at edge 1, opposite to vertex
        let id1 = -1
        let ev1 = null
        key = cantor(v2, v0)
        val = vmap.get(key)
        if (val === undefined) {
            id1 = heVertices.length
            ev1 = { index: id1, v: p4, type: "odd" }
            heVertices.push(ev1)
            vmap.set(key, ev1)
        } else {
            ev1 = val
            id1 = ev1.index
        }
        // vertex at edge 2, opposite to vertex 2
        let id2 = -1
        let ev2 = null
        key = cantor(v0, v1)
        val = vmap.get(key)
        if (val === undefined) {
            id2 = heVertices.length
            ev2 = { index: id2, v: p5, type: "odd" }
            heVertices.push(ev2)
            vmap.set(key, ev2)
        } else {
            ev2 = val
            id2 = ev2.index
        }

        // create faces
        const fid = heFaces.length
        const f0 = { id: fid, he: -1 }
        const f1 = { id: fid + 1, he: -1 }
        const f2 = { id: fid + 2, he: -1 }
        const f3 = { id: fid + 3, he: -1 }
        heFaces.push(f0, f1, f2, f3)
        // create new halfedges
        const eid = halfedges.length
        const h4 = { id: eid, face: f0.id, origin: v0, twin: -1 }
        const h5 = { id: eid + 1, face: f0.id, origin: id2, twin: -1 }
        const h6 = { id: eid + 2, face: f0.id, origin: id1, twin: -1 }
        const h7 = { id: eid + 3, face: f1.id, origin: v1, twin: -1 }
        const h8 = { id: eid + 4, face: f1.id, origin: id0, twin: -1 }
        const h9 = { id: eid + 5, face: f1.id, origin: id2, twin: -1 }
        const h10 = { id: eid + 6, face: f2.id, origin: v2, twin: -1 }
        const h11 = { id: eid + 7, face: f2.id, origin: id1, twin: -1 }
        const h12 = { id: eid + 8, face: f2.id, origin: id0, twin: -1 }
        const h13 = { id: eid + 9, face: f3.id, origin: id0, twin: -1 }
        const h14 = { id: eid + 10, face: f3.id, origin: id1, twin: -1 }
        const h15 = { id: eid + 11, face: f3.id, origin: id2, twin: -1 }
        // edge-edge connectivity in face 0
        h4.next = h5.id
        h5.next = h6.id
        h6.next = h4.id
        // edge-edge connectivity in face 1
        h7.next = h8.id
        h8.next = h9.id
        h9.next = h7.id
        // edge-edge connectivity in face 2
        h10.next = h11.id
        h11.next = h12.id
        h12.next = h10.id
        // edge-edge connectivity in face 3
        h13.next = h14.id
        h14.next = h15.id
        h15.next = h13.id
        // add edges to list
        halfedges.push(h4, h5, h6, h7)
        halfedges.push(h8, h9, h10, h11)
        halfedges.push(h12, h13, h14, h15)
        // set halfedge of faces
        f0.he = h4.id
        f1.he = h7.id
        f2.he = h10.id
        f3.he = h13.id
        // set halfedge of vertex: edge starts at this vertex
        heVertices[v0].he = h4.id
        heVertices[v1].he = h7.id
        heVertices[v2].he = h10.id
        ev0.he = h12.id
        ev1.he = h6.id
        ev2.he = h9.id
    })

    //  boundary
    heVertices.forEach((v) => (v.bnd = false))
    // neighborhood
    const eMap = new Map()
    for (let e of halfedges) {
        const h0 = e.id
        const h1 = halfedges[h0].next
        const v0 = halfedges[h0].origin
        const v1 = halfedges[h1].origin
        const key = cantor(v0, v1)
        let value = eMap.get(key)
        if (value === undefined) eMap.set(key, { he0: e.id, he1: -1 })
        else value.he1 = e.id
    }
    for (const [key, value] of eMap) {
        const e0 = value.he0
        const e1 = value.he1
        if (e1 < 0) {
            halfedges[e0].twin = e1
            const next = halfedges[e0].next
            const origin = halfedges[e0].origin
            edges.push({ v0: origin, v1: halfedges[next].origin })
            heVertices[origin].bnd = true
            heVertices[origin].he = e0
        } else {
            halfedges[e0].twin = e1
            halfedges[e1].twin = e0
            edges.push({ v0: halfedges[e0].origin, v1: halfedges[e1].origin })
        }
    }
    // construct halfedge mesh
    mesh.vertices = heVertices
    mesh.faces = heFaces
    mesh.halfedges = halfedges
    mesh.edges = edges
    mesh.bbox = heMesh.bbox
    return mesh
}

// Triangles: compute one ring, consider boundaries
function oneRing(v, vertices, halfedges) {
    const neigh = []
    const h0 = vertices[v.index].he
    let hn = h0
    let h1 = -1
    let h2 = -1
    do {
        h1 = halfedges[hn].next
        neigh.push(vertices[halfedges[h1].origin])
        h2 = halfedges[h1].next
        hn = halfedges[h2].twin
    } while (hn != h0 && hn !== -1)
    if (hn === -1) {
        neigh.push(vertices[halfedges[h2].origin])
    }
    return neigh
}

///////////////////////////////////////////////////////////////////////////////
// Loop smoothing
///////////////////////////////////////////////////////////////////////////////
function smoothOddVertex(onering) {
    const p = [0, 0, 0]
    onering.forEach((nv) => {
        let alpha = nv.type === "even" ? 2 / 8 : nv.type === "odd" ? 1 / 8 : 0
        p[0] += alpha * nv.v[0]
        p[1] += alpha * nv.v[1]
        p[2] += alpha * nv.v[2]
    })
    return p
}
function smoothEvenVertex(v, onering) {
    let N = 0
    const p = [0, 0, 0]
    onering.forEach((nv) => {
        N++
        p[0] += nv.v[0]
        p[1] += nv.v[1]
        p[2] += nv.v[2]
    })
    const beta =
        (1 / N) *
        (5 / 8 - (3 / 8 + (1 / 4) * Math.cos((2 * Math.PI) / N)) ** 2)
    return [
        (1 - beta * N) * v.v[0] + beta * p[0],
        (1 - beta * N) * v.v[1] + beta * p[1],
        (1 - beta * N) * v.v[2] + beta * p[2]
    ]
}
function loop(oMesh, iMesh) {
    const iVertices = []
    const { vertices, halfedges } = oMesh
    vertices.forEach((v) => {
        const nv = {
            index: v.index,
            he: v.he,
            v: [v.v[0], v.v[1], v.v[2]],
            bnd: v.bnd,
            type: v.type
        }
        iVertices.push(nv)
    })
    // two pass:
    // 1. pass: inner vertices
    vertices.forEach((v, index, vArray) => {
        if (v.bnd === false) {
            if (v.type === "odd") {
                vArray[index].v = smoothOddVertex(
                    oneRing(v, iVertices, halfedges)
                )
            }
            if (v.type === "even") {
                vArray[index].v = smoothEvenVertex(
                    v,
                    oneRing(v, iMesh.vertices, iMesh.halfedges)
                )
            }
        } else {
            // boundary vertex
            if (v.index < iMesh.vertices.length) {
                const neigh = oneRing(v, iMesh.vertices, iMesh.halfedges) // one ring of input mesh
                const v0 = neigh[0]
                const v1 = neigh.at(-1)
                const p = [0, 0, 0]
                p[0] = (3 / 4) * v.v[0] + (1 / 8) * (v0.v[0] + v1.v[0])
                p[1] = (3 / 4) * v.v[1] + (1 / 8) * (v0.v[1] + v1.v[1])
                p[2] = (3 / 4) * v.v[2] + (1 / 8) * (v0.v[2] + v1.v[2])
                vertices[v.index].v = p
            }
        }
    })
    return oMesh
}

// compute the boundring box from max and min coordinates
function boundingBox(xMin, xMax, yMin, yMax, zMin, zMax) {
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

// computes a halfedge data structure out of
// an indexed face set
function heMeshFromTrisIndexedFaceSet(tMesh) {
    const heMesh = {}
    const halfedges = []
    const edges = []
    const heFaces = []
    const heVertices = []
    // create vertices
    let xMin = 0
    let xMax = 0
    let yMin = 0
    let yMax = 0
    let zMin = 0
    let zMax = 0
    tMesh.vertices.forEach((v, index) => {
        xMin = Math.min(xMin, v[0])
        xMax = Math.max(xMax, v[0])
        yMin = Math.min(yMin, v[1])
        yMax = Math.max(yMax, v[1])
        zMin = Math.min(zMin, v[2])
        zMax = Math.max(zMax, v[2])
        heVertices.push({ index: index, he: -1, v: v })
    })

    // hash map to halfedge connectivity
    const map = new Map()
    // triangle: edge opposite to vertex
    // obj starts at index 1
    tMesh.faces.forEach((f, index) => {
        const v0 = f[0]
        const v1 = f[1]
        const v2 = f[2]
        const he0 = { id: 3 * index, face: index, origin: v1, twin: -1 }
        const he1 = { id: 3 * index + 1, face: index, origin: v2, twin: -1 }
        const he2 = { id: 3 * index + 2, face: index, origin: v0, twin: -1 }
        const hf = { id: index, he: 3 * index }

        // connect
        heVertices[v0].he = he2.id
        heVertices[v1].he = he0.id
        heVertices[v2].he = he1.id
        he0.next = he1.id
        he1.next = he2.id
        he2.next = he0.id

        // collect
        heFaces.push(hf)
        halfedges.push(he0, he1, he2)
    })
    // boundary vertices
    heVertices.forEach((v) => (v.bnd = false))
    // neighborhood
    const eMap = new Map()
    for (let e of halfedges) {
        const v0 = e.origin
        const v1 = halfedges[e.next].origin
        const key = cantor(v0, v1)
        let value = eMap.get(key)
        if (value === undefined) eMap.set(key, { he0: e.id, he1: -1 })
        else value.he1 = e.id
    }
    for (const [key, value] of eMap) {
        const e0 = value.he0
        const e1 = value.he1
        if (e1 < 0) {
            halfedges[e0].twin = e1
            const next = halfedges[e0].next
            const origin = halfedges[e0].origin
            edges.push({ v0: origin, v1: halfedges[next].origin })
            // mark vertices as boundary vertices
            heVertices[origin].bnd = true
            // set start edge for iteration
            heVertices[origin].he = e0
        } else {
            halfedges[e0].twin = e1
            halfedges[e1].twin = e0
            edges.push({ v0: halfedges[e0].origin, v1: halfedges[e1].origin })
        }
    }

    heMesh.vertices = heVertices
    heMesh.faces = heFaces
    heMesh.halfedges = halfedges
    heMesh.edges = edges
    heMesh.bbox = boundingBox(xMin, xMax, yMin, yMax, zMin, zMax)
    return heMesh
}

// compute center of mesh
function computeCenter(mesh) {
    const c = [0, 0, 0]
    const n = mesh.vertices.length
    mesh.vertices.forEach((v) => {
        c[0] += v.v[0]
        c[1] += v.v[1]
        c[2] += v.v[2]
    })
    c[0] /= n
    c[1] /= n
    c[2] /= n
    return c
}

// construct a unique key out of two integers using Cantor's map
function cantor(k1, k2) {
    if (k1 > k2) {
        return ((k1 + k2) * (k1 + k2 + 1)) / 2 + k2
    } else {
        return ((k1 + k2) * (k1 + k2 + 1)) / 2 + k1
    }
}

// translate center of mesh to origin
function translate(mesh) {
    let x = 0
    let y = 0
    let z = 0
    mesh.vertices.forEach((v) => {
        x += v.v[0]
        y += v.v[1]
        z += v.v[2]
    })
    x /= mesh.vertices.length
    y /= mesh.vertices.length
    z /= mesh.vertices.length
    mesh.vertices.forEach((v) => {
        v.v[0] -= x
        v.v[1] -= y
        v.v[2] -= z
    })
    // compute bounding box
    for (let i = 0; i < mesh.bbox.length; i += 3) {
        mesh.bbox[i] -= x
        mesh.bbox[i + 1] -= y
        mesh.bbox[i + 2] -= z
    }
    return mesh
}
// uniform scaling by factor s
function scale(mesh, s) {
    mesh.vertices.forEach((v) => {
        v.v[0] *= s
        v.v[1] *= s
        v.v[2] *= s
    })
    mesh.bbox.forEach((v, index, arr) => {
        arr[index] *= s
    })
    return mesh
}

function invertFaces(iMesh) {
    const { faces } = iMesh
    faces.forEach((f, index, farr) => {
        const t = farr[index][0]
        farr[index][0] = farr[index][1]
        farr[index][1] = t
    })
}

///////////////////////////////////////////////////////////////////////////////
// Main loop:
//  - read models from json-files
//  - computes subdivisons
//  - computes THREE meshes for rendering
function draw(g) {
    // remove array from memory after upload on GPU
    function disposeArray() {
        this.array = null
    }
    const meshes = [
        trisToroidalTetrahedron,
        trisCube24,
        trisCube12,
        trisTetrahedron,
        icosahedron_with_bnd
    ]

    const scaleFactors = [0.9, 0.87, 1.75, 0.87, 1.22]
    const rotationAngles = [
        -Math.PI / 2,
        -Math.PI / 2,
        -Math.PI / 2,
        -Math.PI / 2,
        0
    ]
    
    const defaultColor = new THREE.Color(0x049ef4)
    meshes.forEach((iMesh, index) => {
        //if (index === 3) invertFaces(iMesh)
        let m = heMeshFromTrisIndexedFaceSet(iMesh)
        m = translate(m)
        m = scale(m, scaleFactors[index])
        const n = 4
        let x0 = -4
        const dx = (2 * Math.abs(x0)) / (n - 1)
        const mGroup = new THREE.Group()
        for (let i = 0; i < n; i++) {
            const sm = heTessellation(m)
            const geometry = new THREE.BufferGeometry()
            geometry.setIndex(sm.faces)
            geometry.setAttribute(
                "position",
                new THREE.Float32BufferAttribute(sm.vertices, 3).onUpload(
                    disposeArray
                )
            )
            geometry.computeVertexNormals()
            geometry.normalizeNormals()
            //geometry.computeBoundingBox()
            const sMesh = new THREE.Mesh(
                geometry,
                new THREE.MeshPhysicalMaterial({ 
                    color: defaultColor, 
                    side: THREE.DoubleSide,
                    flatShading: true,
                    emissive: defaultColor.clone().multiplyScalar(0.2),
                    reflectivity: 1,
                    refractionRatio: 1,
                    roughness: 1,
                    metalness: 0.1,
                    clearcoat: 0.1,
                    clearcoatRoughness: 0.2,
                    thickness: 1,
                    polygonOffset: true,
                    polygonOffsetFactor: 1, // positive value pushes polygon further away
                    polygonOffsetUnits: 1
                })
            )
            sMesh.rotation.x = rotationAngles[index] // -Math.PI / 2
            // wireframe
            const wGeometry = new THREE.BufferGeometry().setFromPoints(
                sm.edges
            )
            const wireframe = new THREE.LineSegments(
                wGeometry,
                new THREE.LineBasicMaterial({ color: 0x040701, linewidth: 1 })
            )
            wireframe.rotation.x = rotationAngles[index] // -Math.PI / 2
            // bounding box of input mesh
            const bGeometry = new THREE.BufferGeometry().setFromPoints(sm.bbox)
            const bbox = new THREE.LineSegments(
                bGeometry,
                new THREE.LineBasicMaterial({ color: 0xb008b, linewidth: 1 })
            )
            bbox.rotation.x = rotationAngles[index] // -Math.PI / 2
            // position objects
            sMesh.translateX(x0)
            wireframe.translateX(x0)
            bbox.translateX(x0)

            // collect subdivisions into model group
            mGroup.add(sMesh)
            mGroup.add(wireframe)
            mGroup.add(bbox)

            // set object to invisible
            sMesh.material.visible = false
            wireframe.material.visible = false
            bbox.material.visible = false
            wireframe.castShadow = false
            wireframe.receiveShadow = false
            bbox.castShadow = false
            bbox.receiveShadow = false

            // compute subdivision
            if (i < n - 1) {
                m = loop(triSubdivision(m), m)
            }
            //const sdMesh = triSubdivision(m)
            //loop(sdMesh,m)
            //m = sdMesh

            x0 += dx
        }
        // collect all models groups
        g.add(mGroup)
    })
    g.children[0].children.forEach((e, index) => {
        e.material.visible = true
        if (index % 3 === 0) {
            e.castShadow = true
            e.receiveShadow = false
        }
    })

    // animation loop
    const q = new THREE.Quaternion()
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.005)
    animate()
    function animate() {
        requestAnimationFrame(animate)
        if (rotationFlag) {
            g.children.forEach((c) =>
                c.children.forEach((e) => {
                    e.applyQuaternion(q)
                })
            )
        }
        light2.position.copy(camera.position)
        render()
    }

    function render() {
        renderer.render(scene, camera)
    }
} // draw()

const cText = `
function smoothOddVertex(onering) {
    const p = [0, 0, 0]
    onering.forEach((nv) => {
        let alpha = nv.type === "even" ? 2 / 8 : nv.type === "odd" ? 1 / 8 : 0
        p[0] += alpha * nv.v[0]
        p[1] += alpha * nv.v[1]
        p[2] += alpha * nv.v[2]
    })
    return p
}
function smoothEvenVertex(v, onering) {
    let N = 0
    const p = [0, 0, 0]
    onering.forEach((nv) => {
        N++
        p[0] += nv.v[0]
        p[1] += nv.v[1]
        p[2] += nv.v[2]
    })
    const beta =
        (1 / N) *
        (5 / 8 - (3 / 8 + (1 / 4) * Math.cos((2 * Math.PI) / N)) ** 2)
    return [
        (1 - beta * N) * v.v[0] + beta * p[0],
        (1 - beta * N) * v.v[1] + beta * p[1],
        (1 - beta * N) * v.v[2] + beta * p[2]
    ]
}
`
const hlDiv = document.getElementById('hl-code')
const hlPre = document.createElement('pre')
hlDiv.append(hlPre)
const hlCode = document.createElement('code') // hlPre.append('code')
hlCode.setAttribute('class', 'language-javascript')
hlCode.setAttribute('style', 'border: 1px solid #C1BAA9')
hlCode.innerHTML = cText
hlPre.append(hlCode)