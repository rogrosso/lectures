import * as THREE from "../../contrib/three.module.min.js"
import { OrbitControls } from "../../contrib/OrbitControls.js"
import GUI from "../../contrib/lil-gui.module.min.js"

//import quadToroidalTetra from 'quadToroidalTetra' assert{ type: 'json' }
//import quadCube from 'quadCube' assert{ type: 'json' }
//import quadCube_with_bnd from 'quadCube_with_bnd' assert{ type: 'json' }
//import quadPawn from 'quadPawn' assert{ type: 'json' }

import halfedgeFactory from "../../common/halfedge.js"
import {
    renderBuffers,
    normalizeMesh,
    boundingBox
} from "../../common/renderBuffers.js"
import catmullClarkSubdivision from "./catmullClarkSubdivision.js"
let rotationFlag = true
export async function drawAll(url1, url2, url3, url4) {
    const response1 = await fetch(url1)
    const quadToroidalTetra = await response1.json()
    const response2 = await fetch(url2)
    const quadCube = await response2.json()
    const response3 = await fetch(url3)
    const quadCube_with_bnd = await response3.json()
    const response4 = await fetch(url4)
    const quadPawn = await response4.json()
    const canvas = threejs_canvas
    let width = 600
    let height = 350
    if (canvas.dataset.width !== undefined) width = canvas.dataset.width
    if (canvas.dataset.height !== undefined) {
        height = Math.floor((canvas.dataset.width * height) / 600)
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f8ff)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.11, 1000)
    const camInitPos = new THREE.Vector3(0, 1.23, 9)
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
    const ctTarget = new THREE.Vector3(0, -0.19, -0.025)
    controls.target.copy(ctTarget)
    controls.target0.copy(ctTarget)
    controls.update()
    // resize window
    //function onWindowResize() {
    //camera.aspect = window.innerWidth / window.innerHeight
    //camera.updateProjectionMatrix()
    //renderer.setSize( window.innerWidth, window.innerHeight )
    //}

    // build up gui
    //let rotationFlag = true
    const gui = new GUI({ container: threejs_canvas })
    gui.close()
    gui.domElement.classList.add("catmullClark-gui")
    gui.domElement.style.border = "solid blue"
    gui.domElement.style.zIndex = "100"
    const folderModel = gui.addFolder("Model")
    const folderRendering = gui.addFolder("Rendering")
    const guiProps = {
        model: {
            tetra: true,
            cube1: false,
            cube2: false,
            pawn: false
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
        .add(guiProps.model, "tetra")
        .name("toroidal tetrahedron")
        .listen()
        .onChange((v) => setModel(g, guiProps, "tetra", v))
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
        .add(guiProps.model, "pawn")
        .name("pawn")
        .listen()
        .onChange((v) => setModel(g, guiProps, "pawn", v))
    const w = folderRendering
        .add(guiProps.rendering, "wireframe")
        .listen()
        .onChange((v) => {
            let mIndex = 0
            if (guiProps.model.tetra === true) mIndex = 0
            else if (guiProps.model.cube1 === true) mIndex = 1
            else if (guiProps.model.cube2 === true) mIndex = 2
            else if (guiProps.model.pawn === true) mIndex = 3
            g.children[mIndex].children.forEach((c, index) => {
                if (index % 3 === 1) {
                    c.material.visible = v
                }
            })
        })
    const f = folderRendering
        .add(guiProps.rendering, "flatShading")
        .listen()
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
            else if (guiProps.model.pawn === true) mIndex = 3
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
        .onChange((v) => rotationFlag = v)
    const c = folderRendering
        .add(guiProps.rendering, "camera")
        .name("reset camera")

    const config = {
        camera,
        renderer,
        scene,
        light1,
        light2,
        quadToroidalTetra,
        quadCube,
        quadCube_with_bnd,
        quadPawn
    }

    // draw
    draw(g, config)
} // drawAll()

///////////////////////////////////////////////////////////////////////////////
// Main loop:
//  - read models from json-files
//  - computes subdivisons
//  - computes THREE meshes for rendering
function draw(g, config) {
    const {
        camera,
        renderer,
        scene,
        light1,
        light2,
        quadToroidalTetra,
        quadCube,
        quadCube_with_bnd,
        quadPawn
    } = config
    // remove array from memory after upload on GPU
    function disposeArray() {
        this.array = null
    }
    const meshes = [quadToroidalTetra, quadCube, quadCube_with_bnd, quadPawn]
    const scaleFactors = [0.9, 1.6, 1.6, 5]
    const defaultColor = new THREE.Color(0x049ef4)
    // process input data
    meshes.forEach((iMesh, index) => {
        const { faces, vertices } = iMesh
        let m = halfedgeFactory(faces, vertices)
        normalizeMesh(m)
        const n = 4
        let x0 = -4
        const dx = (2 * Math.abs(x0)) / (n - 1)
        const mGroup = new THREE.Group()
        let bBuff = null
        for (let i = 0; i < n; i++) {
            // compute render buffers
            const { vBuff, iBuff, wBuff } = renderBuffers(m, false, true, false)
            if (i === 0) {
                const { xMin, xMax, yMin, yMax, zMin, zMax } = m.boundingBox()
                const buff = boundingBox(xMin, xMax, yMin, yMax, zMin, zMax)
                bBuff = []
                for (let j = 0; j < buff.length; j += 3) {
                    bBuff.push(
                        new THREE.Vector3(buff[j], buff[j + 1], buff[j + 2])
                    )
                }
            }
            const wireF = []
            for (let j = 0; j < wBuff.length; j += 3) {
                wireF.push(
                    new THREE.Vector3(wBuff[j], wBuff[j + 1], wBuff[j + 2])
                )
            }
            // compute surface mesh
            const geometry = new THREE.BufferGeometry()
            geometry.setIndex(iBuff)
            geometry.setAttribute(
                "position",
                new THREE.Float32BufferAttribute(vBuff, 3).onUpload(
                    disposeArray
                )
            )
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
            m = catmullClarkSubdivision(m)

            // position next subdivision surface
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
function smoothEdgeVertex(v, onering) {
    const p = [0, 0, 0]
    onering.forEach((nv) => {
        if (nv.type === "face" || nv.type === "vertex") {
            p[0] += nv.v[0]
            p[1] += nv.v[1]
            p[2] += nv.v[2]
        }
    })
    return [p[0] / 4, p[1] / 4, p[2] / 4]
}
function smoothVertexVertex(v, onering) {
    let F = [0, 0, 0]
    let E = [0, 0, 0]
    let N = 0
    onering.forEach((nv) => {
        if (nv.type === "face") {
            N++
            F[0] += nv.v[0]
            F[1] += nv.v[1]
            F[2] += nv.v[2]
        } else if (nv.type === "edge") {
            E[0] += nv.v[0]
            E[1] += nv.v[1]
            E[2] += nv.v[2]
        }
    })
    F = F.map((e) => e / N)
    E = E.map((e) => e / N)
    return [
        (F[0] + 2 * E[0] + (N - 3) * v.v[0]) / N,
        (F[1] + 2 * E[1] + (N - 3) * v.v[1]) / N,
        (F[2] + 2 * E[2] + (N - 3) * v.v[2]) / N
    ]
}
`
const hlDiv = document.getElementById("hl-code")
if (hlDiv) {
    const hlPre = document.createElement("pre")
    hlDiv.append(hlPre)
    const hlCode = document.createElement("code") // hlPre.append('code')
    hlCode.setAttribute("class", "language-javascript")
    hlCode.setAttribute("style", "border: 1px solid #C1BAA9")
    hlCode.innerHTML = cText
    hlPre.append(hlCode)
}
