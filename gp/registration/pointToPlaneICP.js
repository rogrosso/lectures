import * as THREE from "../../contrib/three.module.min.js"
import { OrbitControls } from "../../contrib/OrbitControls.js"
import { readOFF } from "../common/utilities.js"
import { renderBuffers } from "../../common/renderBuffers.js"
import indexedFaceSetFactory from "../../common/indexedFaceSet.js"
import kdTreeFactory from "../../common/kdTree.js"
import matrixFactory from "../../common/matrix.js"
import gaussEliminationFactory from "../../common/gaussElimination.js"

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

const maxIterations = 10
/**
 * Point-to-plane ICP
 * @param {Object} source, source mesh
 * @param {*} target, target mesh
 */
function icp(source, target) {
    const { vertices: sVertices, faces: sFaces } = source
    const { vertices: tVertices, faces: tFaces } = target
    const sMesh = indexedFaceSetFactory(sVertices, sFaces)
    const tMesh = indexedFaceSetFactory(tVertices, tFaces)
    sMesh.findBoundaryVertices()
    sMesh.computeVertexNormals()
    tMesh.findBoundaryVertices()
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
            z: v.z,
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
    const threshold = 0.3
    const pairs = []
    for (let pS of source.vertices) {
        //i = 0; i < source.v_length.length; i++) {
        if (!pS.bnd) {
            const nn = kdt.nearest(pS)
            if (nn !== null) {
                const nS = source.n(pS.index) // sNormals[i]
                const pT = nn.point
                const nT = target.n(pT.index)
                const s = nT.x * nS.x + nT.y * nS.y + nT.z * nS.z
                if (s > threshold) {
                    const p = { distance: nn.distance, p: pT, q: pS, n: nT }
                    pairs.push(p)
                }
            }
        }
    }
    // sort
    pairs.sort((a, b) => a.distance - b.distance)
    return pairs.slice(0, 2000)
}
/**
 * Estimate rigid transformation to transform source point cloud to target point cloud
 * @param {Object} pairs, array of corresponding points
 * @returns object with rotation matrix, barycenters of source and target point clouds
 */
function estimateRigidTransformation(pairs) {
    const g = gaussEliminationFactory()
    const C = new Array(6).fill(0)
    const K = new Array(6).fill(0).map((row) => new Array(6).fill(0))
    const F = new Array(6).fill(0)
    //pairs.forEach( e => {
    for (let { p, q, n } of pairs) {
        const np = n.x * (q.x - p.x) + n.y * (q.y - p.y) + n.z * (q.z - p.z)
        C[0] = q.y * n.z - q.z * n.y
        C[1] = q.z * n.x - q.x * n.z
        C[2] = q.x * n.y - q.y * n.x
        C[3] = n.x
        C[4] = n.y
        C[5] = n.z
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                K[i][j] += C[i] * C[j]
            }
        }
        F[0] -= np * C[0]
        F[1] -= np * C[1]
        F[2] -= np * C[2]
        F[3] -= np * C[3]
        F[4] -= np * C[4]
        F[5] -= np * C[5]
    }
    const Omega = g.solve(K, F)
    return Omega
}
/**
 * Transform source point cloud
 * @param {Object} source, source point cloud
 * @param {Object} rbt, rigid body transformation
 */
