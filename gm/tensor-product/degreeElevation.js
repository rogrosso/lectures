import * as THREE from "three"
import { OrbitControls } from "OrbitControls"
import { GUI } from "GUI"
//import teapot from 'teapot' assert {type: 'json'}
import {
    tessellation,
    computePatches,
    degreeElevationPatches,
} from "tpSurfaces"
import { randColors } from "colors"

const url1 = "../data/teapot.json"
async function drawAll(url1) {
    const response1 = await fetch(url1)
    const teapot = await response1.json()
    draw(teapot)
}
drawAll(url1)
function draw(teapot) {
    const colors = randColors(11)
    const width = 500
    const height = 500 - 30
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f8ff)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.11, 1000)
    camera.position.set(0.01, 4, 9)
    // add a ground plane to improve perspective view
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(80, 80, 10, 10),
        new THREE.MeshLambertMaterial({
            color: 0xa0adaf,
            side: THREE.DoubleSide,
        })
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.set(0, -2, 0)
    ground.castShadow = false
    ground.receiveShadow = true
    scene.add(ground)
    // Light sources
    const light1 = new THREE.PointLight(0xffffff, 1, 100, 1.5)
    light1.position.set(3, 10, 15)
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

    // renderer
    const renderer = new THREE.WebGLRenderer()
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    threejs_canvas.append(renderer.domElement)
    renderer.domElement.style.border = "solid #a0adaf"

    // controls: camera
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.minDistance = 0.01
    controls.maxDistance = 100
    controls.target.set(0, 0.5, 0)
    controls.update()
    // create first the gui
    // gui
    const maxDegreeElevation = 3
    const gui = new GUI({ container: threejs_canvas })
    gui.close()
    gui.domElement.classList.add("deCasteljau-gui")
    gui.domElement.classList.add("deCasteljau-gui")
    gui.domElement.style.border = "solid blue"
    gui.domElement.style.zIndex = "100"
    const folderVis = gui.addFolder("Visualization")
    const folderGeo = gui.addFolder("Geometry")
    const guiProps = {
        visualization: {
            wireframe: false,
            patches: false,
            controlNet: false,
        },
        geometry: {
            level: 3,
            degreeElevation: 0,
        },
    }
    folderVis.add(guiProps.visualization, "wireframe").onChange((v) => {
        if (v === true) wMaterial.forEach((m) => (m.visible = true))
        else wMaterial.forEach((m) => (m.visible = false))
    })
    folderVis.add(guiProps.visualization, "patches").onChange((v) => {
        if (v === true) {
            mMaterial.forEach((c, i) => (c.color = colorMap[i]))
            wMaterial.forEach(
                (c, i) => (c.color = colorMap[i].clone().multiplyScalar(0.3))
            )
        } else {
            mMaterial.forEach((c, i) => (c.color = defaultColor))
            wMaterial.forEach(
                (c, i) => (c.color = defaultColor.clone().multiplyScalar(0.3))
            )
        }
    })
    folderVis
        .add(guiProps.visualization, "controlNet")
        .name("control net")
        .onChange((v) => {
            if (v === true) {
                lGroup.children.forEach((l) => {
                    l.material.visible = true
                })
            } else {
                lGroup.children.forEach((l) => {
                    l.material.visible = false
                })
            }
        })
    folderGeo
        .add(guiProps.geometry, "level", 2, 5, 1)
        .name("sampling level")
        .onFinishChange(updateGeometry)
    folderGeo
        .add(guiProps.geometry, "degreeElevation", 0, maxDegreeElevation, 1)
        .name("degree elevation")
        .onChange(updateGeometry)
    const geoState = {
        level: guiProps.geometry.level,
        degreeElevation: guiProps.geometry.degreeElevation,
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////
    // Render
    const patches = []
    patches.push(computePatches(teapot.patches, teapot.vertices))
    for (let level = 1; level <= maxDegreeElevation; level++) {
        patches.push(degreeElevationPatches(patches[level - 1]))
    }
    // List of materials and colors
    const defaultColor = new THREE.Color(0x049ef4)
    const mMaterial = []
    const wMaterial = []
    const colorMap = []
    const nrPatches = patches[0].length
    for (let i = 0; i < nrPatches; i++) {
        const c = colors()
        colorMap.push(
            new THREE.Color("rgb(" + c[0] + "," + c[1] + "," + c[2] + ")")
        )
        mMaterial.push(
            new THREE.MeshPhysicalMaterial({
                color: defaultColor,
                side: THREE.DoubleSide,
                flatShading: false,
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
                polygonOffsetUnits: 1,
            })
        )
        wMaterial.push(
            new THREE.MeshBasicMaterial({
                color: defaultColor.clone().multiplyScalar(0.3),
                wireframe: true,
                visible: false,
            })
        )
    }
    // collect meshes into groups
    const mGroup = new THREE.Group()
    const wGroup = new THREE.Group()
    const lGroup = new THREE.Group()
    // default sampling level
    const level = 3
    // draw onece: generate teapot and control net
    updateTeapot(mGroup, wGroup, mMaterial, wMaterial, patches[0], level)
    updateControlNet(lGroup, patches[0])
    scene.add(mGroup)
    scene.add(wGroup)
    scene.add(lGroup)
    // animation loop
    animate()
    function animate() {
        requestAnimationFrame(animate)
        light2.position.copy(camera.position)
        render()
    }
    function render() {
        renderer.render(scene, camera)
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////
    function updateGeometry() {
        if (
            geoState.level !== guiProps.geometry.level ||
            geoState.degreeElevation !== guiProps.geometry.degreeElevation
        ) {
            const e = guiProps.geometry.degreeElevation
            const l = guiProps.geometry.level
            updateTeapot(mGroup, wGroup, mMaterial, wMaterial, patches[e], l)
            updateControlNet(lGroup, patches[e])
            geoState.level = l
            geoState.degreeElevation = e
        }
    }

    // Geometry section
    // dispose array after uploading to graphic card
    function disposeArray() {
        this.array = null
    }
    // update geometry of teapot
    function updateTeapot(
        mGroup,
        wGroup,
        mMaterial,
        wMaterial,
        patches,
        level
    ) {
        const mesh = tessellation(patches, level)
        // clear groups
        while (mGroup.children.length > 0) {
            mGroup.remove(mGroup.children[0])
        }
        while (wGroup.children.length > 0) {
            wGroup.remove(wGroup.children[0])
        }
        // collect new meshes
        const sMesh = []
        const wMesh = []
        Object.entries(mesh).forEach(([key, patch], index) => {
            const { nx, ny, vertices, faces } = patch
            const geometry = new THREE.BufferGeometry()
            geometry.setIndex(faces)
            geometry.setAttribute(
                "position",
                new THREE.Float32BufferAttribute(vertices, 3).onUpload(
                    disposeArray
                )
            )
            geometry.computeVertexNormals()
            //let m = mGroup.children[index]
            //mGroup.remove(m)
            const m = new THREE.Mesh(geometry, mMaterial[index])
            m.castShadow = true
            m.receiveShadow = false
            sMesh.push(m)
            //let w = wGroup.children[index]
            //wGroup.remove(w)
            wMesh.push(new THREE.Mesh(geometry, wMaterial[index]))
        })
        // update mGroup
        sMesh.forEach((t) => mGroup.add(t))
        wMesh.forEach((t) => wGroup.add(t))
    }
    // update geometry of control net
    function updateControlNet(lGroup, patches) {
        // clear line group
        while (lGroup.children.length > 0) {
            lGroup.remove(lGroup.children[0])
        }
        const lines = []
        for (let key in patches) {
            const controlPoints = patches[key]
            const iSize = controlPoints.length
            const jSize = controlPoints[0].length
            for (let i = 0; i < iSize; i++) {
                const points = []
                for (let j = 0; j < jSize; j++) {
                    const { x, y, z } = controlPoints[i][j]
                    points.push(new THREE.Vector3(x, y, z))
                }
                lines.push(points)
            }
            for (let j = 0; j < jSize; j++) {
                const points = []
                for (let i = 0; i < iSize; i++) {
                    const { x, y, z } = controlPoints[i][j]
                    points.push(new THREE.Vector3(x, y, z))
                }
                lines.push(points)
            }
        }
        // construct geometries
        lines.forEach((l) => {
            const g = new THREE.BufferGeometry().setFromPoints(l)
            const m = new THREE.LineBasicMaterial({ color: 0x050505 })
            m.visible = guiProps.visualization.controlNet
            const line = new THREE.Line(g, m)
            lGroup.add(line)
        })
        // for each control point generate a small sphere
        for (let key in patches) {
            const controlPoints = patches[key]
            controlPoints.forEach((row) => {
                row.forEach((p) => {
                    const sG = new THREE.SphereGeometry(0.03, 15, 10)
                    //const sM = new THREE.MeshBasicMaterial( { color: 0xC92519, visible: false })
                    const sM = new THREE.MeshPhongMaterial({
                        color: 0xc92519,
                        visible: guiProps.visualization.controlNet,
                    })
                    const sphere = new THREE.Mesh(sG, sM)
                    sphere.position.set(p.x, p.y, p.z)
                    lGroup.add(sphere)
                })
            })
        }
    }
}

const cText = `
// degree elevation for a Bézier curve in 3D
function degreeElevation(points) {
    const n = points.length - 1
    const b = []
    b.push({x: points[0].x, y: points[0].y, z: points[0].z})
    for (let i = 1; i <= n; i++) {
        b.push( {
            x: i / (n+1) * points[i-1].x + (1 - i/(n+1)) * points[i].x,
            y: i / (n+1) * points[i-1].y + (1 - i/(n+1)) * points[i].y,
            z: i / (n+1) * points[i-1].z + (1 - i/(n+1)) * points[i].z
        })
    }
    b.push({x: points[n].x, y: points[n].y, z: points[n].z})
    return b
}
// degree elevation of TP Bezier surface
function degreeElevationTP(patch) {
    const iSize = patch.length
    const jSize = patch[0].length
    const ePatch = [...Array(iSize+1)].map( e => [...Array(jSize+1)])
    for(let i = 0; i < iSize; i++) {
        const row = []
        for (let j = 0; j < jSize; j++) {
            row.push({x: patch[i][j].x, y: patch[i][j].y, z: patch[i][j].z})
        }
        const b = degreeElevation(row)
        for (let j = 0; j < (jSize+1); j++) {
            ePatch[i][j] = b[j]
        }
    }
    for (let j = 0; j < (jSize+1); j++) {
        const col = []
        for (let i = 0; i < iSize; i++) {
            col.push({x: ePatch[i][j].x, y: ePatch[i][j].y, z: ePatch[i][j].z})
        }
        const b = degreeElevation(col)
        for (let i = 0; i < (iSize+1); i++) ePatch[i][j] = b[i]
    }
    return ePatch
}
`
const hlDiv = document.getElementById("hl-code")
const hlPre = document.createElement("pre")
const hlCod = document.createElement("code")
hlDiv.append(hlPre)
hlPre.setAttribute("style", "border: 1px solid #C1BAA9")
hlPre.append(hlCod)
hlCod.append(cText)
