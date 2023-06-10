import * as THREE from "three"
import { OrbitControls } from "OrbitControls"
import GUI from "lil-gui"

import { readOFF, readObj } from "../common/utilities.js"
import { dot, cross, norm, norm2, normalize, normal } from "../../common/utilities.js"
//import { renderBuffers } from "../../common/renderBuffers.js"
import halfedgeFactory from "halfedge"
import binaryHeapFactory  from "binaryHeap"

// main
const bunnyUrl = "../data/bunny_noBnd.off"
const fertilityUrl = "../data/fertility_30000.obj"
drawAll(bunnyUrl, fertilityUrl)
async function drawAll(urlOFF, urlObj) {
    const objResponse = await fetch(urlObj)
    const objFile = await objResponse.text()
    const offResponse = await fetch(urlOFF)
    const offFile = await offResponse.text()
    draw(offFile, objFile)
}

function draw(offFile, objFile) {
    const bIfs = readOFF(offFile)
    const bhe = halfedgeFactory(bIfs.faces, bIfs.vertices)
    const fIfs = readObj(objFile)
    const fhe = halfedgeFactory(fIfs.faces, fIfs.vertices)
    let nrC = [Infinity, 6000, 3000, 1000]
    const bBuffers = decimation(bhe, nrC)
    const fBuffers = decimation(fhe, nrC)
    render([{name: 'fertility', buffers: fBuffers}, {name: 'bunny', buffers: bBuffers}])
}

function decimation(mesh, nrC) {
    function cost(d) {
        return d.value
    }
    const heap = binaryHeapFactory(cost)
    const {
        nr_elements,
        minQ,
        maxQ,
        fQuality,
        quadrics,
        heCosts
    } = init(mesh, heap)
    const thresA = 0.7
    const thresQ = 0.3
    const maxDeg = 17
    const buffers = []
    for (let level = 0; level < nrC.length; level++) {

        const minHeapSize = nrC[level]
        while (heap.size() > minHeapSize) {
            const res = halfedgeCollapse(mesh, heap, thresA, thresQ, maxDeg, quadrics, heCosts)
            if (!res) break
        }
        buffers.push(renderBuffers(mesh))
    }
    // test if deleting elements works
    // mesh.clean()
    //buffers[3] = renderBuffers(mesh)
    return buffers
}

function init(mesh, heap) {
    const { vertices, faces, halfedges } = mesh
    for (let v of vertices) {
        v.deleted = false
    }
    for (let e of halfedges) {
        e.deleted = false
    }
    for (let f of faces) {
        f.deleted = false
    }
    normalizeMesh(mesh)
    const nr_elements = {
        nr_v: mesh.v_length,
        nr_f: mesh.f_length,
        nr_e: mesh.e_length
    }
    // smooth
    const l = 0.8331
    const nrSmooth = 1
    for (let i = 0; i < nrSmooth; i++)
        umbrella(mesh, l)
    // vertex degree
    mesh.vertexDegree()
    // compute min and max Degree
    let minDeg = Infinity
    let maxDeg = 0
    for (let v of vertices) {
        const deg = v.degree
        minDeg = deg < minDeg ? deg : minDeg
        maxDeg = deg > maxDeg ? deg : maxDeg
    }
    // element quality
    let minQ = Infinity
    let maxQ = 0
    const fQuality = []
    for (let f of faces) {
        const [i0, i1, i2] = mesh.faceVertices(f)
        const q = quality(mesh.v(i0), mesh.v(i1), mesh.v(i2))
        fQuality.push(q)
        minQ = q < minQ ? q : minQ
        maxQ = q > maxQ ? q : maxQ
    }
    const quadrics = initQuadricError(mesh)
    const heCosts = []
    for (let e of halfedges) {
        const val = quadricError(e, mesh, quadrics)
        const cost = { element: e, index: e.index, value: val }
        heap.push(cost)
        heCosts.push(cost)
    }
    return {
        nr_elements,
        minDeg,
        maxDeg,
        minQ,
        maxQ,
        fQuality,
        quadrics,
        heCosts
    }
}

