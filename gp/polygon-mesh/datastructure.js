import * as THREE from "../../contrib/three.module.min.js"
import { OrbitControls } from "../../contrib/OrbitControls.js"
import GUI from "../../contrib/lil-gui.module.min.js"

import { readTextFile } from "../common/utilities.js"
import { halfedgeFactory } from "../../common/halfedge.js"
import { renderBuffers, normalizeMesh } from "../../common/renderBuffers.js"

const urlBunny = '../data/bunny_noBnd.off'
const urlFetility = '../data/fertility_30000.obj'

const fetchGeometry = async (url1, url2) => {
    const [ response1, response2 ] = await Promise.all([
        fetch(url1),
        fetch(url2)
    ]) 
    const  ifs1 = await response1.text().then(text => readTextFile(text))
    const  ifs2 = await response2.text().then(text => readTextFile(text))
    return {
        ifs1,
        ifs2
    }
}

fetchGeometry(urlBunny, urlFetility).then( ifs => draw (ifs) )


function draw(ifs) {
    const { ifs1, ifs2 } = ifs
    const { vertices, faces } = ifs2
    const mesh1 = halfedgeFactory(ifs1.faces, ifs1.vertices)
    const mesh2 = halfedgeFactory(ifs2.faces, ifs2.vertices)
    const buffers1 = renderBuffers(normalizeMesh(mesh1))
    const buffers2 = renderBuffers(normalizeMesh(mesh2))
    render([ {name: 'bunny', buffers: buffers1}, {name: 'fertility', buffers: buffers2 } ])
}
function render(meshes) {
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
    const camInitPos = new THREE.Vector3(0, 1, 2.5)
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

    const mGroup = new THREE.Group()
    mGroup.name = 'model'
    const { iBuff, vBuff } = buffers
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
    //mMesh.translateX(x0)
    //wMesh.translateX(x0)
    
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
    g.add(mGroup)
    g.children[0].children.forEach( (c,index) => {
        c.material.visible = false
    })
} // draw()



const cText = `
/**
 * The function halfedgeFactory() below contains only the 
 * parte related to the construction of a halfedge data structure
 * out of an indexed face set.
 */
function halfedgeFactory(fList, vList) {
    const v_array = []
    const n_array = []
    const f_array = []
    const h_array = []
    const e_array = []

    let boundary_ = false
    vList.forEach((v, index) => { 
        if (v.x === undefined) {
            v_array.push({ 
                index: index, 
                he: -1, 
                x: v[0], 
                y: v[1], 
                z: v[2], 
                bnd: false 
            })
        } else {
            v_array.push({ 
                index: index, 
                he: -1, 
                x: v.x, 
                y: v.y, 
                z: v.z, 
                bnd: false 
            })
        }
    })
    let e_index = 0
    fList.forEach((f, index) => {
        if (isObject(f)) {
            const nr_v = f.nr_v
            let i = 0
            for (let p in f) {
                if (p[0] === 'v') {
                    const he = { 
                        index: e_index + i, 
                        origin: f[p], 
                        face: f.index, 
                        next: e_index + (i+1)%nr_v, 
                        twin: -1 
                    }
                    v_array[f[p]].he = he.index
                    h_array.push(he)
                    i++
                }
            }
            const face = { 
                index: index, 
                he: e_index, 
                v_length: nr_v, 
                bnd: false 
            }
            f_array.push(face)
            e_index += nr_v
        } else {
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
            const face = { index: index, he: e_index, v_length: nr_v, bnd: false }
            f_array.push(face)
            e_index += nr_v
        }
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
    let edge_index = 0
    m_.forEach( (value, key) => {
        const e0 = value.he0
        const e1 = value.he1
        h_array[e0].twin = e1
        if (e1 !== -1) h_array[e1].twin = e0
        const v0 = h_array[e0].origin
        const v1 = h_array[h_array[e0].next].origin
        e_array.push({ index: edge_index, h0: e0, h1: e1, v0: v0, v1: v1 })
        h_array[e0].edge = edge_index
        if (e1 !== -1) h_array[e1].edge = edge_index
        edge_index++
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
        boundary_ = true
    }
    m_.clear()
} // halfedgeFactory()
`


const hlDiv = document.getElementById('hl-code')
if (hlDiv) {
    const hlPre = document.createElement('pre')
    hlDiv.append(hlPre)
    const hlCode = document.createElement('code') 
    hlCode.setAttribute('class', 'language-javascript')
    hlCode.setAttribute('style', 'border: 1px solid #C1BAA9')
    hlCode.innerHTML = cText
    hlPre.append(hlCode)
}