function transform(source, Omega) {
    const { vertices } = source
    // translation vector
    const t = [Omega[3], Omega[4], Omega[5]]
    // construct rotation matrix
    const Rx = new Array(3).fill(0).map((row) => new Array(3).fill(0))
    const Ry = new Array(3).fill(0).map((row) => new Array(3).fill(0))
    const Rz = new Array(3).fill(0).map((row) => new Array(3).fill(0))
    const cos0 = Math.cos(Omega[0])
    const sin0 = Math.sin(Omega[0])
    const cos1 = Math.cos(Omega[1])
    const sin1 = Math.sin(Omega[1])
    const cos2 = Math.cos(Omega[2])
    const sin2 = Math.sin(Omega[2])

    Rx[0][0] = 1
    Rx[1][1] = cos0
    Rx[1][2] = -sin0
    Rx[2][1] = sin0
    Rx[2][2] = cos0

    Ry[0][0] = cos1
    Ry[0][2] = sin1
    Ry[1][1] = 1
    Ry[2][0] = -sin1
    Ry[2][2] = cos1

    Rz[0][0] = cos2
    Rz[0][1] = -sin2
    Rz[1][0] = sin2
    Rz[1][1] = cos2
    Rz[2][2] = 1

    const Ryx = new Array(3).fill(0).map((row) => new Array(3).fill(0))
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 3; k++) {
                Ryx[i][j] += Ry[i][k] * Rx[k][j]
            }
        }
    }
    const R = new Array(3).fill(0).map((row) => new Array(3).fill(0))
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 3; k++) {
                R[i][j] += Rz[i][k] * Ryx[k][j]
            }
        }
    }
    //const { R, t } = rbt

    for (let p of source.vertices) {
        const x = R[0][0] * p.x + R[0][1] * p.y + R[0][2] * p.z
        const y = R[1][0] * p.x + R[1][1] * p.y + R[1][2] * p.z
        const z = R[2][0] * p.x + R[2][1] * p.y + R[2][2] * p.z
        p.x = x + t[0]
        p.y = y + t[1]
        p.z = z + t[2]
    }
}
/**
 * Align source point cloud to target point cloud
 * @param {Object} source, source point cloud
 * @param {Object} target, target point cloud
 * @param {Object} kdt, kd-tree of target point cloud
 * @returns void
 */
function align(source, target, kdt) {
    const pairs = findCorrespondences(kdt, source, target)
    const Omega = estimateRigidTransformation(pairs)
    transform(source, Omega)
    source.computeVertexNormals(source)
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
   // window.addEventListener("resize", onWindowResize)

    // controls: camera
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.minDistance = 0.01
    controls.maxDistance = 80
    controls.target.set(0.0037, 0.1, 0.039)
    controls.update()

    
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
    const defaultColor = new THREE.Color(0x787878) //new THREE.Color(0x049ef4) // new THREE.Color(0x787878)
    const mMaterial = new THREE.MeshPhongMaterial({
        color: defaultColor,
        vertexColors: true,
        flatShading: false,
        side: THREE.DoubleSide,
        //side: THREE.FrontSide,
        specular: 0xa4a4a4,
        shininess: 5,
        reflectivity: 1,
        polygonOffset: true,
        polygonOffsetFactor: 1, // positive value pushes polygon further away
        polygonOffsetUnits: 1,
    })
    const wMaterial = new THREE.MeshBasicMaterial({
        color: defaultColor.clone().multiplyScalar(0.3),
        wireframe: true,
        visible: true,
    })
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
    scene.add(tMesh)
    scene.add(tWire)
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
    scene.add(sMesh)
    scene.add(sWire)

    sourceGeometry.attributes.position.needsUpdate = true
    sourceGeometry.attributes.normal.needsUpdate = true
    const sPosition = sourceGeometry.attributes.position.array
    const sNormal = sourceGeometry.attributes.normal.array

    function alignmentStep(source, target, kdt) {
        const t0 = performance.now()
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
        const t1 = performance.now()
        //console.log(`iteration took ${t1 - t0} ms`)
        return 1
    }
    

    let nrIter = 0
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
            //console.log(`nrIter: ${nrIter}`)
            const s = await step()
            nrIter += s
            //console.log(`nrIter: ${nrIter}`)
        } catch (error) {
            console.log(error)
        }
    }
    const fps = 3
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

    function render() {
        renderer.render(scene, camera)
    }
    animate()
}

