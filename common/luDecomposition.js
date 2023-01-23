/* LU decomposition
 * Original Implementation: https://github.com/KatIsHere/Approximation/blob/master/Linear_equations_solve.cpp
 * from the project Approximation (https://github.com/KatIsHere/Approximation)
 */

export default function luDecompositionFactory() {
    let n = -1
    let m = null // system matrix
    let p = null // pivot matrix
    let s = 1 // sign to account for rows swap

    const swapRows = (A, i, j) => [A[i], A[j]] = [A[j], A[i]]
    const copy = a => {
        const n = a.length
        const b = new Array(n).fill(null)
        for (let i = 0; i < n; i++) {
            b[i] = [...a[i]]
        }
        return b
    }
    return {
        lu(a) {
            n = a.length
            m = new Array(a.length).fill(null).map((e, i) => [...a[i]])
            p = Array.from({ length: n }, (item, index) => index)
            for (let i = 0; i < n; i++) {
                let pValue = 0
                let pIndex = i
                for (let k = i; k < n; k++) {
                    if (Math.abs(m[k][i]) > pValue) {
                        pValue = Math.abs(m[k][i])
                        pIndex = k
                    }
                }
                if (pValue < Number.EPSILON) return false // not invertible
                if (pIndex != i) { // pivoting
                    [p[i],p[pIndex]] = [p[pIndex],p[i]]
                    swapRows(m, i, pIndex)
                    s *= -1
                }
                for (let j = i + 1; j < n; j++) {
                    m[j][i] /= m[i][i]
                    for (let k = i + 1; k < n; k++) {
                        m[j][k] -= m[j][i] * m[i][k]
                    }
                }
            }
            return true
        },
        solve(b) {
            const x = new Array(n).fill(0)
            for (let i = 0; i < n; i++) {
                x[i] = b[p[i]]
                for (let k = 0; k < i; k++) {
                    x[i] -= m[i][k] * x[k]
                }
            }
            for (let i = n - 1; i >= 0; i--) {
                for (let k = i + 1; k < n; k++) {
                    x[i] -= m[i][k] * x[k]
                }
                x[i] /= m[i][i]
            }
            return x
        },
        inverse(a) {
            const m = copy(a)
            this.lu(m)
            const n = m.length
            const aInv = new Array(n).fill(0).map( e => new Array(n).fill(0))
            const b = new Array(n).fill(0)
            for (let i = 0; i < n; i++) {
                b.fill(0)
                b[i] = 1
                const x = this.solve(b)
                x.forEach((e,j) => {
                    aInv[j][i] = e
                })
            }
            return aInv
        }
    }
}
