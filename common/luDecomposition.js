/**
 * LU decomposition via Gauss Elimination
 * The implementation is based on the text book:
 * "Numerische Mathematik" by Hans Rudolf Schwarz and Norbert Köckler, 7., überarbeitete Auflage, 2009
 * Note: LU decomposition is used instead of Gauss Elimination to solve multiple linear systems with 
 * the same coefficient matrix but different righ-hand sides.
 * @returns {Object} LU-decompotion {lu, solve} object
 */
export function luDecompositionFactory() {
    let n = 0      // matrix size
    let pIndex = 0 // pivot index
    let R = undefined
    let P = undefined
    const swapRows = (A, i, j) => [A[i], A[j]] = [A[j], A[i]]
    /**
     * 
     * @param {Array} R the matrix to be decomposed
     * @returns true if the matrix is invertible, false otherwise
     */
    function lu_(R) {
        for (let c = 0; c < n; c++) { // loop over the columns
            pIndex = c
            for (let i = c + 1; i < n; i++) { // pivot
                if (Math.abs(R[i][c]) > Math.abs(R[pIndex][c])) pIndex = i
            }
            if (Math.abs(R[pIndex][c]) < Number.EPSILON) return false // not invertible
            if (pIndex != c) {
                swapRows(R, c, pIndex)
                swapRows(P, c, pIndex)
            }
            for (let i = c + 1; i < n; i++) { // loop over rows
                const lic = R[i][c] / R[c][c]
                for (let j = c + 1; j < n; j++) { // loop over columns
                    R[i][j] -= R[c][j] * lic
                }
                R[i][c] = lic
            }
        }
        return true
    } // LU decomposition
    /**
     * 
     * @param {Array} b right hand side
     * @param {Array} x the solution of the linear system
     * @returns 
     */
    function solve_(b, x) {
        for (let i = 0; i < n; i++) {
            x[i] = b[P[i]]
            for (let k = 0; k < i; k++) {
                x[i] -= R[i][k] * x[k]
            }
        }
        for (let i = n - 1; i >= 0; i--) {
            for (let k = i + 1; k < n; k++) {
                x[i] -= R[i][k] * x[k]
            }
            x[i] /= R[i][i]
        }
        return true
    } // solve()
    return {
        lu(A) {
            n = A.length
            R = new Array(n).fill(0).map((e, i) => [...A[i]])
            P = [...Array(n).keys()]
            return lu_(R)
        },
        solve(b) {
            const x = new Array(n).fill(0)
            const flag = solve_(b, x)
            if (flag) return x
            else return null
        }
    }
} // luDecompositionFactory()

