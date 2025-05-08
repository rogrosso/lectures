console.log('arap.js')

import * as THREE from "../../contrib/three.module.min.js"
import { OrbitControls } from "../../contrib/OrbitControls.js"
import { readOFF, readObj } from "../common/utilities.js"
import { halfedgeFactory } from "../../common/halfedge.js"
import { renderBuffers } from "../../common/renderBuffers.js"
import { sparseCholeskyFactory } from "../../common/sparseChokesky.js"
import { svdFactory } from "../../common/svd.js"
import { taubin } from "../common/smoothing.js"



const markerSource20k = [
    {  r: 0.0224535, index: 19971 },
    {  r: 0.0224535, index: 16491 },
    {  r: 0.0224535, index: 16790 },
    {  r: 0.0224535, index: 13417 },
    {  r: 0.0224535, index: 10111 },
    {  r: 0.0224535, index: 12707 },
    {  r: 0.0224535, index: 11483 },
    {  r: 0.0224535, index: 4544 },
    {  r: 0.0224535, index: 2188 },
    {  r: 0.0224535, index: 13522 },
    {  r: 0.0224535, index: 17589 },
    {  r: 0.0224535, index: 15370 },
    {  r: 0.0224535, index: 8444 },
    {  r: 0.0224535, index: 2456 }
]
const markerTarget20k = [
    { flag: true,  x: 0.683725, y: 0.558210, z: 0.046131, r: 0.0224535, index: 19971 },
    { flag: false, r: 0.0224535, index: 16491 },
    { flag: false, r: 0.0224535, index: 16790 },
    { flag: false, r: 0.0224535, index: 13417 },
    { flag: false, r: 0.0224535, index: 10111 },
    { flag: false, r: 0.0224535, index: 12707 },
    { flag: false, r: 0.0224535, index: 11483 },
    { flag: false, r: 0.0224535, index: 4544 },
    { flag: false, r: 0.0224535, index: 2188 },
    { flag: false, r: 0.0224535, index: 13522 },
    { flag: false, r: 0.0224535, index: 17589 },
    { flag: false, r: 0.0224535, index: 15370 },
    { flag: false, r: 0.0224535, index: 8444 },
    { flag: true, x: -0.163027, y: 0.462262, z: 0.034907, r: 0.0224535, index: 2456 }
]

// global variables
const myCholesky = sparseCholeskyFactory()
let heMesh = null //halfedgeFactory()

const url = '../data/raptor_20k.obj'
//const url = '../data/meshes/raptor_2k.obj'
drawAll(url)

async function drawAll(url) {
    const response = await fetch(url)
    const text = await response.text()
    const { vertices, faces } = readObj(text)
    heMesh = halfedgeFactory(faces, vertices)
    draw(heMesh, markerSource20k, markerTarget20k)
}


function setMarker(markerSource, markerTarget) {
    const alpha = 0.6
    const i = markerTarget.length - 1
    const xs = markerSource[i].x
    const xt = markerTarget[i].x
    markerTarget[i].x = xs + alpha * (xt - xs)
    const ys = markerSource[i].y
    const yt = markerTarget[i].y
    markerTarget[i].y = ys + alpha * (yt - ys)
    const zs = markerSource[i].z
    const zt = markerTarget[i].z
    markerTarget[i].z = zs + alpha * (zt - zs)
}

function prepareMarker(heMesh, markerSource, markerTarget) {
    //const { vertices } = heMesh
    markerSource.forEach( (m, pos) => {
        const index = m.index
        m.x = heMesh.x(index) //vertices[index].x
        m.y = heMesh.y(index) //vertices[index].y
        m.z = heMesh.z(index) //vertices[index].z
        const mt = markerTarget[pos]
        if (!mt.flag) {
            mt.x = heMesh.x(index) //vertices[index].x
            mt.y = heMesh.y(index) //vertices[index].y
            mt.z = heMesh.z(index) //vertices[index].z
        }

    })
}