function quality(v0, v1, v2) {
    const e1 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z }
    const e2 = { x: v2.x - v1.x, y: v2.y - v1.y, z: v2.z - v1.z }
    const e3 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z }
    const area = norm(cross(e1, e3))
    const l1 = norm2(e1)
    const l2 = norm2(e2)
    const l3 = norm2(e3)
    if (l1 !== 0 && l2 !== 0 && l3 !== 0) {
        return (2 * Math.sqrt(3) * area) / (l1 + l2 + l3)
    } else {
        return 0
    }
}

function normalizeMesh(mesh) {
    const { vertices } = mesh
    let minX = Infinity
    let maxX = -Infinity
    for (let v of vertices) {
        minX = minX < v.x ? minX : v.x
        maxX = maxX > v.x ? maxX : v.x
    }
    let minY = Infinity
    let maxY = -Infinity
    for (let v of vertices) {
        minY = minY < v.y ? minY : v.y
        maxY = maxY > v.y ? maxY : v.y
    }
    let minZ = Infinity
    let maxZ = -Infinity
    for (let v of vertices) {
        minZ = minZ < v.z ? minZ : v.z
        maxZ = maxZ > v.z ? maxZ : v.z
    }
    // translate
    const center = {
        x: (maxX + minZ) / 2,
        y: (maxY + minY) / 2,
        z: (maxZ + minZ) / 2
    }
    for (let v of vertices) {
        v.x -= center.x
        v.y -= center.y
        v.z -= center.z
    }
    // scale
    const s = Math.max(
        Math.abs(maxX - minX),
        Math.abs(maxY - minY),
        Math.abs(maxZ - minZ)
    )
    for (let v of vertices) {
        v.x /= s
        v.y /= s
        v.z /= s
    }
}

