export function deCasteljau(points, s, t, u) {
    const b = points.map( e => { return { x: e.x, y: e.y} } )
    const n = points.length - 1;
    for (let j = 1; j <= n; j++) {
        for (let i = 0; i <= n-j; i++) {
            b[i].x = ((t-u) * b[i].x + (u-s) * b[i+1].x) / (t-s)
            b[i].y = ((t-u) * b[i].y + (u-s) * b[i+1].y) / (t-s)
        }
    }
    return b[0]
}

export function degreeElevation(points) {
    const n = points.length - 1
    const b = []
    b.push({x: points[0].x, y: points[0].y, drag: true, id: 4, name: 'b*0', level: 1})
    for (let i = 1; i <= n; ++i)
    {
        b.push( {
           x: i / (n+1) * points[i-1].x + (1 - i/(n+1)) * points[i].x,
           y: i / (n+1) * points[i-1].y + (1 - i/(n+1)) * points[i].y,
           id: 4 + i,
           name: 'b*'+ i,
           level: 1
        })
    }
    b.push({ x: points[n].x, y: points[n].y, id: 4 + n + 1, name: 'b*' + (n+1), level: 1 })

    return b
}

export function continuity(b, c, cond) {
    if (cond.c0 === true) {
        c[0].x = b[3].x
        c[0].y = b[3].y
    }
    const r = cond.r
    const s = cond.s
    const t = cond.t
    if (cond.c1 === true) {
        c[1].x = (s - t) / (s - r) * b[2].x + (t - r) / (s - r) * b[3].x
        c[1].y = (s - t) / (s - r) * b[2].y + (t - r) / (s - r) * b[3].y
    }
    if (cond.c2 === true) {
        const r = cond.r
        const s = cond.s
        const t = cond.t
        const t1x = (s - t) / (s - r) * b[1].x + (t - r) / (s - r) * b[2].x
        const t1y = (s - t) / (s - r) * b[1].y + (t - r) / (s - r) * b[2].y
        const t2x = (s - t) / (s - r) * b[2].x + (t - r) / (s - r) * b[3].x
        const t2y = (s - t) / (s - r) * b[2].y + (t - r) / (s - r) * b[3].y
        c[2].x = (s - t) / (s - r) * t1x + (t - r) / (s - r) * t2x
        c[2].y = (s - t) / (s - r) * t1y + (t - r) / (s - r) * t2y
    }
}

export function bezierCurve(points, s, t, N) {
    const dt = (t - s) / (N - 1)
    let u = s
    const curve = []
    for (let i = 0; i < N; i++) {
        curve.push(deCasteljau(points, s, t, u))
        u += dt
    }
    return curve
}

export function rationalDeCasteljau(points, weights, s, t, u) {
    const w = weights.map( e => e )
    const b = points.map( (p,i) => { return {x: w[i] * p.x, y: w[i] * p.y} } ) //[]
    const n = points.length - 1;
    for (let j = 1; j <= n; j++) {
        for (let i = 0; i <= n-j; i++) {
            b[i].x = ((t-u) * b[i].x + (u-s) * b[i+1].x) / (t-s)
            b[i].y = ((t-u) * b[i].y + (u-s) * b[i+1].y) / (t-s)
            w[i] = ((t-u) * w[i] + (u-s) * w[i+1]) / (t-s)
      }
    }
    return { x: b[0].x / w[0], y: b[0].y / w[0] }
}

export function rationalBezierCurve(points, weights, t0, t1, N) {
    const dt = (t1 - t0) / (N - 1)
    let u = t0
    const curve = []
    for (let i = 0; i < N; i++) {
        curve.push(rationalDeCasteljau(points, weights, t0, t1, u))
        u += dt
    }
    return curve
}