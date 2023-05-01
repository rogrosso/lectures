/**
 * Gauss Elimination
 * Lösung einfacher Gleichungssysteme
 * The implementation is based on the text book 
 * Hans Rudolf Schwarz and Norbert Köckler 
 * Numerische Mathematik 
 * 7., überarbeitete Auflage, 2009
 */
export default function gFactory() {
    let n = 0      // matrix size
    let pIndex = 0 // pivot index
    let sign = 1   // sign to account for rows swap
    const swapRows = (A, i, j) => [A[i], A[j]] = [A[j], A[i]]
    function g(R, b) {
        sign = 1
        for (let c = 0; c < n; c++) { // loop over the columns
            pIndex = c
            for (let i = c + 1; i < n; i++) { // pivot
                if (Math.abs(R[i][c]) > Math.abs(R[pIndex][c])) pIndex = i
            }
            if (Math.abs(R[pIndex][c]) < Number.EPSILON) return false // not invertible
            if (pIndex != c) {
                swapRows(R, c, pIndex)
                swapRows(b, c, pIndex)
                sign *= -1
            }
            for (let i = c + 1; i < n; i++) { // loop over rows
                const lic = R[i][c] / R[c][c]
                for (let j = c + 1; j < n; j++) { // loop over columns
                    R[i][j] -= R[c][j] * lic
                }
                b[i] -= b[c] * lic
                R[i][c] = 0
            }
        }
        return true
    } // Gauss elimination, single equation
    function gM(R, b) {
        sign = 1
        const nr_e = b[0].length
        for (let c = 0; c < n; c++) { // loop over the columns
            pIndex = c
            for (let i = c + 1; i < n; i++) { // pivot
                if (Math.abs(R[i][c]) > Math.abs(R[pIndex][c])) pIndex = i
            }
            if (Math.abs(R[pIndex][c]) < Number.EPSILON) return false // not invertible
            if (pIndex != c) {
                swapRows(R, c, pIndex)
                swapRows(b, c, pIndex)
                sign *= -1
            }
            for (let i = c + 1; i < n; i++) { // loop over rows
                const lic = R[i][c] / R[c][c]
                for (let j = c + 1; j < n; j++) { // loop over columns
                    R[i][j] -= R[c][j] * lic
                }
                for (let e = 0; e < nr_e; e++) b[i][e] -= b[c][e] * lic
                R[i][c] = 0
            }
        }
        return true
    } // Gauss elimination, multiple equations
    function solve_(R, b, x) {
        for (let i = n - 1; i >= 0; i--) {
            x[i] = b[i]
            for (let j = i + 1; j < n; j++) {
                x[i] -= R[i][j] * x[j]
            }
            x[i] = x[i] / R[i][i]
        }
        return true
    } // solve()
    function solveM_(R, b, x) {
        const nr_e = b[0].length
        for (let e = 0; e < nr_e; e++) {
            for (let i = n - 1; i >= 0; i--) {
                x[i][e] = b[i][e]
                for (let j = i + 1; j < n; j++) {
                    x[i][e] -= R[i][j] * x[j][e]
                }
                x[i][e] = x[i][e] / R[i][i]
            }
        }
        return true
    }
    return {
        solve(A, rhs) {
            n = A.length
            const R = new Array(n).fill(0).map((e, i) => [...A[i]])
            const b = rhs.map(e => e)
            if (!g(R,b)) return null
            const x = new Array(n).fill(0)
            solve_(R, b, x)
            return x
        },
        inverse(A) {
            n = A.length
            const R = new Array(n).fill(0).map((e, i) => [...A[i]])
            const b = new Array(n).fill(null).map(e => new Array(n).fill(0))
            const x = new Array(n).fill(null).map(e => new Array(n).fill(0))
            for (let i = 0; i < n; i++) b[i][i] = 1
            if(!gM(R,b)) return null
            solveM_(R, b, x)
            return x
        },
        determinant(A) {
            n = A.length
            const R = new Array(n).fill(0).map((e, i) => [...A[i]])
            let singular = false
            sign = 1
            for (let c = 0; c < n; c++) { // loop over the columns
                pIndex = c
                for (let i = c + 1; i < n; i++) { // pivot
                    if (Math.abs(R[i][c]) > Math.abs(R[pIndex][c])) pIndex = i
                }
                if (Math.abs(R[pIndex][c]) < Number.EPSILON) {
                    singular = true // not invertible
                    break
                }
                if (pIndex != c) {
                    swapRows(R, c, pIndex)
                    sign *= -1
                }
                for (let i = c + 1; i < n; i++) { // loop over rows
                    const lic = R[i][c] / R[c][c]
                    for (let j = c + 1; j < n; j++) { // loop over columns
                        R[i][j] -= R[c][j] * lic
                    }
                    R[i][c] = 0
                }
            }
            if (singular) return null
            let d = 1
            for (let i = 0; i < n; i++) {
                d *= R[i][i]
            }
            return d * sign
        }
    }
} // gaussEliminationFactory()

