import * as THREE from "../../contrib/three.module.min.js"
import { OrbitControls } from "../../contrib/OrbitControls.js"
import GUI from "../../contrib/lil-gui.module.min.js"

//import trisToroidalTetrahedron from "trisToroidalTetrahedron" assert { type: "json" }
//import trisCube24 from "trisCube24" assert { type: "json" }
//import trisCube12 from "trisCube12" assert { type: "json" }
//import trisTetrahedron from "trisTetrahedron" assert { type: "json" }
//import icosahedron_with_bnd from "icosahedron_with_bnd" assert { type: "json" }

import halfedgeFactory from '../../common/halfedge.js'
import { renderBuffers, normalizeMesh, boundingBox } from '../../common/renderBuffers.js'
import sqrt3Subdivision from "./sqrt3Subdivision.js"

const url1 = "../data/trisToroidalTetrahedron.json"
const url2 = "../data/trisCube24.json"
const url3 = "../data/trisCube12.json"
const url4 = "../data/trisTetrahedron.json"
const url5 = "../data/icosahedron_with_bnd.json"

drawAll(url1, url2, url3, url4, url5)

async function drawAll(url1, url2, url3, url4) {
    const response1 = await fetch(url1)
    const trisToroidalTetrahedron = await response1.json()
    const response2 = await fetch(url2)
    const trisCube12 = await response2.json()
    const response3 = await fetch(url3)
    const trisCube24 = await response3.json()
    const response4 = await fetch(url4)
    const trisTetrahedron = await response4.json()
    const response5 = await fetch(url4)
    const icosahedron_with_bnd = await response5.json()

    const canvas = threejs_canvas
    const width = 650
    const height = 300
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f8ff)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.11, 1000)
    //const camInitPos = new THREE.Vector3(0, 4, 7)
    const camInitPos = new THREE.Vector3(0, 1.23, 7.15)
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

    // controls: camera
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.minDistance = 0.1
    controls.maxDistance = 80
    const ctTarget = new THREE.Vector3(-0.05, -0.19, -0.025)
    controls.target.copy(ctTarget)
    controls.target0.copy(ctTarget)
    controls.update()

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
    const c = folderRendering.add(guiProps.rendering, "camera")
    draw(g)
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
        const meshes = [// compute render buffers
            trisToroidalTetrahedron,
            trisCube24,
            trisCube12,
            trisTetrahedron,
            icosahedron_with_bnd
        ]
        const scaleFactors = [0.9, 0.87, 1.75, 0.87, 1.23]
        const rotationAngles = [
            -Math.PI / 2,
            -Math.PI / 2,
            -Math.PI / 2,
            -Math.PI / 2,
            0
        ]
        const defaultColor = new THREE.Color(0x049ef4)
        meshes.forEach((iMesh, index) => {
            const {faces, vertices} = iMesh
            let m = halfedgeFactory(faces, vertices)
            normalizeMesh(m)
            const n = 4
            let x0 = -4
            const dx = (2 * Math.abs(x0)) / (n - 1)
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
                const geometry = new THREE.BufferGeometry()
                geometry.setIndex(iBuff)
                geometry.setAttribute(
                    "position",
                    new THREE.Float32BufferAttribute(vBuff, 3).onUpload(disposeArray)
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
                sMesh.castShadow = true
                sMesh.rotation.x = rotationAngles[index] //-Math.PI / 2
                // wireframe
                const wGeometry = new THREE.BufferGeometry().setFromPoints(wireF)
                const wireframe = new THREE.LineSegments(
                    wGeometry,
                    new THREE.LineBasicMaterial({ color: 0x040701, linewidth: 1 })
                )
                wireframe.rotation.x = rotationAngles[index] //-Math.PI / 2
                // bounding box of input mesh
                const bGeometry = new THREE.BufferGeometry().setFromPoints(bBuff)
                const bbox = new THREE.LineSegments(
                    bGeometry,
                    new THREE.LineBasicMaterial({ color: 0xb008b, linewidth: 1 })
                )
                bbox.rotation.x = rotationAngles[index] //-Math.PI / 2
                // position objects
                sMesh.translateX(x0)
                wireframe.translateX(x0)
                bbox.translateX(x0)
                // set visibility
                sMesh.material.visible = false
                wireframe.material.visible = false
                bbox.material.visible = false
                // collect subdivisions into model group
                mGroup.add(sMesh)
                mGroup.add(wireframe)
                mGroup.add(bbox)
                // compute subdivision
                //if (i < n - 1) m = sqRoot3Subdivision(m)
                m = sqrt3Subdivision(m)
                // update object position
                x0 += dx
            }
            // collect all models groups
            g.add(mGroup)
        })
        g.children[0].children.forEach((e, index) => {
            e.material.visible = true
        })
        scene.traverse( function(ch) {
            if (ch.LineSegments) ch.castShadow = true
        })

        // animation loop
        animate()
        function animate() {
            requestAnimationFrame(animate)
            if (rotationFlag) {
                const q = new THREE.Quaternion()
                q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.005)
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
} // drawAll()

const cText = `
// sqrt(3) subdivision 
function smoothOldVertex(v, onering) {
    const p = [0, 0, 0]
    let k = 0
    onering.forEach((nv) => {
        k++
        p[0] += nv.v[0]
        p[1] += nv.v[1]
        p[2] += nv.v[2]
    })
    const beta = (4 - 2 * Math.cos((2 * Math.PI) / k)) / (9 * k)
    return [
        (1 - k * beta) * v.v[0] + beta * p[0],
        (1 - k * beta) * v.v[1] + beta * p[1],
        (1 - k * beta) * v.v[2] + beta * p[2]
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