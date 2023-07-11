import * as THREE from "../../contrib/three.module.min.js"
import { OrbitControls } from "../../contrib/OrbitControls.js"
import { readOFF } from "../common/utilities.js"
import { renderBuffers } from "../../common/renderBuffers.js"
import indexedFaceSetFactory from "../../common/indexedFaceSet.js"
import kdTreeFactory from "../../common/kdTree.js"
import matrixFactory from "../../common/matrix.js"
import svdFactory from "../../common/svd.js"


const url1 = "../data/bunny_part1.off"
const url2 = "../data/bunny_part2.off"
drawAll(url1, url2)

async function drawAll(url1, url2) {
    const response1 = await fetch(url1)
    const offFile1 = await response1.text()
    const response2 = await fetch(url2)
    const offFile2 = await response2.text()
    const target = readOFF(offFile1)
    const source = readOFF(offFile2)
    icp(source, target)
}

const maxIterations = 60
/**
 * Point-to-point ICP
 * @param {Object} source, source mesh
 * @param {Object} target, target mesh 
 */
function icp(source, target) {
    const { vertices: sVertices, faces: sFaces } = source
    const { vertices: tVertices, faces: tFaces } = target
    const sMesh = indexedFaceSetFactory(sVertices, sFaces)
    const tMesh = indexedFaceSetFactory(tVertices, tFaces)
    sMesh.findBoundaryVertices()
    tMesh.findBoundaryVertices()
    sMesh.computeVertexNormals()
    tMesh.computeVertexNormals()
    const kdt = buildKdTree(target)
    render(sMesh, tMesh, kdt)
}
/**
 * Build kd-tree out of the target point cloud
 * @param {Object} target, target point cloud
 * @returns kd-tree
 */
function buildKdTree(target) {
    const points = []
    for (let v of target.vertices) {
        points.push({
            index: v.index,
            x: v.x,
            y: v.y,
            z: v.z
        })
    }
    return kdTreeFactory(points) 
}
/**
 * Find the closest point in the target point cloud
 * @param {Object} kdt, kd-tree
 * @param {Object} source, source point cloud
 * @param {Object} target, target point cloud
 * @returns pairs, array of corresponding points
 */
function findCorrespondences(kdt, source, target) {
    const threshold = 0.7
    const pairs = []
    for (let i = 0; i < source.v_length; i++) {
        const pS = source.v(i)
        const nn = kdt.nearest(pS)
        if (nn !== null) {
            const nS = source.n(pS.index)
            const pT = nn.point
            const nT = target.n(pT.index)
            const s = nT.x * nS.x + nT.y * nS.y + nT.z * nS.z
            if (s > threshold || (pS.bnd && nn.distance < 0.005)) {
                const p = { distance: nn.distance, p: pT, q: pS }
                pairs.push(p)
            }
        }
    }
    pairs.sort((a, b) => a.distance - b.distance)
    return pairs.slice(0, 2150)
}
/**
 * Estimate rigid transformation to transform source point cloud to target point cloud
 * @param {Object} pairs, array of corresponding points
 * @returns object with rotation matrix, barycenters of source and target point clouds
 */
function estimateRigidTransformation(pairs) {
    const muSource = [0, 0, 0]
    const muTarget = [0, 0, 0]
    const m_ = new Set() // unique set of target points
    for (let { p } of pairs) {
        m_.add(p)
    }
    let szT = 0
    for (let e of m_) {
        muTarget[0] += e.x
        muTarget[1] += e.y
        muTarget[2] += e.z
        szT++
    }
    let szS = 0
    for (let { q } of pairs) {
        muSource[0] += q.x
        muSource[1] += q.y
        muSource[2] += q.z
        szS++
    }
    muSource[0] /= szS
    muSource[1] /= szS
    muSource[2] /= szS
    muTarget[0] /= szT
    muTarget[1] /= szT
    muTarget[2] /= szT
    const sp = []
    const tp = []
    pairs.forEach((e) => {
        const { p, q } = e
        sp.push([q.x - muSource[0], q.y - muSource[1], q.z - muSource[2]])
        tp.push([p.x - muTarget[0], p.y - muTarget[1], p.z - muTarget[2]])
    })

    const m = new Array(3).fill(0).map((row) => new Array(3).fill(0))
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < sp.length; k++) {
                m[i][j] += tp[k][i] * sp[k][j]
            }
        }
    }
    const svd = svdFactory()
    const r = svd.fastSvd(m)
    const { U, V } = r
    const rot = new Array(3).fill(0).map((row) => new Array(3).fill(0))
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 3; k++) {
                rot[i][j] += U[i][k] * V[j][k]
            }
        }
    }
    return {
        R: rot,
        ms: muSource,
        mt: muTarget
    }
}
/**
 * Transform source point cloud
 * @param {Object} source, source point cloud
 * @param {Object} rbt, rigid body transformation
 */