const cText = `
const maxIterations = 10
/**
 * Point-to-plane ICP
 * @param {Object} source, source mesh
 * @param {*} target, target mesh
 */
function icp(source, target) {
    const { vertices: sVertices, faces: sFaces } = source
    const { vertices: tVertices, faces: tFaces } = target
    const sMesh = indexedFaceSetFactory(sVertices, sFaces)
    const tMesh = indexedFaceSetFactory(tVertices, tFaces)
    sMesh.findBoundaryVertices()
    sMesh.computeVertexNormals()
    tMesh.findBoundaryVertices()
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
            z: v.z,
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
    const threshold = 0.3
    const pairs = []
    for (let pS of source.vertices) {
        //i = 0; i < source.v_length.length; i++) {
        if (!pS.bnd) {
            const nn = kdt.nearest(pS)
            if (nn !== null) {
                const nS = source.n(pS.index) // sNormals[i]
                const pT = nn.point
                const nT = target.n(pT.index)
                const s = nT.x * nS.x + nT.y * nS.y + nT.z * nS.z
                if (s > threshold) {
                    const p = { distance: nn.distance, p: pT, q: pS, n: nT }
                    pairs.push(p)
                }
            }
        }
    }
    // sort
    pairs.sort((a, b) => a.distance - b.distance)
    return pairs.slice(0, 2000)
}
/**
 * Estimate rigid transformation to transform source point cloud to target point cloud
 * @param {Object} pairs, array of corresponding points
 * @returns object with rotation matrix, barycenters of source and target point clouds
 */
function estimateRigidTransformation(pairs) {
    const g = gaussEliminationFactory()
    const C = new Array(6).fill(0)
    const K = new Array(6).fill(0).map((row) => new Array(6).fill(0))
    const F = new Array(6).fill(0)
    //pairs.forEach( e => {
    for (let { p, q, n } of pairs) {
        const np = n.x * (q.x - p.x) + n.y * (q.y - p.y) + n.z * (q.z - p.z)
        C[0] = q.y * n.z - q.z * n.y
        C[1] = q.z * n.x - q.x * n.z
        C[2] = q.x * n.y - q.y * n.x
        C[3] = n.x
        C[4] = n.y
        C[5] = n.z
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                K[i][j] += C[i] * C[j]
            }
        }
        F[0] -= np * C[0]
        F[1] -= np * C[1]
        F[2] -= np * C[2]
        F[3] -= np * C[3]
        F[4] -= np * C[4]
        F[5] -= np * C[5]
    }
    const Omega = g.solve(K, F)
    return Omega
}
/**
 * Transform source point cloud
 * @param {Object} source, source point cloud
 * @param {Object} rbt, rigid body transformation
 */
function transform(source, Omega) {
    const { vertices } = source
    // translation vector
    const t = [Omega[3], Omega[4], Omega[5]]
    // construct rotation matrix
    const Rx = new Array(3).fill(0).map((row) => new Array(3).fill(0))
    const Ry = new Array(3).fill(0).map((row) => new Array(3).fill(0))
    const Rz = new Array(3).fill(0).map((row) => new Array(3).fill(0))
    const cos0 = Math.cos(Omega[0])
    const sin0 = Math.sin(Omega[0])
    const cos1 = Math.cos(Omega[1])
    const sin1 = Math.sin(Omega[1])
    const cos2 = Math.cos(Omega[2])
    const sin2 = Math.sin(Omega[2])

    Rx[0][0] = 1
    Rx[1][1] = cos0
    Rx[1][2] = -sin0
    Rx[2][1] = sin0
    Rx[2][2] = cos0

    Ry[0][0] = cos1
    Ry[0][2] = sin1
    Ry[1][1] = 1
    Ry[2][0] = -sin1
    Ry[2][2] = cos1

    Rz[0][0] = cos2
    Rz[0][1] = -sin2
    Rz[1][0] = sin2
    Rz[1][1] = cos2
    Rz[2][2] = 1

    const Ryx = new Array(3).fill(0).map((row) => new Array(3).fill(0))
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 3; k++) {
                Ryx[i][j] += Ry[i][k] * Rx[k][j]
            }
        }
    }
    const R = new Array(3).fill(0).map((row) => new Array(3).fill(0))
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 3; k++) {
                R[i][j] += Rz[i][k] * Ryx[k][j]
            }
        }
    }
    //const { R, t } = rbt

    for (let p of source.vertices) {
        const x = R[0][0] * p.x + R[0][1] * p.y + R[0][2] * p.z
        const y = R[1][0] * p.x + R[1][1] * p.y + R[1][2] * p.z
        const z = R[2][0] * p.x + R[2][1] * p.y + R[2][2] * p.z
        p.x = x + t[0]
        p.y = y + t[1]
        p.z = z + t[2]
    }
}
/**
 * Align source point cloud to target point cloud
 * @param {Object} source, source point cloud
 * @param {Object} target, target point cloud
 * @param {Object} kdt, kd-tree of target point cloud
 * @returns void
 */
function align(source, target, kdt) {
    const pairs = findCorrespondences(kdt, source, target)
    const Omega = estimateRigidTransformation(pairs)
    transform(source, Omega)
    source.computeVertexNormals(source)
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