/* Gauss-Jordan Elimination
 * This is a modified version of an implementation I found in the internet many years ago, 
 * but I do not remember where. The code does pretty much the same processing steps that 
 * you learn in a text book, e.g. the Wikipedia article Gaussian elimination.
 * The implementation uses pivoting, and it is able to handle two dimensional arrays for 
 * the rhs, which might might be useful for solving multiple linear systems at once, which 
 * have the same system matrix but different right hand sides.
 */
export default function gaussEliminationFactory() {
    let n = 0
    let pIndex = 0 // pivot index
    let sign = 1 // sign to account for rows swap
    const swapRows = (A, i, j) => [A[i], A[j]] = [A[j], A[i]]
    const f1 = m => {
        sign = 1
        for (let row = 0; row < n; row++) {
            pIndex = row
            for (let i = row + 1; i < n; i++) { // pivot
                if (Math.abs(m[i][row]) > Math.abs(m[pIndex][row])) pIndex = i
            }
            if (Math.abs(m[row][pIndex]) < Number.EPSILON) return true // not invertible
            if (pIndex != row) {
                swapRows(m, row, pIndex)
                sign *= -1
            }
            for (let i = row + 1; i < n; i++) {
                const s = m[i][row] / m[row][row]
                for (let j = row + 1; j <= n; j++) {
                    m[i][j] -= m[row][j] * s
                }
                m[i][row] = 0
            }
        }
        return false
    } // rowEchelon()
    const s1 = (m, x) => {
        for (let i = n - 1; i >= 0; i--) {
            x[i] = m[i][n]
            for (let j = i + 1; j < n; j++) {
                x[i] -= m[i][j] * x[j]
            }
            x[i] = x[i] / m[i][i]
        }
        return true
    } // solve()
    const fm = (m,b) => {
        sign = 1
        const nr_q = b[0].length
        for (let row = 0; row < n; row++) {
            pIndex = row
            for (let i = row + 1; i < n; i++) { // pivot
                if (Math.abs(m[i][row]) > Math.abs(m[pIndex][row])) pIndex = i
            }
            if (Math.abs(m[row][pIndex]) < Number.EPSILON) return true // not invertible
            if (pIndex != row) {
                swapRows(m, row, pIndex)
                swapRows(b, row, pIndex)
                sign *= -1
            }
            for (let i = row + 1; i < n; i++) {
                const s = m[i][row] / m[row][row]
                for (let j = row + 1; j < n; j++) {
                    m[i][j] -= m[row][j] * s
                }
                for (let e = 0; e < nr_q; e++) {
                    b[i][e] -= b[row][e] * s
                }
                m[i][row] = 0
            }
        }
        return false
    }
    const sm = (m, b, x) => {
        const nr_e = b[0].length
        for (let i = n - 1; i >= 0; i--) {
            for(let e = 0; e < nr_e; e++) {
                x[i][e] = b[i][e]
                for (let j = i + 1; j < n; j++) {
                    x[i][e] -= m[i][j] * x[j][e]
                }
                x[i][e] = x[i][e] / m[i][i]
            }   
        }
        return true
    }
    return {
        gaussElimination(A, b) {
            n = A.length
            if (Array.isArray(b[0])) {
                const m = new Array(n).fill(0).map((e, i) => [...A[i]])
                const nr_e = b[0].length
                const rhs = new Array(n).fill(null).map( (e,i) => [...b[i]])
                const singular = fm(m,rhs)
                if (singular) return null
                const x = new Array(n).fill(null).map( (e,i) => new Array(nr_e).fill(0))
                sm(m, rhs, x)
                return x
            } else { 
                const m = new Array(n).fill(0).map((e, i) => [...A[i], b[i]])
                const singular = f1(m)
                if (singular) return null
                const x = new Array(n).fill(0)
                s1(m, x)
                return x
            }
        },
        inverse(A) {
            n = A.length
            const idM = new Array(n).fill(null).map(e => new Array(n).fill(0))
            for (let i = 0; i < n; i++) idM[i][i] = 1
            return this.gaussElimination(A, idM)
        },
        determinant(A) {
            n = A.length
            const m = new Array(n).fill(0).map((e, i) => [...A[i]])
            let singular = false
            sign = 1
            for (let row = 0; row < n; row++) {
                pIndex = row
                for (let i = row + 1; i < n; i++) { // pivot
                    if (Math.abs(m[i][row]) > Math.abs(m[pIndex][row])) pIndex = i
                }
                if (Math.abs(m[row][pIndex]) < Number.EPSILON) {
                    singular = true // not invertible
                    break
                }
                if (pIndex != row) {
                    swapRows(m, row, pIndex)
                    sign *= -1
                }
                for (let i = row + 1; i < n; i++) {
                    const s = m[i][row] / m[row][row]
                    for (let j = row + 1; j < n; j++) {
                        m[i][j] -= m[row][j] * s
                    }
                    m[i][row] = 0
                }
            }
            let d = 1
            for (let i = 0; i < n; i++) {
                d *= m[i][i]
            }
            return d * sign
        }
    }
} // gaussEliminationFactory()