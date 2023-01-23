// 3D: this code is a little bit more general, than the 2D Bezier section
const lerp = (s,t,u, p0, p1) =>  ((t-u)*p0 + (u-s)*p1) / (t-s) 
// de Casteljau algorithm for points in d-dimensions
function deCasteljau(points, s, t, u) {
    const b = points.map( e => ( { x: e.x, y: e.y, z: e.z} ))
    const n = points.length - 1;
    for (let j = 1; j <= n; j++) {
        for (let i = 0; i <= n-j; i++) {
            b[i].x = lerp(s,t,u,b[i].x, b[i+1].x)
            b[i].y = lerp(s,t,u,b[i].y, b[i+1].y)
            b[i].z = lerp(s,t,u,b[i].z, b[i+1].z)
        }
    }
    return b[0]
}
// tensor product de Casteljau for surfaces in 3D
export function deCasteljauTP( points, s0, s1, t0, t1, u, v ) {
    const iSize = points.length
    const c = []
    for (let i = 0; i < iSize; i++) {
        const p = points[i].map( e => ( {x: e.x, y: e.y, z: e.z} ))
        c.push(deCasteljau(p, t0, t1, v))
    }
    return deCasteljau(c, s0, s1, u)
}
// degree elevation of Bezier curve in 3D
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
        for (let j = 0; j < jSize; j++) row.push({x: patch[i][j].x, y: patch[i][j].y, z: patch[i][j].z})
        const b = degreeElevation(row)
        for (let j = 0; j < (jSize+1); j++) ePatch[i][j] = b[j]
    }
    for (let j = 0; j < (jSize+1); j++) {
        const col = []
        for (let i = 0; i < iSize; i++) col.push({x: ePatch[i][j].x, y: ePatch[i][j].y, z: ePatch[i][j].z})
        const b = degreeElevation(col)
        for (let i = 0; i < (iSize+1); i++) ePatch[i][j] = b[i]
    }
    return ePatch
}
export function degreeElevationPatches(patches) {
    const ePatches = []
    for(let key in patches) {
        const patch = patches[key]
        ePatches.push(degreeElevationTP(patch))
    }
    return ePatches
}

