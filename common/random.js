// create a simple random number generator with seed 
export function random_seed(s) {
    const mask = 0xffffffff;
    let m_w = (123456789 + s) & mask
    let m_z = (987654321 - s) & mask

    return function () {
        m_z = (36969 * (m_z & 65535) + (m_z >>> 16)) & mask
        m_w = (18000 * (m_w & 65535) + (m_w >>> 16)) & mask

        let result = ((m_z << 16) + (m_w & 65535)) >>> 0
        result /= 4294967296
        return result
    }
}

export function easyRandom(s) {
    let seed = s 
    return function() {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483647
    }
}

export function normalRandomFactory(seed, m_, s_) {
    const mu = m_
    const sigma = s_
    const pi2 = 2 * Math.PI
    const random = random_seed(seed)
    return function( ) {
        let u1 = 1 - random()
        let u2 = random()
        const mag = sigma * Math.sqrt(-2 * Math.log(u1))
        const z0 = mag * Math.cos(pi2 * u2) + mu
        const z1 = mag * Math.sin(pi2 * u2) + mu
        return z0
    }
}