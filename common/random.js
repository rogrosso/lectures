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