// deBoor algorithm
function deBoor(points,n,t,j,u) {
    const f = []
    for (let i = 0; i <= n; ++i) {
        f.push({ x: points[j-n + i].x, y: points[j-n + i].y, z: points[j-n + i].z })
    }
    for (let k = 1; k <= n; ++k) {
        for (let i = n; i >= k; --i) {
            const a = (t[j + i + 1 - k] - u) / (t[j + i + 1 - k] - t[j + i - n])
            const b = (u - t[j + i - n]) / (t[j + i + 1 - k] - t[j + i - n])
            f[i].x = a * f[i-1].x + b * f[i].x
            f[i].y = a * f[i-1].y + b * f[i].y
            f[i].z = a * f[i-1].z + b * f[i].z
        }
    }
    return f[n]
}
function getIndex (pos,u,knot,n,m) { 
    let index = 0
    for (let i = pos; i < m; i++) {
        if (knot[i] <= u && u < knot[i+1]) {
            return i
        } else if (u === knot[m] && knot[m-1] != knot[m]) {
            return m-1
        }
    }
    return undefined
}
export function deBoorTP(points, n, m, s, t, i, j, u, v) {
    const N = points.length
    const M = points[0].length
    const c = []
    for (let k = 0; k < N; k++) {
        const p = []
        points[k].forEach( e => {
            p.push( { x: e.x, y: e.y, z: e.z } )
        })
        c.push(deBoor(p, m, t, j, v))
    }
    return deBoor(c, n, s, i, u)
}
function boehmKnotVector(n, m, t, z) {
    if (t[n] > z || z > t[m]) {
        return [...t]
    } else { 
        let j = -1
        let knots = []
        t.forEach( (k,i) => {
            if (z < k && j < 0) {
                j = (i-1)
                knots.push(z)
            }
            knots.push(k)
        })
        return { index: j, newKnots: knots }
    }
}
function boehm(points, n, t, j, z) {
    const m = points.length
    const bPoints = new Array(points.length+1).fill(null).map((p, index) => ({x: 0, y: 0,z: 0}))
    bPoints.forEach( (p,i) => {
        if (i <= j - n) {
            p.x = points[i].x
            p.y = points[i].y
            p.z = points[i].z
        } else if (j+1 <= i) {
            p.x = points[i-1].x
            p.y = points[i-1].y
            p.z = points[i-1].z
        } else {
            const a = (t[i + n] - z) / (t[i + n] - t[i])
            const b = (z - t[i]) / (t[i + n] - t[i])
            p.x = a * points[i - 1].x + b * points[i].x
            p.y = a * points[i - 1].y + b * points[i].y
            p.z = a * points[i - 1].z + b * points[i].z
        }
    })
    return bPoints 
} // Boehm()
function boehmTP(points, n, m, s, t, indexS, indexT, ns, nt) {
    const N = points.length
    const M = points[0].length
    const rPoints = []
    for (let i = 0; i < N; i++) {
        rPoints.push(boehm(points[i], n, s, indexS, ns))
    }
    const cPoints = []
    for (let j = 0; j <= M; j++) {
        const col = []
        for (let i = 0; i < N; i++) {
            col.push({ x: rPoints[i][j].x, y: rPoints[i][j].y, z: rPoints[i][j].z})
        }
        cPoints.push(boehm(col, m, t, indexT, nt))
    }
    return cPoints
}
export function boehmPatches(patches, ns, nt) {
    const ePatches = []
    for(let key in patches) {
        const {patch, n, m, s, t} = patches[key]
        const N = patch.length
        const M = patch[0].length
        const { index: indexS, newKnots: newS } = boehmKnotVector(n, N, s, ns)
        const { index: indexT, newKnots: newT } = boehmKnotVector(m, M, t, nt)
        ePatches.push({
            patch: boehmTP(patch, n, m, s, t, indexS, indexT, ns, nt),
            n: n,
            m: m,
            s: newS,
            t: newT 
        })
    }
    return ePatches
}
// compute mesh to be rendered with threejs
export function tessellation(patches, level) {
    const mesh = {}
    for (let key in patches) {
        const patch = {}
        const controlPoints = patches[key]
        const iSize = controlPoints.length
        const jSize = controlPoints[0].length
        const nx = iSize * level
        const ny = jSize * level
        const vertices = []
        const faces = []
        const s0 = 0
        const s1 = 1
        const t0 = 0
        const t1 = 1
        const du = 1 / (nx - 1)
        const dv = 1 / (ny - 1)
        let u = 0
        for (let i = 0; i < nx; i++) {
            let v = 0
            for (let j = 0; j < ny; j++) {
                const p = deCasteljauTP(controlPoints, s0, s1, t0, t1, u, v)
                vertices.push(p.x, p.y, p.z)
                v += dv
            }
            u += du
        }
        for (let j = 0; j < ny - 1; j++) {
            for (let i = 0; i < nx - 1; i++) {
                const i0 = j * nx + i
                const i1 = j * nx + i + 1
                const i2 = (j + 1) * nx + i
                const i3 = (j + 1) * nx + i + 1
                faces.push(i0, i1, i3)
                faces.push(i0, i3, i2)
            }
        }
        patch["iSize"] = iSize
        patch["jSize"] = jSize
        patch["controlPoints"] = controlPoints
        patch["nx"] = nx
        patch["ny"] = ny
        patch["vertices"] = vertices
        patch["faces"] = faces
        mesh[key] = patch
    }
    return mesh
}
export function bSplineTessellation(patches, level) {
    const mesh = {}
    for (let key in patches) {
        const { patch: controlPoints, n, m, s , t } = patches[key]
        const N = controlPoints.length
        const M = controlPoints[0].length
        const nx = N * level // mesh size in u
        const ny = M * level // mesh size in v
        const vertices = []
        const faces = []
        const s0 = s[n]
        const s1 = s[N]
        const t0 = t[m]
        const t1 = t[M]
        const eps = 1e-10
        const du = (s1 - s0 - eps) / (nx - 1)
        const dv = (t1 - t0 - eps) / (ny - 1)
        let u = s0
        let posx = n
        for (let i = 0; i < nx; i++) {
            const iIndex = getIndex(posx, u, s, n, N)
            if (iIndex === undefined) continue
            posx = iIndex
            let v = t0
            let posy = m
            for (let j = 0; j < ny; j++) {
                const jIndex = getIndex(posy, v, t, m, M)
                if (jIndex === undefined) continue
                posy = jIndex
                const p = deBoorTP(controlPoints, n, m, s, t, iIndex, jIndex, u, v)
                vertices.push(p.x, p.y, p.z)
                v += dv
            }
            u += du
        }
        for (let j = 0; j < ny - 1; j++) {
            for (let i = 0; i < nx - 1; i++) {
                const i0 = j * nx + i
                const i1 = j * nx + i + 1
                const i2 = (j + 1) * nx + i
                const i3 = (j + 1) * nx + i + 1
                faces.push(i0, i1, i3)
                faces.push(i0, i3, i2)
            }
        }
        mesh[key] = {
            iSize: N,
            jSize: M,
            controlPoints: controlPoints,
            nx: nx,
            ny: ny,
            vertices: vertices,
            faces: faces
        }
    }
    return mesh
}
// patches must 
export function computePatches(teapot, vertices) {
    const patches = []
    // switch coordinates {y,z} to {z,-y} to fit with OpenGL coord. system
    teapot.forEach((p) => {
        const iSize = p.length
        const jSize = p[0].length
        const patch = [...Array(iSize)].map((e) => new Array(jSize))
        for (let i = 0; i < iSize; i++) {
            for (let j = 0; j < jSize; j++) {
                const v = vertices[p[i][j]]
                patch[i][j] = {x: v[0], y: v[2], z: -v[1] } //vertices[p[i][j]]
            }
        }
        patches.push(patch)
    })
    return patches
}

