/**
 * Cholesky decomposition of a symmetric positive definite matrix
 * Classical method for solving least squares fit problems
 * The implementation is based on the text book:
 * Hans Rudolf Schwarz and Norbert Köckler 
 * Numerische Mathematik 
 * 7., überarbeitete Auflage, 2009
 */
export default function choleskyFactory() {
    let n = 0
    let L = undefined
    function cholesky(A) {
        L = new Array(n).fill(null)
        for (let k = 0; k < n; k++) L[k] = new Array(k+1).fill(0)
        for (let k = 0; k < n; k++) { // loop over the columns
            if (A[k][k] < 0) return false
            L[k][k] = Math.sqrt(A[k][k])
            for(let i = k+1; i < n; i++) {
                L[i][k] = A[i][k] / L[k][k]
                for (let j = k+1; j <= i; j++) {
                    A[i][j] -= L[i][k] * L[j][k]
                }
            }
        }
        return true
    } // Cholesky decomposition
    
    function solve_(b, x) {
        const c = new Array(n).fill(0)
        for (let i = 0; i < n; i++) {
            let s = b[i]
            for (let j = 0; j < i; j++) {
                s -= L[i][j] * c[j]
            }
            c[i] = s / L[i][i]
        }
        for (let i = n-1; i >= 0; i--) {
            let s = c[i]
            for (let k = i+1; k < n; k++) {
                s -= L[k][i] * x[k]
            }
            x[i] = s / L[i][i]
        }
        return true
    } // solve()
    return {
        decomposition(A) {
            n = A.length
            const R = new Array(n).fill(0).map((e, i) => [...A[i]])
            return cholesky(R)
        },
        solve(b) {
            const x = new Array(n).fill(0)
            solve_(b, x)
            return x
        }
    }
} // gaussEliminationFactory()