function umbrella(mesh) {
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

function taubin(heMesh, w) {
    const { vertices } = heMesh
    const nv = []
    vertices.forEach((v, index) => {
        const p = { index: index, x: 0, y: 0, z: 0 }
        const { onering, openFlag } = oneRing(v, heMesh)
        if (!openFlag) {
            onering.forEach((n) => {
                p.x += n.x - v.x
                p.y += n.y - v.y
                p.z += n.z - v.z
            })
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
    })
    // copy back
    nv.forEach((v, index) => {
        vertices[index].x = vertices[index].x + w * v.x
        vertices[index].y = vertices[index].y + w * v.y
        vertices[index].z = vertices[index].z + w * v.z
    })
}

function initQuadricError(mesh) {
    const { vertices } = mesh
    const quadrics = []
    for (let v of vertices) {
        const faces = mesh.vertexFaces(v)
        const fn_ = []
        for (let f of faces) {
            fn_.push(mesh.faceNormal(f))
        }
        quadrics.push(fn_)
    }
    return quadrics
}
function quadricError(e, mesh, quadrics) {
    const i0 = e.origin
    const i1 = mesh.h(e.next).origin
    const fn_ = quadrics[i0]
    let cost = 0
    const v0 = mesh.v(i0)
    const v1 = mesh.v(i1)
    const p = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z }
    for (let n of fn_) {
        const d = dot(p, n)
        cost += d * d
    }
    return cost
}


function halfedgeCollapse(mesh, heap, thresA, thresQ, maxDeg,  quadrics, heCosts) {
    /*
    let heObject = undefined
    for (let i = 0; i < heap.size(); i++) { 
        const node = heap.node(i)
        if (feasibilityCheck(node.element, mesh, thresA, thresQ, maxDeg)) {
            heObject = heap.remove(node)
            if (heObject === null) return
            else break
        }
    }
    if (heObject === undefined) {
        return false
    }
    */
    const heObject = heap.pop()
    if (!feasibilityCheck(heObject.element, mesh, thresA, thresQ, maxDeg)) return true
    const {
        deletedHalfedges,
        inhalfedges,
        outhalfedges
    } = mesh.halfedgeCollapse(heObject.element)
    
    // update priority queue
    for (let e of deletedHalfedges) {
        heap.remove(heCosts[e.index])
    }
    inhalfedges.forEach( eId => {
        const e = mesh.h(eId)
        if (!e.deleted) {
            const ecCost = quadricError(e, mesh, quadrics)
            const cost = heCosts[e.index]
            cost.value = ecCost
            heap.update(cost)
        }
    })
    outhalfedges.forEach(eId => {
        const e = mesh.h(eId)
        if (!e.deleted) {
            const ecCost = quadricError(e, mesh, quadrics)
            const cost = heCosts[e.index]
            cost.value = ecCost
            heap.update(cost)
        }
    })
    return true
}

function feasibilityCheck(e, mesh, thresA, thresQ, maxDeg) {
    const h1 = e
    const h2 = mesh.h(h1.next)
    const v1 = mesh.v(h1.origin)
    const v2 = mesh.v(h2.origin)
    // check valence
    const deg1 = v1.degree
    if (deg1 < 3) return false
    // check degree of v2
    const deg2 = v2.degree
    const deg2r = deg2 + deg1 - 4
    if (deg2 < 3 || deg2r < 3 || deg2r > maxDeg) return false
    const h3 = mesh.h(h2.next)
    const h6 = mesh.h(h1.twin)
    const h7 = mesh.h(h6.next)
    const h9 = mesh.h(h7.twin)
    // collect vertices
    const v3 = mesh.v(h3.origin)
    const v4 = mesh.v(h9.origin)
    const deg3 = v3.degree
    const deg4 = v4.degree
    if (deg3 < 4 || deg4 < 4) return false
    // check element quality
    const onering = mesh.oneRing(v1)
    const nr_v = onering.length
    for (let i = 0; i < nr_v; i++) {
        const vi = mesh.v(onering[i])
        const vj = mesh.v(onering[(i + 1) % nr_v])
        if (vi.index === v2.index || vj.index === v2.index) continue
        const n1 = normalize(normal(v1, vi, vj)) //faceNormal(vertices[v1], vi, vj)
        const n2 = normalize(normal(v2, vi, vj)) //faceNormal(vertices[v2], vi, vj)
        if (dot(n1, n2) < thresA) { // threshold for cosine of Angle
            return false
        }
        const vk = mesh.v(onering[(i + 2) % nr_v])
        if (vk.index === v2.index) continue
        const n3 = normalize(normal(v2, vi, vj)) //faceNormal(vertices[v2], vi, vj)
        const n4 = normalize(normal(v2, vj, vk)) // faceNormal(vertices[v2], vj, vk)
        if (dot(n3, n4) < thresA) {
            return false
        }
        // check element quality
        const q = quality(v2, vi, vj)
        if (q < thresQ) {
            return false
        }
    }
    return true
}

function renderBuffers(m) {
    const vBuff = []
    const iBuff = []
    
    const iMap = new Array(m.v_length).fill(-1)
    for(let v of m.vertices) {
        if (!v.deleted) {
            iMap[v.index] = vBuff.length / 3
            vBuff.push(v.x, v.y, v.z)
        }
    }
    for(let f of m.faces) {
        if (!f.deleted) {
            const [i0, i1, i2] = m.faceVertices(f)
            iBuff.push(iMap[i0], iMap[i1], iMap[i2])
        }
    }
    
    return {
        vBuff: vBuff,
        iBuff: iBuff,
    }
}

/////////////////////
function render(meshes) {
    const canvas = halfedge_collapse  //threejs_canvas
    let width = 600
    let height = 350
    if (canvas.dataset.width !== undefined) width = canvas.dataset.width
    if (canvas.dataset.height !== undefined) {
        height = Math.floor((canvas.dataset.width * height) / 600)
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f8ff)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.11, 1000)
    const camInitPos = new THREE.Vector3(0, 1, 4)
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
    const aLight = new THREE.AmbientLight(0xa0a0a0)
    scene.add(light1)
    scene.add(light2)
    scene.add(aLight)
    const g = new THREE.Group() // add the geometry here
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
    const ctTarget = new THREE.Vector3(0, 0, 0)
    controls.target.copy(ctTarget)
    controls.target0.copy(ctTarget)
    controls.update()
    // GUI
    const gui = new GUI({autoPlace: false})
    gui.close()
    canvas.append(gui.domElement)
    const folderModel = gui.addFolder('Model')
    const folderRendering = gui.addFolder('Rendering')
    const guiProps = {
        model: {
            fertility: true,
            bunny: false
        },
        rendering: {    
            wireframe: true,
            flatShading: true,
            rotation: true,
            camera: function() { controls.reset() }
        }
    }
    const setModel = (group, guiProps, objKey, v) => {
        if (v) {
            for (const [key,value] of Object.entries(guiProps.model)) guiProps.model[key] = false
        }
        guiProps.model[objKey] = v
        for (let m of group.children) {
            const { children } = m
            const grp = children[0]
            if (m.name === objKey) {
                for (let c of grp.children) {
                    if (c.name === 'mesh') c.material.visible = v
                    if (guiProps.rendering['wireframe']) c.material.visible = v
                }
            } else {
                for (let c of grp.children) c.material.visible = false
            } 
        }
    }
    const setWireframe = (group, guiProps, v) => {
        let objKey = undefined
        for (const [key,value] of Object.entries(guiProps.model))  {
            if (value === true) {
                objKey = key
            }
        }
        for (let m of group.children) {
            const { children } = m
            const grp = children[0]
            if (m.name === objKey) {
                for (let c of grp.children) {
                    if (c.name === 'wireframe') c.material.visible = v
                }
            }
        }
    }
    const setFlatShading = (group, guiProps, v) => {
        let objKey = undefined
        for (const [key,value] of Object.entries(guiProps.model))  {
            if (value === true) {
                objKey = key
            }
        }
        for (let m of group.children) {
            const { children } = m
            const grp = children[0]
            if (m.name === objKey) {
                for (let c of grp.children) {
                    if (c.name === 'mesh') {
                        c.material.needsUpdate = true
                        c.material.flatShading = v
                    }
                }
            }
        }
    }
    const fBox = folderModel.add(guiProps.model, 'fertility')
        .name('fertility')
        .listen()
        .onChange( v => setModel(g, guiProps, 'fertility', v) )
    const bBox = folderModel.add(guiProps.model, 'bunny')
        .name('bunny')
        .listen()
        .onChange( v => setModel(g,guiProps,'bunny', v) )
    const w = folderRendering.add(guiProps.rendering, 'wireframe')
        .listen()
        .onChange( v => setWireframe(g, guiProps, v) )
    const f = folderRendering.add(guiProps.rendering,'flatShading')
        .listen()
        .name('flat shading')
        .listen().onChange( v => setFlatShading(g, guiProps, v) )
        /*{
            g.children.forEach( c => c.children.forEach( (m, index) => {
                if (index%2 === 0) {
                    m.material.needsUpdate = true
                    m.material.flatShading = v
                }
            }))
        })*/
    const r = folderRendering.add(guiProps.rendering, 'rotation').name('rotation').listen().onChange( v => rotationFlag = v)
    const c = folderRendering.add(guiProps.rendering, 'camera').name('reset camera')
    gui.domElement.style.zIndex = "100"

    let model = 'fertility'
    for (let m of meshes) drawGroup(g, m)
    for (let m of g.children) {
        if (m.name === model) {
            m.children[0].children.forEach( (c,index) => {
                c.material.visible = true
            })
        }
    }

    let rotationFlag = true
    // animation
    const q = new THREE.Quaternion()
    function animate(time) {
        requestAnimationFrame( animate );
        if (rotationFlag) {

            q.setFromAxisAngle( new THREE.Vector3(0,1,0), 0.005)
            for (let m of g.children) {
                const { children } = m.children[0]
                children.forEach( c => c.applyQuaternion(q) )
                //m.applyQuaternion(q)
            }
        }
        render()
    }
    function render() {
        renderer.render( scene, camera )
    }
    animate()
}

