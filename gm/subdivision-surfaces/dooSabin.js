import * as THREE from '../../contrib/three.module.min.js'
import { OrbitControls } from '../../contrib/OrbitControls.js'
import GUI from '../../contrib/lil-gui.module.min.js'

//import hybridCube from 'hybridCube' assert{ type: 'json' }
//import quadCube from 'quadCube' assert{ type: 'json' }
//import quadPawn from 'quadPawn' assert{ type: 'json' }
//import quadToroidalTetra from 'quadToroidalTetra' assert{ type: 'json' }

import { halfedgeFactory } from '../../common/halfedge.js'
import { renderBuffers, normalizeMesh, boundingBox } from '../../common/renderBuffers.js'
import { dooSabinSubdivision } from './dooSabinSubdivision.js'

const url1 = "../data/hybridCube.json"
const url2 = "../data/quadCube.json"
const url3 = "../data/quadPawn.json"
const url4 = "../data/quadToroidalTetra.json"

drawAll(url1, url2, url3, url4)

async function drawAll(url1, url2, url3, url4) {
    const response1 = await fetch(url1)
    const hybridCube = await response1.json()
    const response2 = await fetch(url2)
    const quadCube = await response2.json()
    const response3 = await fetch(url3)
    const quadPawn = await response3.json()
    const response4 = await fetch(url4)
    const quadToroidalTetra = await response4.json()

    const canvas = threejs_canvas
    const width = 600
    const height = 350
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xF0F8FF)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.11, 1000)
    const camInitPos = new THREE.Vector3(0, 1.23, 8.3)
    camera.position.copy(camInitPos)
    // add a ground plane to improve perspective view
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30, 10, 10),
        new THREE.MeshLambertMaterial({
            color: 0xa0adaf,
            side: THREE.DoubleSide
        }))
    ground.rotation.x = - Math.PI / 2
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
    const g = new THREE.Group() // add the geometry here
    scene.add(g)
    // renderer
    const renderer = new THREE.WebGLRenderer()
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    canvas.appendChild(renderer.domElement)
    renderer.domElement.style.border = 'solid #a0adaf'

    // controls: camera
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.minDistance = 0.1
    controls.maxDistance = 100
    const ctTarget = new THREE.Vector3(0, -0.19, -0.025)
    controls.target.copy(ctTarget)
    controls.update()
    controls.target0.copy(ctTarget)

    // build up gui
    let rotationFlag = true
    const gui = new GUI({container: threejs_canvas})
    gui.close()
    gui.domElement.classList.add('dooSabin-gui')
    gui.domElement.style.border = 'solid blue'
    gui.domElement.style.zIndex = '100'
    const folderModel = gui.addFolder('Model')
    const folderRendering = gui.addFolder('Rendering')
    const guiProps = {
        model: {
            toroidalTetrahedron: true,
            cube1: false,
            cube2: false,
            pawn: false
        },
        rendering: {
            wireframe: true,
            flatShading: true,
            bbox: true,
            rotation: true,
            camera: function() { controls.reset() }
        }
    }
    const setModel = (grp, guiProps, objKey, v) => {
        if (v) {
            for (const [key, value] of Object.entries(guiProps.model)) guiProps.model[key] = !v
        }
        guiProps.model[objKey] = v
        const flag = []
        for (const [key, value] of Object.entries(guiProps.model)) {
            flag.push(value)
        }
        grp.children.forEach((c, index) => {
            const { children } = c
            if (!flag[index]) {
                children.forEach(m => m.material.visible = false)
            }
            else {
                children.forEach((m, i) => {
                    if (i % 3 === 0) m.material.visible = flag[index]
                    else if (i % 3 === 1) m.material.visible = guiProps.rendering.wireframe
                    else if (i % 3 === 2) m.material.visible = guiProps.rendering.bbox
                })
            }
        })
    }
    const tBox = folderModel.add(guiProps.model, 'toroidalTetrahedron')
        .name('toroidal tetrahedron')
        .listen()
        .onChange(v => setModel(g, guiProps, 'toroidalTetrahedron', v))
    const c1Box = folderModel.add(guiProps.model, 'cube1')
        .name('cube 1')
        .listen()
        .onChange(v => setModel(g, guiProps, 'cube1', v))
    const c2Box = folderModel.add(guiProps.model, 'cube2')
        .name('cube 2')
        .listen()
        .onChange(v => setModel(g, guiProps, 'cube2', v))
    const pBox = folderModel.add(guiProps.model, 'pawn')
        .name('pawn')
        .listen()
        .onChange(v => setModel(g, guiProps, 'pawn', v))
    const w = folderRendering.add(guiProps.rendering, 'wireframe').listen().onChange(v => {
        let mIndex = 0
        if (guiProps.model.toroidalTetrahedron === true) mIndex = 0
        else if (guiProps.model.cube1 === true) mIndex = 1
        else if (guiProps.model.cube2 === true) mIndex = 2
        else if (guiProps.model.pawn === true) mIndex = 3
        g.children[mIndex].children.forEach((c, index) => {
            if (index % 3 === 1) {
                c.material.visible = v
            }
        })
    })
    const f = folderRendering.add(guiProps.rendering, 'flatShading').listen().name('flat shading').listen().onChange(v => {
        g.children.forEach(c => c.children.forEach((m, index) => {
            if (index % 3 === 0) {
                m.material.needsUpdate = true
                m.material.flatShading = v
            }
        }))
    })
    const b = folderRendering.add(guiProps.rendering, 'bbox').name('bounding box').listen().onChange(v => {
        let mIndex = 0
        if (guiProps.model.toroidalTetrahedron === true) mIndex = 0
        else if (guiProps.model.cube1 === true) mIndex = 1
        else if (guiProps.model.cube2 === true) mIndex = 2
        else if (guiProps.model.pawn === true) mIndex = 3
        g.children[mIndex].children.forEach((c, index) => {
            if (index % 3 === 2) {
                c.material.needsUpdate = true
                c.material.visible = v
            }
        })
    })
    const r = folderRendering.add(guiProps.rendering, 'rotation')
        .name('rotation')
        .listen()
        .onChange(v => rotationFlag = v)
    const c = folderRendering.add(guiProps.rendering, 'camera')
        .name('reset camera')

    // draw meshes
    draw(g)

    ///////////////////////////////////////////////////////////////////////////////
    // Main loop:
    //  - read models from json-files
    //  - computes subdivisons
    //  - computes THREE meshes for rendering
    function draw(g) {
        // remove data after upload to gpu
        function disposeArray() {
            this.array = null
        }
        const meshes = [
            quadToroidalTetra,
            hybridCube,
            quadCube,
            quadPawn
        ]
        const scaleFactors = [1, 1.6, 1.6, 5]
        const defaultColor = new THREE.Color(0x049ef4)
        // process input data
        meshes.forEach((iMesh, index) => {
            const {faces, vertices} = iMesh
            let m = halfedgeFactory(faces, vertices)
            normalizeMesh(m)
            const n = 4
            let x0 = -4.1
            const dx = 2 * Math.abs(x0) / (n - 1)
            const mGroup = new THREE.Group()
            let bBuff = null
            for (let i = 0; i < n; i++) {
                // compute render buffers
                const {vBuff, iBuff, wBuff } = renderBuffers(m, false, true, false)
                if (i === 0) {
                    const { xMin, xMax, yMin, yMax, zMin, zMax } = m.boundingBox()
                    const buff = boundingBox(xMin, xMax, yMin, yMax, zMin, zMax)
                    bBuff = []
                    for (let j = 0; j < buff.length; j += 3) {
                        bBuff.push(new THREE.Vector3(buff[j], buff[j+1], buff[j+2]))
                    }
                }
                const wireF = []
                for (let j = 0; j < wBuff.length; j += 3) {
                    wireF.push(new THREE.Vector3(wBuff[j], wBuff[j+1], wBuff[j+2]))
                }
                // compute surface mesh
                const geometry = new THREE.BufferGeometry()
                geometry.setIndex(iBuff)
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(vBuff, 3).onUpload(disposeArray))
                geometry.computeVertexNormals()
                geometry.normalizeNormals()
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
                sMesh.rotation.x = -Math.PI / 2
                // wireframe
                const wGeometry = new THREE.BufferGeometry().setFromPoints(wireF)
                const wireframe = new THREE.LineSegments(
                    wGeometry, 
                    new THREE.LineBasicMaterial({ color: 0x040701, linewidth: 1 })
                    )
                wireframe.rotation.x = -Math.PI / 2
                // bounding box
                const bGeometry = new THREE.BufferGeometry().setFromPoints(bBuff)
                const bbox = new THREE.LineSegments(
                    bGeometry, 
                    new THREE.LineBasicMaterial({ color: 0xb008b, linewidth: 1 })
                    )
                bbox.rotation.x = -Math.PI / 2

                // position objects
                sMesh.translateX(x0)
                wireframe.translateX(x0)
                bbox.translateX(x0)

                // add 
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
                m = dooSabinSubdivision(m)

                // position next subdivision level
                x0 += dx
            }
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
        animate()
        function animate() {
            requestAnimationFrame(animate)
            if (rotationFlag) {
                const q = new THREE.Quaternion()
                q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.005)
                g.children.forEach(c => c.children.forEach(e => e.applyQuaternion(q)))
            }
            light1.position.copy(camera.position)
            render()
        }

        function render() {
            renderer.render(scene, camera)
        }
    } // draw()
} // drawAll()
const cText = `
// subdivision of quad mesh using halfedge data structure
function dooSabinSubdivision(heMesh) {
    const { vertices, halfedges, faces } = heMesh
    // create first an indexed face set
    const ifaces = []
    const ivertices = []
    // helper structure
    const edgeFaces = [...Array(halfedges.length)].map(e => [])
    const vertexFaces = [...Array(vertices.length)].map(e => [])
    // subdivision: face wise
    faces.forEach(f => {
        const n = f.size
        let he = f.he
        const fVertices = []
        for (let i = 0; i < n; i++) {
            fVertices.push(vertices[halfedges[he].origin].v)
            he = halfedges[he].next
        }
        // compute face center
        const center = [0, 0, 0]
        fVertices.forEach(v => {
            center[0] += v[0]
            center[1] += v[1]
            center[2] += v[2]
        })
        center[0] /= n
        center[1] /= n
        center[2] /= n
        // compute edge vertices
        const eVertices = []
        he = f.he
        for (let i = 0; i < n; i++) {
            const v0 = fVertices[i]
            const v1 = fVertices[(i + 1) % n]
            eVertices.push([
                1 / 2 * (v0[0] + v1[0]),
                1 / 2 * (v0[1] + v1[1]),
                1 / 2 * (v0[2] + v1[2])
            ])
        }

        // compute new vertices
        const id = ivertices.length
        for (let i = 0; i < n; i++) {
            // collect vertices
            const v0 = fVertices[i]
            const v1 = eVertices[i]
            const v2 = center
            const v3 = eVertices[(i - 1 + n) % n]
            ivertices.push([
                1 / 4 * (v0[0] + v1[0] + v2[0] + v3[0]),
                1 / 4 * (v0[1] + v1[1] + v2[1] + v3[1]),
                1 / 4 * (v0[2] + v1[2] + v2[2] + v3[2])
            ])
        }
        // create face-face
        const iface = []
        for (let i = 0; i < n; i++) iface.push(id + i)
        ifaces.push(iface)

        // create edge-faces
        he = f.he
        for (let i = 0; i < n; i++) {
            const v0 = iface[i]
            const v1 = iface[(i + 1) % n]
            edgeFaces[he] = [{ v0, v1 }, false]
            he = halfedges[he].next
        }
        // create vertex-face 
        he = f.he
        for (let i = 0; i < n; i++) {
            vertexFaces[halfedges[he].origin].push({ v: iface[i], f: f.index })
            he = halfedges[he].next
        }
    }) // loop over the faces
    // compute edge-faces
    edgeFaces.forEach((e, index, arr) => {
        if (!vertices[halfedges[index].origin].bnd) {
            if (!arr[index][1]) {
                const h0 = index
                const h1 = halfedges[h0].twin
                const v0 = arr[h0][0].v0
                const v1 = arr[h1][0].v1
                const v2 = arr[h1][0].v0
                const v3 = arr[h0][0].v1
                ifaces.push([v0, v1, v2, v3])
                arr[h0][1] = true
                arr[h1][1] = true
            }
        }
    })
    // compute vertex faces
    vertexFaces.forEach((f, index, arr) => {
        const incident = incidentFaces(index, vertices, halfedges, faces)
        const vface = []
        incident.forEach(fId => {
            for (let i = 0; i < f.length; i++) {
                if (fId === f[i].f) {
                    vface.push(f[i].v)
                }
            }
        })
        if (vface.length > 0)
            ifaces.push(vface)
    })

    // remark: indices start at 1 in Obj file format
    for (let i = 0; i < ifaces.length; i++) {
        for (let j = 0; j < ifaces[i].length; j++) {
            ifaces[i][j] += 1
        }
    }

    // construct halfedge mesh from indexed face set
    const iMesh = { vertices: ivertices, faces: ifaces }
    return heMeshFromIndexedFaceSet(iMesh, heMesh.bbox)
}

// compute id of incident faces given a vertex
function incidentFaces(index, vertices, halfedges, faces) {
    const neigh = []
    const h0 = vertices[index].he
    let hn = h0
    do {
        const faceId = halfedges[hn].face
        const n = faces[faceId].size
        for (let i = 1; i < n; i++) {
            hn = halfedges[hn].next
        }
        neigh.push(faceId)
        hn = halfedges[hn].twin
    } while (hn != h0 && hn !== -1)
    if (hn === -1) return []
    else return neigh
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