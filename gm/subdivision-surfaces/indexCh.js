import hybridCube from '../data/hybridCube.json' assert{ type: 'json' }
import quadCube from '../data/quadCube.json' assert{ type: 'json' }
import quadPawn from '../data/quadPawn.json' assert{ type: 'json' }
import quadToroidalTetra from '../data/quadToroidalTetra.json' assert{ type: 'json' }
import quadCube_with_bnd from '../data/quadCube_with_bnd.json' assert{ type: 'json' }
import trisToroidalTetrahedron from "../data/trisToroidalTetrahedron.json" assert { type: "json" }
import trisCube24 from "../data/trisCube24.json" assert { type: "json" }
import trisCube12 from "../data/trisCube12.json" assert { type: "json" }
import trisTetrahedron from "../data/trisTetrahedron.json" assert { type: "json" }
import icosahedron_with_bnd from "../data/icosahedron_with_bnd.json" assert { type: "json" }

const meshes = [
    {name: 'quadCube', m: quadCube},
    {name: 'quadToroidalTetra', m: quadToroidalTetra},
    {name: 'quadPawn', m: quadPawn},
    {name: 'quadCube_with_bnd', m: quadCube_with_bnd},
    {name: 'trisToroidalTetrahedron', m: trisToroidalTetrahedron},
    {name: 'trisCube24', m: trisCube24},
    {name: 'trisCube12', m: trisCube12},
    {name: 'trisTetrahedron', m: trisTetrahedron},
    {name: 'icosahedron_with_bnd',  m: icosahedron_with_bnd}
]

meshes.forEach(m => {
    const fc = []
    m.m.faces.forEach( f => 
    {
        const t = []
        f.forEach(i => t.push(i-1) )
        fc.push(t)
    }) 

    console.log( m.name)
    console.log(fc)
})