function transform(source, rbt) {
    const { R, ms, mt } = rbt
    const t = [
        mt[0] - R[0][0] * ms[0] - R[0][1] * ms[1] - R[0][2] * ms[2],
        mt[1] - R[1][0] * ms[0] - R[1][1] * ms[1] - R[1][2] * ms[2],
        mt[2] - R[2][0] * ms[0] - R[2][1] * ms[1] - R[2][2] * ms[2]
    ]
    for (let v of source.vertices) {
        const x = R[0][0] * v.x + R[0][1] * v.y + R[0][2] * v.z + t[0]
        const y = R[1][0] * v.x + R[1][1] * v.y + R[1][2] * v.z + t[1]
        const z = R[2][0] * v.x + R[2][1] * v.y + R[2][2] * v.z + t[2]
        v.x = x
        v.y = y
        v.z = z
    }
}
/**
 * One iteration of ICP
 * @param {Object} source, source point cloud
 * @param {Object} target, target point cloud
 * @param {Object} kdt, kd-tree of target point cloud
 */
function align(source, target, kdt) {
    const pairs = findCorrespondences(kdt, source, target)
    const rbt = estimateRigidTransformation(pairs)
    transform(source, rbt)
    source.computeVertexNormals()
}


// render
function render(source, target, kdt) {
    const canvas = threejs_canvas
    const width = 500
    const height = 500
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x5d8fb0)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000)
    camera.position.set(0.1, 0.12, 0.19)
    // Light sources
    const light1 = new THREE.PointLight(0xffffff, 1, 100, 1.5)
    light1.position.set(0, 0.01, 3)
    const aLight = new THREE.AmbientLight(0xf5f5f5)
    scene.add(light1)
    scene.add(aLight)

    // renderer
    const renderer = new THREE.WebGLRenderer()
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    canvas.appendChild(renderer.domElement)

    // controls: camera
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.minDistance = 0.01
    controls.maxDistance = 80
    controls.target.set(0.0037, 0.1, 0.039)
    controls.update()

    const defaultColor = new THREE.Color(0x787878) //new THREE.Color(0x049ef4) // new THREE.Color(0x787878)
    const mMaterial = new THREE.MeshPhongMaterial({
        color: defaultColor,
        vertexColors: true,
        flatShading: true,
        side: THREE.DoubleSide,
        //side: THREE.FrontSide,
        specular: 0xa4a4a4,
        shininess: 5,
        reflectivity: 1,
        polygonOffset: true,
        polygonOffsetFactor: 1, // positive value pushes polygon further away
        polygonOffsetUnits: 1
    })
    const wMaterial = new THREE.MeshBasicMaterial({
        color: defaultColor.clone().multiplyScalar(0.3),
        wireframe: true,
        visible: true
    })
    const buff1 = renderBuffers(target, true, false, false)
    const buff2 = renderBuffers(source, true, false, false)
    // color buffers 
    const cBuff1 = []
    let grey = 0.7
    const alpha = 0.05
    for (let v of target.vertices) {
        if (v.bnd === true) {
            cBuff1.push(1, 0, 1)
        } else {
            const r = grey + alpha * (2 * Math.random() - 1)
            const g = grey + alpha * (2 * Math.random() - 1)
            const b = grey + alpha * (2 * Math.random() - 1)
            cBuff1.push(r, g, b)
        }
    }
    const cBuff2 = []
    grey = 0.4
    for (let v of source.vertices) {
        if (v.bnd === true) {
            cBuff2.push(1, 0, 1)
        } else {
            const r = grey + alpha * (2 * Math.random() - 1)
            const g = grey + alpha * (2 * Math.random() - 1)
            const b = grey + alpha * (2 * Math.random() - 1)
            cBuff2.push(r, g, b)
        }
    }

    const targetGeometry = new THREE.BufferGeometry()
    targetGeometry.setIndex(buff1.iBuff)
    targetGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(buff1.vBuff, 3)
    )
    targetGeometry.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(buff1.nBuff, 3)
    )
    targetGeometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(cBuff1, 3)
    )
    const tMesh = new THREE.Mesh(targetGeometry, mMaterial)
    const tWire = new THREE.Mesh(targetGeometry, wMaterial)
    const sourceGeometry = new THREE.BufferGeometry()
    sourceGeometry.setIndex(buff2.iBuff)
    sourceGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(buff2.vBuff, 3)
    )
    sourceGeometry.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(buff2.nBuff, 3)
    )
    sourceGeometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(cBuff2, 3)
    )
    const sMesh = new THREE.Mesh(sourceGeometry, mMaterial)
    const sWire = new THREE.Mesh(sourceGeometry, wMaterial)
    scene.add(tMesh)
    scene.add(tWire)
    scene.add(sMesh)
    scene.add(sWire)

    let nrIter = 0
    function alignmentStep(source, target, kdt) {
        align(source, target, kdt)
        sourceGeometry.attributes.position.needsUpdate = true
        sourceGeometry.attributes.normal.needsUpdate = true
        const sPosition = sourceGeometry.attributes.position.array
        const sNormal = sourceGeometry.attributes.normal.array
        for (let i = 0; i < source.v_length; i++) {
            const v = source.v(i)
            const n = source.n(i)
            sPosition[3 * i] = v.x
            sPosition[3 * i + 1] = v.y
            sPosition[3 * i + 2] = v.z
            sNormal[3 * i] = n.x
            sNormal[3 * i + 1] = n.y
            sNormal[3 * i + 2] = n.z
        }
        return 1
    }

    function step() {
        return new Promise((resolve, reject) => {
            //console.log(`in promise`)
            const s = alignmentStep(source, target, kdt)
            if (s === 1) {
                resolve(s)
            } else {
                reject(s)
            }
        })
    }
    async function doWork() {
        try {
            const s = await step()
            nrIter += s
        } catch (error) {
            console.log(error)
        }
    }
    function render() {
        renderer.render(scene, camera)
    }
    const fps = 5
    let interval = 1000 / fps
    let previousTime = performance.now()
    function animate(currentTime) {
        requestAnimationFrame(animate)
        const pos = camera.position.clone()
        light1.position.set(pos.x, pos.y, pos.z)
        const delta = currentTime - previousTime
        render()
        if (nrIter < maxIterations && delta > interval) {
            previousTime = currentTime - (delta % interval)
            doWork()
        }
    }
    animate()
}