function setDeformation(markerSource, markerTarget, marker, alpha) {
    for (let i = 0; i < markerSource.length; i++) {
        const xs = markerSource[i].x
        const xt = markerTarget[i].x
        const x = xs + alpha * (xt - xs)
        const ys = markerSource[i].y
        const yt = markerTarget[i].y
        const y = ys + alpha * (yt - ys)
        const zs = markerSource[i].z
        const zt = markerTarget[i].z
        const z = zs + alpha * (zt - zs)
        marker[i].x = x
        marker[i].y = y
        marker[i].z = z
        marker[i].r = markerSource[i].r
    }
}

function draw(heMesh, markerSource, markerTarget) {
    prepareMarker(heMesh, markerSource, markerTarget)
    console.log(`nr. vertices: ${heMesh.vertices.length}, nr. faces: ${heMesh.faces.length}`)
    // init data
    heTransform(heMesh, markerSource, markerTarget)
    const lambda = 0.5
    const mu = -0.52
    for (let i = 0; i < 20; i++) {
        taubin(heMesh, lambda)
        taubin(heMesh, mu)
    }
    // ARAP
    renderAnimation(heMesh, markerSource, markerTarget)
} // draw

// carrie out one iteration of the ARAP algorithm
function arapIteration(heMesh, sVertices, marker, config) {
    const { neighbors, M, rotations, alpha, svd} = config
    estimateRotations(heMesh, sVertices, neighbors, rotations, svd)
    const b = rhs(sVertices, neighbors, rotations, marker, alpha)
    solveCholesky(heMesh, b)
}
// compute the mesh laplacian. 
function meshLaplacian(heMesh, cot_weights) {
    const { vertices, oneRing } = heMesh
    const D = []
    const LU = []
    for (let vi of vertices) {
        const onering = oneRing(vi)
        const nrNeighbors = onering.length
        const aij = new Array(nrNeighbors).fill(null)
        let aii = 0
        if (cot_weights) {
            for (let j = 1; j <= nrNeighbors; j++) {
                const vj = heMesh.v(onering[j % nrNeighbors])
                const vn = heMesh.v(onering[(j + 1) % nrNeighbors])
                const vp = heMesh.v(onering[(j - 1) % nrNeighbors])
                const cot_n = dot(vn, vi, vj) / cross(vn, vi, vj)
                const cot_p = dot(vp, vj, vi) / cross(vp, vj, vi)
                const cw = (cot_n + cot_p) / 2
                aij[j % nrNeighbors] = { index: vj.index, weight: -cw }
                aii += cw
            }
        } else {
            aii =  nrNeighbors
            for (let i = 0; i < nrNeighbors; i++) {
                aij[i] = { index: onering[i], weight: -1 } 
            }
        }
        LU.push(aij)
        D.push({ index: vi.index, weight: aii })
    }
    return { D, LU }
}
// compute the rotation matrices
function estimateRotations(heMesh, sVertices, neighbors, rotations, svd) {
    for (let vi = 0; vi < sVertices.length; vi++) {
        const sp = []
        const tp = []
        neighbors[vi].forEach(n => {
            const vj = n.index
            const v0 = [
                sVertices[vj].x - sVertices[vi].x,
                sVertices[vj].y - sVertices[vi].y,
                sVertices[vj].z - sVertices[vi].z,
            ]
            const v1 = [
                heMesh.x(vj) - heMesh.x(vi),
                heMesh.y(vj) - heMesh.y(vi),
                heMesh.z(vj) - heMesh.z(vi)
            ]
            sp.push(v0)
            tp.push(v1)
        })
        const m = new Array(3).fill(0).map(e => new Array(3).fill(0))
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                let val = 0
                for (let k = 0; k < sp.length; k++) {
                    val += sp[k][i] * tp[k][j]
                }
                m[i][j] = val
            }
        }
        const { U, V } = svd.svd3x3(m) 
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                let mij = 0
                for (let k = 0; k < 3; k++) {
                    mij += V[i][k] * U[j][k]
                }
                rotations[vi][i][j] = mij
            }
        }
    }
}
// compute the right hand side of the linear system
function rhs(vertices, neighbors, rotations, marker, alpha) {
    const b = []
    const nrv = vertices.length
    for (let i = 0; i < nrv; i++) {
        const bi = [0, 0, 0]
        const vi = vertices[i]
        neighbors[i].forEach( n => {
            const j = n.index
            const w = n.weight
            const vj = vertices[j]
            const pos = [vi.x - vj.x, vi.y - vj.y, vi.z - vj.z]
            let bx = 0
            let by = 0
            let bz = 0
            for (let k = 0; k < 3; k++) {
                bx += (rotations[i][0][k] + rotations[j][0][k]) * pos[k]
                by += (rotations[i][1][k] + rotations[j][1][k]) * pos[k]
                bz += (rotations[i][2][k] + rotations[j][2][k]) * pos[k]
            }
            bi[0] += w * bx / 2
            bi[1] += w * by / 2
            bi[2] += w * bz / 2
        })
        b.push({ x: bi[0], y: bi[1], z: bi[2] })
    }
    // constraints
    marker.forEach(m => {
        b[m.index].x += alpha * m.x
        b[m.index].y += alpha * m.y
        b[m.index].z += alpha * m.z
    })
    return b
}
// solve Cholesky
function solveCholesky(heMesh, b) { 
    const n = heMesh.v_length 
    const bx = []
    const by = []
    const bz = []
    for (let i = 0; i < n; i++) {
        bx.push(b[i].x)
        by.push(b[i].y)
        bz.push(b[i].z)
    }
    const X = myCholesky.solve(bx)
    const Y = myCholesky.solve(by)
    const Z = myCholesky.solve(bz)
    //const t3 = performance.now()
    for (let v of heMesh.vertices) {
        v.x = X[v.index]
        v.y = Y[v.index]
        v.z = Z[v.index]
    }
}

