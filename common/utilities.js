export function dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
}
export function cross(v1, v2) {
    return {
        x: (v1.y * v2.z - v1.z * v2.y),
        y: (v1.z * v2.x - v1.x * v2.z),
        z: (v1.x * v2.y - v1.y * v2.x)
    }
}
export function norm(v) {
    return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2)
}
export function norm2(v) {
    return v.x ** 2 + v.y ** 2 + v.z ** 2
}
export function normalize(v) {
    const s = norm(v) //Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2)
    v.x /= s
    v.y /= s
    v.z /= s 
    return v
}
// non-normalized
export function normal(v0, v1, v2) {
    const e0 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z }
    const e1 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z }
    return cross(e0, e1)
}
export function keyGen(k1, k2) {
    if (k1 > k2) {
        return (BigInt(k1) << 32n) | BigInt(k2)
    }
    else {
        return (BigInt(k2) << 32n) | BigInt(k1)
    }
}
// Cantor pairing function
export function keyCantor(k1, k2) {
    if (k1 > k2) {
      return (k1+k2)*(k1+k2+1)/2 + k2
    }
    else {
      return (k1+k2)*(k1+k2+1)/2 + k1
    }
}

export function isObject(obj) {
    return obj && typeof obj === 'object' && obj.constructor === Object
}