function drawGroup(parentGroup, {name, buffers}) {
    // remove array from memory after upload on GPU
    function disposeArray() {
        this.array = null
    }
    const g = new THREE.Group()
    g.name = name
    parentGroup.add(g)
    const meshes = [buffers]
    for (let index = 0; index < meshes.length; index++) {
        const m = meshes[index]
        const n = m.length
        let x0 = -1.7
        const dx = 2 * Math.abs(x0) / (n-1)
        const mGroup = new THREE.Group()
        mGroup.name = 'model'
        for (let i = 0; i < n; i++) {
            const { iBuff, vBuff } = m[i]
            // Material
            const mMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x049ef4,
                flatShading: true,
                side: THREE.DoubleSide,
                polygonOffset: true,
                polygonOffsetFactor: 1, // positive value pushes polygon further away
                polygonOffsetUnits: 1
            })
            const wMaterial = new THREE.MeshBasicMaterial({ color: 0x040701, wireframe: true })
            // compute surface mesh
            const mGeometry = new THREE.BufferGeometry()
            mGeometry.setIndex(iBuff)
            mGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vBuff, 3).onUpload(disposeArray))
            mGeometry.computeVertexNormals()
            mGeometry.normalizeNormals()
            const mMesh = new THREE.Mesh( mGeometry, mMaterial )
            // wireframe
            const wMesh = new THREE.Mesh( mGeometry, wMaterial )
            // position objects
            mMesh.translateX(x0)
            wMesh.translateX(x0)
            
            // add 
            mMesh.name = 'mesh'
            wMesh.name = 'wireframe'
            mGroup.add(mMesh)
            mGroup.add(wMesh)
            // set object to invisible
            mMesh.material.visible = false
            mMesh.castShadow = true
            mMesh.receiveShadow = false
            wMesh.material.visible = false
            wMesh.castShadow = false
            wMesh.receiveShadow = false
            // position next subdivision surface
            x0 += dx
        }
        g.add(mGroup)
    } // loop over models
    g.children[0].children.forEach( (c,index) => {
        c.material.visible = false
    })
} // draw()