//////////////////////////////////// HELPER FUNCTIONS ///////////////////////////////////////////////
function transformVertices(vertices, markerSource, markerTarget) {
    const pos = [0, 0, 0]
    let nrv = 0
    for (let v of vertices) {
        pos[0] += v.x
        pos[1] += v.y
        pos[2] += v.z
        nrv++
    }
    pos[0] /= nrv
    pos[1] /= nrv
    pos[2] /= nrv
    for (let v of vertices) {
        v.x -= pos[0]
        v.y -= pos[1]
        v.z -= pos[2]
    }
    markerSource.forEach(m => {
        m.x -= pos[0]
        m.y -= pos[1]
        m.z -= pos[2]
    })
    markerTarget.forEach(m => {
        m.x -= pos[0]
        m.y -= pos[1]
        m.z -= pos[2]
    })
}
function scaleVertices(vertices, markerSource, markerTarget) {
    let minx = Infinity
    let maxx = -Infinity
    let miny = Infinity
    let maxy = -Infinity
    let minz = Infinity
    let maxz = -Infinity

    for (let v of vertices) {
        minx = Math.min(minx, v.x)
        maxx = Math.max(maxx, v.x)
        miny = Math.min(miny, v.y)
        maxy = Math.max(maxy, v.y)
        minz = Math.min(minz, v.z)
        maxz = Math.max(maxz, v.z)
    }
    const s = Math.max(...[minx, maxx, miny, maxy, minz, maxz].map(Math.abs))
    for (let v of vertices) {
        v.x /= s
        v.y /= s
        v.z /= s
    }
    const rS = 2 * s
    markerSource.forEach(m => {
        m.x /= s
        m.y /= s
        m.z /= s
        m.r /= rS
    })
    markerTarget.forEach(m => {
        m.x /= s
        m.y /= s
        m.z /= s
        m.r /= rS
    })
}

function heTransform({ vertices }, markerSource, markerTarget) {
    transformVertices(vertices, markerSource, markerTarget)
    scaleVertices(vertices, markerSource, markerTarget)
}

