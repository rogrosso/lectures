export function knotVector(n, m, multiplicity, endpointInterpolation, uniformKnot, offset) {
    const t = [0]
    const uk = (flag) => {
        const alpha = 1.5
        if (flag) return 1
        else return 1 + alpha * Math.random()
    }
    if (endpointInterpolation) {
        //for (let i = 1; i <= n+1; i++) {
        for (let i = 1; i <= n; i++) {
            t[i] = t[i-1]
        }
    } else {
        //for (let i = 1; i <= n+1; i++) {
        for (let i = 1; i <= n; i++) {
            t[i] = t[i-1] + uk(uniformKnot)
        }    
    }
    for (let i = n+1; i <= n+offset; i++) {
        t[i] = t[i-1] + uk(uniformKnot)
    }
    for (let i = n+offset+1; i < n+offset+multiplicity; i++) {
        t[i] = t[i-1]
    }
    for (let i = n+offset+multiplicity; i <= m; i++) {
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
export function bSpline(k, i, t, u) {
    let value = 0
    if(k == 0) {
        value = (t[i] <= u && u < t[i + 1]) ? 1 : 0
    } else {
        if(t[i+k] - t[i] === 0) {
            value =  (t[i + k + 1] - u) / (t[i + k + 1] - t[i + 1]) * bSpline(k - 1, i + 1, t, u)
        } else if(t[i + k + 1] - t[i + 1] === 0) {
            value =  (u - t[i]) / (t[i + k] - t[i]) * bSpline(k - 1, i, t, u)
        } else if(t[i + k + 1] - t[i] === 0) {
            value =  0
        } else {
            const a = (u - t[i]) / (t[i + k] - t[i])
            const b = (t[i + k + 1] - u) / (t[i + k + 1] - t[i + 1])
            value = a * bSpline(k - 1, i, t, u) + b * bSpline(k - 1, i + 1, t, u)
        }
    }
    return value
}

export function bSplineN(k, i, t, u) { // no multiple knots allowed
    let value = 0
    if(k == 0) {
        value = (t[i] <= u && u < t[i + 1]) ? 1 : 0
    } else {
        const a = (u - t[i]) / (t[i + k] - t[i])
        const b = (t[i + k + 1] - u) / (t[i + k + 1] - t[i + 1])
        value = a * bSpline(k - 1, i, t, u) + b * bSpline(k - 1, i + 1, t, u)
    }
    return value
}

export function bSplines(degree, t, N) {
    const bsplines = []
    const m = t.length - degree - 1
    for (let i = 0; i < m; i++) {
        const c = []
        const umin = t[i]
        const umax = t[i+degree+1]
        const eps = 1e-10
        const du = (umax-umin - eps) / (N-1) 
        let u = umin
        for (let j = 0; j < N; j++) {
            c.push({x: u, y: bSpline(degree, i, t, u)})
            u += du
        }
        bsplines.push(c)
    }
    return bsplines
}
export function partitionOfUnity(degree, t, N) {
    const m = t.length - degree - 1
    const puCurve = new Array(m * N).fill(0).map( e => { return { x: 0, y: 0 } })
    const dx = (t[m+degree] - t[0]) / (m * N - 1)
    let x = t[0]
    for (let j = 0; j < m * N; j++) {
        puCurve[j].x = x
        for (let i = 0; i < m; i++) {
            if (t[i] <= x && x < t[i+degree+1]) {
                puCurve[j].y += bSpline(degree, i, t, x)
            }
        }
        x += dx
    }
    return puCurve
}

//********************************************************************************************
// deBohr algorithm: recursive
export function deBoorRecursive(points, n, t, k, i, u) {
    if (k === 0) {
      return points[i]
    } else {
        const a = (t[i + n + 1 - k] - u) / (t[i + n + 1 - k] - t[i])
        const b = (u - t[i]) / (t[i + n + 1 - k] - t[i])
        let d0 = deBoorRecursive(n, k - 1, i - 1, t, u, points)
        let d1 = deBoorRecursive(n, k - 1, i, t, u, points)
        return { x: a * d0.x + b * d1.x, y: a * d0.y + b * d1.y }
    }
}
//********************************************************************************************
// deBohr algorithm: iterative
export function deBoorIterative (points, n, t, j, u) {
    const f = []
    for (let i = 0; i <= n; ++i) {
        f.push({ x: points[j-n + i].x, y: points[j-n + i].y })
    }
    for (let k = 1; k <= n; ++k) {
        for (let i = n; i >= k; --i) {
            const a = (t[j + i + 1 - k] - u) / (t[j + i + 1 - k] - t[j + i - n])
            const b = (u - t[j + i - n]) / (t[j + i + 1 - k] - t[j + i - n])
            f[i].x = a * f[i-1].x + b * f[i].x
            f[i].y = a * f[i-1].y + b * f[i].y
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
//********************************************************************************************
// Boehm algorithm
export function boehm(points, n, t, z) {
    const m = points.length
    if (t[n] > z || z > t[m]) {
        return {knot: t, bPoints: points} // z is outside B-Spline's support
    } else { // new know vector
        let j = -1
        let knots = []
        t.forEach( (k,i) => {
            if (z < k && j < 0) {
                j = (i-1)
                knots.push(z)
            }
            knots.push(k)
        })
        const bPoints = new Array(points.length+1).fill(null).map((p, index) => {
            return {
                x: 0, 
                y: 0
            } 
        })
        bPoints.forEach( (p,i) => {
            if (i <= j - n) {
                p.x = points[i].x
                p.y = points[i].y
            } else if (j+1 <= i) {
                p.x = points[i-1].x
                p.y = points[i-1].y
            } else {
                const a = (t[i + n] - z) / (t[i + n] - t[i])
                const b = (z - t[i]) / (t[i + n] - t[i])
                p.x = a * points[i - 1].x + b * points[i].x
                p.y = a * points[i - 1].y + b * points[i].y
            }
        })
        return { knots, bPoints }
    }
} // Boehm()

export function bSplineCurve(points, degree, t, N) {
    const n = degree // just change name
    const m = t.length - n - 1
    const umin = t[n]
    const umax = t[m]
    const eps = 1e-10
    const du = (umax - umin - eps) / (N - 1)
    let u = umin
    const curve = []
    let pos = 0
    //const points = points.map( e => [e.x, e.y] )
    for (let i = 0; i < N; i++) {
        const index = getIndex(pos, u, t, n, m)
        if (index !== undefined) {
            pos = index
            curve.push(deBoorIterative(points, n, t, index, u))
            //curve.push(deBoorRecursive(points, n, t, n, index, u))
        }
        u += du
    }

    return curve
}

//********************************************************************************************
// deBohr algorithm: iterative
export function rationalDeBoor(points, weights, n, t, j, u) {
    const f = []
    const w = []
    for (let i = 0; i <= n; ++i) {
        const weight = weights[j-n+i]
        w.push( weight )
        f.push({x: weight * points[j-n + i].x, y: weight * points[j-n + i].y})
    }
    for (let k = 1; k <= n; ++k) {
        for (let i = n; i >= k; --i) {
            const a = (t[j + i + 1 - k] - u) / (t[j + i + 1 - k] - t[j + i - n])
            const b = (u - t[j + i - n]) / (t[j + i + 1 - k] - t[j + i - n])
            f[i].x = a * f[i-1].x + b * f[i].x
            f[i].y = a * f[i-1].y + b * f[i].y
            w[i] = a * w[i-1] + b * w[i]
        }
    }
    return { x: f[n].x / w[n], y: f[n].y / w[n] }
}
export function nurbsCurve(points, weights, degree, t, N) {
    const n = degree // just change name
    const m = t.length - n - 1
    const umin = t[n]
    const umax = t[m]
    const eps = 1e-10
    const du = (umax - umin - eps) / (N - 1)
    let u = umin
    const curve = []
    let pos = 0
    //const points = points.map( e => [e.x, e.y] )
    for (let i = 0; i < N; i++) {
        const index = getIndex(pos, u, t, n, m)
        if (index !== undefined) {
            curve.push(rationalDeBoor(points, weights, n, t, index, u, ))
        }
        u += du
    }
    return curve
}