const cText = `
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
 * Check if an halfedge collapse can be done
 * @param {Object} e halfedge to be collapsed
 * @param {Object} mesh halfedge mesh
 * @param {Number} thresA threshold for dihedral angle
 * @param {Number} thresQ threshold for element quality
 * @param {Number} maxDeg maximum degree allowed
 * @return {boolean} true is halfedge collapse allowed
 */
function feasibilityCheck(e, mesh, thresA, thresQ, maxDeg) {
    const h1 = e
    const h2 = mesh.h(h1.next)
    const v1 = mesh.v(h1.origin)
    const v2 = mesh.v(h2.origin)
    // check valence
    const deg1 = v1.degree
    if (deg1 < 3) return false
    // check degree of v2
    const deg2 = v2.degree
    const deg2r = deg2 + deg1 - 4
    if (deg2 < 3 || deg2r < 3 || deg2r > maxDeg) return false
    const h3 = mesh.h(h2.next)
    const h6 = mesh.h(h1.twin)
    const h7 = mesh.h(h6.next)
    const h9 = mesh.h(h7.twin)
    // collect vertices
    const v3 = mesh.v(h3.origin)
    const v4 = mesh.v(h9.origin)
    const deg3 = v3.degree
    const deg4 = v4.degree
    if (deg3 < 4 || deg4 < 4) return false
    // check element quality
    const onering = mesh.oneRing(v1)
    const nr_v = onering.length
    for (let i = 0; i < nr_v; i++) {
        const vi = mesh.v(onering[i])
        const vj = mesh.v(onering[(i + 1) % nr_v])
        if (vi.index === v2.index || vj.index === v2.index) continue
        const n1 = normalize(normal(v1, vi, vj)) //faceNormal(vertices[v1], vi, vj)
        const n2 = normalize(normal(v2, vi, vj)) //faceNormal(vertices[v2], vi, vj)
        if (dot(n1, n2) < thresA) { // threshold for cosine of Angle
            return false
        }
        const vk = mesh.v(onering[(i + 2) % nr_v])
        if (vk.index === v2.index) continue
        const n3 = normalize(normal(v2, vi, vj)) //faceNormal(vertices[v2], vi, vj)
        const n4 = normalize(normal(v2, vj, vk)) // faceNormal(vertices[v2], vj, vk)
        if (dot(n3, n4) < thresA) {
            return false
        }
        // check element quality
        const q = quality(v2, vi, vj)
        if (q < thresQ) {
            return false
        }
    }
    return true
}
`

const hlDiv = document.getElementById('hl-code')
if (hlDiv) {
    const hlPre = document.createElement('pre')
    hlDiv.append(hlPre)
    const hlCode = document.createElement('code') // hlPre.append('code')
    hlCode.setAttribute('class', 'language-javascript')
    hlCode.setAttribute('style', 'border: 1px solid #C1BAA9')
    hlCode.innerHTML = cText
    hlPre.append(hlCode)
}