function renderAnimation(heMesh, markerSource, markerTarget) {
    // init
    setMarker(markerSource, markerTarget)
    const cot_weights = false 
    const alpha = 10
    const { D, LU } = meshLaplacian(heMesh, cot_weights)
    markerTarget.forEach( m => {
        D[m.index].weight += alpha
    })
    heMesh.computeVertexNormals() 
    const { vertices, normals } = heMesh
    const sVertices = []
    for (let v of vertices) {
        sVertices.push({x: v.x, y: v.y, z: v.z, index: v.index, he: v.he, bnd: v.bnd })
    }
    const nr_v = sVertices.length
    const rotations = []
    const M = []
    const neighbors = []
    for (let i = 0; i < nr_v; i++) {
        rotations.push(new Array(3).fill(0).map(row => new Array(3).fill(0)))
        M.push([i,i, D[i].weight])
        neighbors.push([])
        LU[i].forEach( e => {
            neighbors[i].push( { index: e.index, weight: -e.weight})
            if (i <= e.index) M.push([i, e.index, e.weight])
        })
    }
    
    const marker = []
    markerTarget.forEach(m => marker.push({ x: 0, y: 0, z: 0, index: m.index }))
    const svd = svdFactory()
    const cM = []
    for (let e of M) {
        cM.push({i: e[1], j: e[0], v: e[2]})
    }
    const t0 = performance.now()
    myCholesky.factorization2(nr_v, cM)
    const t1 = performance.now()
    console.log(`Factorization took ${t1 - t0} ms.`)

    const config = {
        alpha,
        D,
        LU,
        neighbors,
        M, 
        rotations,
        svd
    }
    const canvas = threejs_canvas
    const width = 700 //innerWidth
    const height = 400 //innerHeight
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x5d8fb0)
    const camInitPos = new THREE.Vector3(-0.4, 0.3, 1.3)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000)
    camera.position.copy(camInitPos) //set(-0.2, 0.3, 1.3)
    // Light sources
    const light1 = new THREE.PointLight(0xffffff, 1, 100, 1.5)
    light1.position.copy(camInitPos) //set(-0.2, 0.3, 1.3)
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
    window.addEventListener('resize', onWindowResize);

    // controls: camera
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 0.1
    controls.maxDistance = 80
    controls.target.set(0, 0, 0)
    controls.update()
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    }
    const g = new THREE.Group()
    scene.add(g)
    const nFlag = true // compute normals
    const wFlag = false // wireframe
    const bFlag = false // bounding box
    const {
        vBuff,
        nBuff,
        iBuff
    } = renderBuffers(heMesh, nFlag, wFlag, bFlag) 
    // color buffer
    const cBuff = new Array(nr_v * 3).fill(0)
    const grey = 0.8
    const delta = 0.05
    for (let i = 0; i < nr_v; i++)  {
        const r = grey + delta * (2 * Math.random() - 1)
        const g = grey + delta * (2 * Math.random() - 1)
        const b = grey + delta * (2 * Math.random() - 1)
        cBuff[3*i]   = r 
        cBuff[3*i+1] = g
        cBuff[3*i+2] = b
    }
    const defaultColor = new THREE.Color(0x787878) //new THREE.Color(0x049ef4) // new THREE.Color(0x787878)
    const sGeometry = new THREE.BufferGeometry()
    sGeometry.setIndex(iBuff)
    sGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vBuff, 3))
    sGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(nBuff, 3))
    sGeometry.setAttribute('color', new THREE.Float32BufferAttribute(cBuff, 3))
    const sMesh = new THREE.Mesh(sGeometry, new THREE.MeshPhongMaterial({
        color: defaultColor,
        vertexColors: true,
        //flatShading: true,
        specular: 0x111111,
        shininess: 10,
        polygonOffset: true,
        polygonOffsetFactor: 1, // positive value pushes polygon further away
        polygonOffsetUnits: 1
    }))
    const wMesh = new THREE.Mesh( sGeometry, new THREE.MeshBasicMaterial( 
        { color: 0x111111, wireframe: true }))
    g.add(sMesh)
    g.add(wMesh)
    const smColor = new THREE.Color(0xff5050)
    const smSpheres = new THREE.Group()    
    markerSource.forEach(m => {
        const geometry = new THREE.SphereGeometry(1.2 * m.r, 32, 16)
        const mMaterial = new THREE.MeshLambertMaterial({ color: smColor })
        const sSphere = new THREE.Mesh(geometry, mMaterial)
        geometry.translate(m.x, m.y, m.z)
        smSpheres.add(sSphere)
    })
    const tmSpheres = new THREE.Group()
    const tmColor = new THREE.Color(0x3366ff)
    marker.forEach ( m => {
        const geometry = new THREE.SphereGeometry(1.2 * m.r, 32, 16)
        const mMaterial = new THREE.MeshLambertMaterial({ color: tmColor })
        const sSphere = new THREE.Mesh(geometry, mMaterial)
        geometry.translate(m.x, m.y, m.z)
        tmSpheres.add(sSphere)
    })
    scene.add(smSpheres)
    scene.add(tmSpheres)

    // Animation stuff
    const nrIterations = 30
    const da = 1 / (nrIterations - 4)
    let a = 0
    let iter = 0
    function simulation() {
        if (a < 0.999) a += da
        setDeformation(markerSource, markerTarget, marker, a)    
        console.log(` ... iteration ${iter + 1}`)
        arapIteration(heMesh, sVertices, marker, config)
        // update position and normal
        heMesh.computeVertexNormals()
        sGeometry.attributes.position.needsUpdate = true
        sGeometry.attributes.normal.needsUpdate = true
        const sPosition = sGeometry.attributes.position.array
        const sNormal = sGeometry.attributes.normal.array
        for (let v of vertices) {
            const i = v.index
            sPosition[3*i]   = v.x
            sPosition[3*i+1] = v.y
            sPosition[3*i+2] = v.z
        }
        for ( let n of normals) { 
            const i = n.index
            sNormal[3*i]   = n.x
            sNormal[3*i+1] = n.y
            sNormal[3*i+2] = n.z
        }
        while (tmSpheres.children.length) {
            const obj = tmSpheres.children[0]
            obj.geometry.dispose()
            obj.material.dispose()
            tmSpheres.remove(obj)
        }
        marker.forEach ( m => {
            const geometry = new THREE.SphereGeometry(1.2 * m.r, 32, 16)
            const mMaterial = new THREE.MeshLambertMaterial({ color: tmColor })
            const sSphere = new THREE.Mesh(geometry, mMaterial)
            geometry.translate(m.x, m.y, m.z)
            tmSpheres.add(sSphere)
        })
        return 1
    }
    function step() {
        return new Promise((resolve, reject) =>{
            const s = simulation()
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
            iter += s 
        } catch( error ) {
            console.log(error)
        }
    }

    function animate() {
        requestAnimationFrame(animate)
        const pos = camera.position.clone()
        light1.position.set(pos.x, pos.y, pos.z)
        if (iter < nrIterations) {
            doWork()
        }
        render();
    }

    function render() {
        renderer.render(scene, camera);
    }
    animate()
}