const cText = `
const maxIterations = 60
/**
 * Point-to-point ICP
 * @param {Object} source, source mesh
 * @param {Object} target, target mesh 
 */
function icp(source, target) {
    const { vertices: sVertices, faces: sFaces } = source
    const { vertices: tVertices, faces: tFaces } = target
    const sMesh = indexedFaceSetFactory(sVertices, sFaces)
    const tMesh = indexedFaceSetFactory(tVertices, tFaces)
    sMesh.findBoundaryVertices()
    tMesh.findBoundaryVertices()
    sMesh.computeVertexNormals()
    tMesh.computeVertexNormals()
    const kdt = buildKdTree(target)
    render(sMesh, tMesh, kdt)
}
/**
 * Build kd-tree out of the target point cloud
 * @param {Object} target, target point cloud
 * @returns kd-tree
 */
function buildKdTree(target) {
    const points = []
    for (let v of target.vertices) {
        points.push({
            index: v.index,
            x: v.x,
            y: v.y,
            z: v.z
        })
    }
    return kdTreeFactory(points) 
}
/**
 * Find the closest point in the target point cloud
 * @param {Object} kdt, kd-tree
 * @param {Object} source, source point cloud
 * @param {Object} target, target point cloud
 * @returns pairs, array of corresponding points
 */
function findCorrespondences(kdt, source, target) {
    const threshold = 0.7
    const pairs = []
    for (let i = 0; i < source.v_length; i++) {
        const pS = source.v(i)
        const nn = kdt.nearest(pS)
        if (nn !== null) {
            const nS = source.n(pS.index)
            const pT = nn.point
            const nT = target.n(pT.index)
            const s = nT.x * nS.x + nT.y * nS.y + nT.z * nS.z
            if (s > threshold || (pS.bnd && nn.distance < 0.005)) {
                const p = { distance: nn.distance, p: pT, q: pS }
                pairs.push(p)
            }
        }
    }
    pairs.sort((a, b) => a.distance - b.distance)
    return pairs.slice(0, 2150)
}
/**
 * Estimate rigid transformation to transform source point cloud to target point cloud
 * @param {Object} pairs, array of corresponding points
 * @returns object with rotation matrix, barycenters of source and target point clouds
 */
function estimateRigidTransformation(pairs) {
    const muSource = [0, 0, 0]
    const muTarget = [0, 0, 0]
    const m_ = new Set() // unique set of target points
    for (let { p } of pairs) {
        m_.add(p)
    }
    let szT = 0
    for (let e of m_) {
        muTarget[0] += e.x
        muTarget[1] += e.y
        muTarget[2] += e.z
        szT++
    }
    let szS = 0
    for (let { q } of pairs) {
        muSource[0] += q.x
        muSource[1] += q.y
        muSource[2] += q.z
        szS++
    }
    muSource[0] /= szS
    muSource[1] /= szS
    muSource[2] /= szS
    muTarget[0] /= szT
    muTarget[1] /= szT
    muTarget[2] /= szT
    const sp = []
    const tp = []
    pairs.forEach((e) => {
        const { p, q } = e
        sp.push([q.x - muSource[0], q.y - muSource[1], q.z - muSource[2]])
        tp.push([p.x - muTarget[0], p.y - muTarget[1], p.z - muTarget[2]])
    })

    const m = new Array(3).fill(0).map((row) => new Array(3).fill(0))
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < sp.length; k++) {
                m[i][j] += tp[k][i] * sp[k][j]
            }
        }
    }
    const svd = svdFactory()
    const r = svd.fastSvd(m)
    const { U, V } = r
    const rot = new Array(3).fill(0).map((row) => new Array(3).fill(0))
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 3; k++) {
                rot[i][j] += U[i][k] * V[j][k]
            }
        }
    }
    return {
        R: rot,
        ms: muSource,
        mt: muTarget
    }
}
/**
 * Transform source point cloud
 * @param {Object} source, source point cloud
 * @param {Object} rbt, rigid body transformation
 */
function transform(source, rbt) {
    const { R, ms, mt } = rbt
    const t = [
        mt[0] - R[0][0] * ms[0] - R[0][1] * ms[1] - R[0][2] * ms[2],
        mt[1] - R[1][0] * ms[0] - R[1][1] * ms[1] - R[1][2] * ms[2],
        mt[2] - R[2][0] * ms[0] - R[2][1] * ms[1] - R[2][2] * ms[2]
    ]
    for (let v of source.vertices) {
        const x = R[0][0] * v.x + R[0][1] * v.y + R[0][2] * v.z + t[0]
        const y = R[1][0] * v.x + R[1][1] * v.y + R[1][2] * v.z + t[1]
        const z = R[2][0] * v.x + R[2][1] * v.y + R[2][2] * v.z + t[2]
        v.x = x
        v.y = y
        v.z = z
    }
}
/**
 * One iteration of ICP
 * @param {Object} source, source point cloud
 * @param {Object} target, target point cloud
 * @param {Object} kdt, kd-tree of target point cloud
 */
function align(source, target, kdt) {
    const pairs = findCorrespondences(kdt, source, target)
    const rbt = estimateRigidTransformation(pairs)
    transform(source, rbt)
    source.computeVertexNormals()
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