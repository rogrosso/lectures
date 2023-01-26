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
export function normalize(v) {
    const s = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2)
    v.x /= s
    v.y /= s
    v.z /= s 
    return v
}
export function normal(v0, v1, v2) {
    const e0 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z }
    const e1 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z }
    return normalize(cross(e0, e1))
}
export function keyGen(k1, k2) {
    if (k1 > k2) {
        return (BigInt(k1) << 32n) | BigInt(k2)
    }
    else {
        return (BigInt(k2) << 32n) | BigInt(k1)
    }
}