const cText = 
`// carrie out one iteration of the ARAP algorithm
function arapIteration(heMesh, sVertices, marker, config) {
    const { neighbors, M, rotations, alpha, svd} = config
    estimateRotations(heMesh, sVertices, neighbors, rotations, svd)
    const b = rhs(sVertices, neighbors, rotations, marker, alpha)
    solveCholesky(heMesh, b)
}
// compute the mesh laplacian. 
function meshLaplacian(heMesh, cot_weights) {
    const { vertices, oneRing } = heMesh
    const D = []
    const LU = []
    for (let vi of vertices) {
        const onering = oneRing(vi)
        const nrNeighbors = onering.length
        const aij = new Array(nrNeighbors).fill(null)
        let aii = 0
        if (cot_weights) {
            for (let j = 1; j <= nrNeighbors; j++) {
                const vj = heMesh.v(onering[j % nrNeighbors])
                const vn = heMesh.v(onering[(j + 1) % nrNeighbors])
                const vp = heMesh.v(onering[(j - 1) % nrNeighbors])
                const cot_n = dot(vn, vi, vj) / cross(vn, vi, vj)
                const cot_p = dot(vp, vj, vi) / cross(vp, vj, vi)
                const cw = (cot_n + cot_p) / 2
                aij[j % nrNeighbors] = { index: vj.index, weight: -cw }
                aii += cw
            }
        } else {
            aii =  nrNeighbors
            for (let i = 0; i < nrNeighbors; i++) {
                aij[i] = { index: onering[i], weight: -1 } 
            }
        }
        LU.push(aij)
        D.push({ index: vi.index, weight: aii })
    }
    return { D, LU }
}
// compute the rotation matrices
function estimateRotations(heMesh, sVertices, neighbors, rotations, svd) {
    for (let vi = 0; vi < sVertices.length; vi++) {
        const sp = []
        const tp = []
        neighbors[vi].forEach(n => {
            const vj = n.index
            const v0 = [
                sVertices[vj].x - sVertices[vi].x,
                sVertices[vj].y - sVertices[vi].y,
                sVertices[vj].z - sVertices[vi].z,
            ]
            const v1 = [
                heMesh.x(vj) - heMesh.x(vi),
                heMesh.y(vj) - heMesh.y(vi),
                heMesh.z(vj) - heMesh.z(vi)
            ]
            sp.push(v0)
            tp.push(v1)
        })
        const m = new Array(3).fill(0).map(e => new Array(3).fill(0))
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                let val = 0
                for (let k = 0; k < sp.length; k++) {
                    val += sp[k][i] * tp[k][j]
                }
                m[i][j] = val
            }
        }
        const { U, V } = svd.svd3x3(m) 
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                let mij = 0
                for (let k = 0; k < 3; k++) {
                    mij += V[i][k] * U[j][k]
                }
                rotations[vi][i][j] = mij
            }
        }
    }
}
// compute the right hand side of the linear system
function rhs(vertices, neighbors, rotations, marker, alpha) {
    const b = []
    const nrv = vertices.length
    for (let i = 0; i < nrv; i++) {
        const bi = [0, 0, 0]
        const vi = vertices[i]
        neighbors[i].forEach( n => {
            const j = n.index
            const w = n.weight
            const vj = vertices[j]
            const pos = [vi.x - vj.x, vi.y - vj.y, vi.z - vj.z]
            let bx = 0
            let by = 0
            let bz = 0
            for (let k = 0; k < 3; k++) {
                bx += (rotations[i][0][k] + rotations[j][0][k]) * pos[k]
                by += (rotations[i][1][k] + rotations[j][1][k]) * pos[k]
                bz += (rotations[i][2][k] + rotations[j][2][k]) * pos[k]
            }
            bi[0] += w * bx / 2
            bi[1] += w * by / 2
            bi[2] += w * bz / 2
        })
        b.push({ x: bi[0], y: bi[1], z: bi[2] })
    }
    // constraints
    marker.forEach(m => {
        b[m.index].x += alpha * m.x
        b[m.index].y += alpha * m.y
        b[m.index].z += alpha * m.z
    })
    return b
}
// solve Cholesky
function solveCholesky(heMesh, b) { 
    const n = heMesh.v_length 
    const bx = []
    const by = []
    const bz = []
    for (let i = 0; i < n; i++) {
        bx.push(b[i].x)
        by.push(b[i].y)
        bz.push(b[i].z)
    }
    const X = myCholesky.solve(bx)
    const Y = myCholesky.solve(by)
    const Z = myCholesky.solve(bz)
    //const t3 = performance.now()
    for (let v of heMesh.vertices) {
        v.x = X[v.index]
        v.y = Y[v.index]
        v.z = Z[v.index]
    }
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