function knotVector(n, m, endpointInterpolation, uniformKnot) {
    const t = [0]
    const uk = (flag) => {
        const alpha = 1.5
        if (flag) return 1
        else return 1 + alpha * Math.random()
    }
    if (endpointInterpolation) {
        for (let i = 1; i <= n; i++) {
            t[i] = t[i-1]
        }
    } else {
        for (let i = 1; i <= n; i++) {
            t[i] = t[i-1] + uk(uniformKnot)
        }    
    }
    for (let i = n+1; i <= m; i++) {
        t[i] = t[i-1] + uk(uniformKnot)
    }
    if (endpointInterpolation) {
        for (let i = m+1; i <= m+n; i++) {
            t[i] = t[i-1]
        }
    } else {
        for (let i = m; i <= m+n; i++) {
            t[i] = t[i-1] + uk(uniformKnot)
        }
    }
    return t
}

export function computeBSplinePatches({patches,vertices}, n, m) {
    const bsPatches = []
    patches.forEach( p => {
        const N = p.length
        const M = p[0].length
        const s = knotVector(n, N, true, true)
        const t = knotVector(m, M, true, true)
        const iSize = N // just a different name
        const jSize = M // just a different name
        const patch = [...Array(iSize)].map((e) => new Array(jSize))
        for (let i = 0; i < iSize; i++) {
            for (let j = 0; j < jSize; j++) {
                const v = vertices[p[i][j]]
                patch[i][j] = {x: v[0], y: v[2], z: -v[1] } 
            }
        }
        bsPatches.push({
            patch, // control points
            n, // degree in u-direction
            m, // degree in v-direction
            s, // knot vector in u-direction
            t  // knot vector in v-direction
        })
    })

    return bsPatches
}

export function readUthaTeapot(teapot) {
    const patches = {}
    const corpus = ['C1','C2','C3','L1','L2']
    const handles = ['H1','H2','S1','S2']
    // construct corpus of teapot
    corpus.forEach (key => {
        let a = Math.PI / 2
        for (let i = 0; i < 3; i++) {
        const rot = [
            [Math.cos(a), -Math.sin(a), 0],
            [Math.sin(a),  Math.cos(a), 0],
            [          0,            0, 1],
        ]
        const iPatch = []
        const nPatch = []
        teapot[key].forEach ( row => {
            const iRow = []
            const nRow = []
            row.forEach( p => {
            const x = rot[0][0] * (p.x - 0.5) + rot[0][1] * p.y + rot[0][2] * p.z + 0.5
            const y = rot[1][0] * (p.x - 0.5) + rot[1][1] * p.y + rot[1][2] * p.z
            const z = rot[2][0] * (p.x - 0.5) + rot[2][1] * p.y + rot[2][2] * p.z
            iRow.push({x: p.x, y: p.y, z: p.z})
            nRow.push({x:x,y:y,z:z})
            })
            iPatch.push(iRow)
            nPatch.push(nRow)
        })
        // update list of patches
        patches[key] = iPatch
        patches[key+'_'+(i+1)] = nPatch
        a += Math.PI / 2
        }
    })
    // compute handles
    handles.forEach( key => {
        const iPatch = []
        const nPatch = []
        teapot[key].forEach( row => {
        const iRow = []
        const nRow = []
        row.forEach( p => {
            iRow.push({x: p.x, y: p.y, z: p.z})
            nRow.push({x: p.x, y: -p.y, z: p.z})
        })
        iPatch.push(iRow)
        nPatch.push(nRow)
        })
        patches[key] = iPatch
        patches[key+'_reflection'] = nPatch
    })
    // transformation: rotate the teapot about the x-axis
    const a = Math.PI / 2
    const rot = [
        [1,          0,             0],
        [0, Math.cos(a), -Math.sin(a)],
        [0, Math.sin(a),  Math.cos(a)]
    ]
    for (let key in patches) {
        patches[key].forEach( (row,i) => {
        row.forEach( (p,j) => {
            const x = rot[0][0] * p.x + rot[0][1] * p.y + rot[0][2] * p.z;
            const y = rot[1][0] * p.x + rot[1][1] * p.y + rot[1][2] * p.z;
            const z = rot[2][0] * p.x + rot[2][1] * p.y + rot[2][2] * p.z;
            p.x = x - 0.5
            p.y = y 
            p.z = z
        })
        })
    }

    return patches
}