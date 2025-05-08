/**
 * Least Squares Problem:
 * Solves the linear least squares problem using the QR factorization or the normal equations combined
 * with the Cholesky decomposition. If the matrix is square, the QR factorization is used.
 * The Cholesky decomposition is implemented following the algorithm presented in 
 * "Numerische Mathematik" by Hans Rudolf Schwarz and Norbert Köckler, 7. überarbeitete Auflage, 2009
 * The QR factorization is implemented following the algorithm presented in 
 * "Numerische Mathematik" by Hans Rudolf Schwarz and Norbert Köckler, 7. überarbeitete Auflage, 2009
 */
import { choleskyFactory } from './choleskyDecomposition.js'
import { qrDecompositionFactory } from './qrDecomposition.js'

export function leastSquaresFactory() {
    let chol = false
    let m = 0
    let n = 0
    let A = undefined
    let cholesky = undefined
    let qrFactorization = undefined
    let s_ = undefined
    let decomposition = undefined
    function init(M, method="qr") {
        A = M
        m = A.length
        n = A[0].length
        chol = false
        if (m < n) {
            throw new Error("Least Squares: more columns than rows")
        } else {
            if (m === n) method = 'qr'
            if (method === "qr") {
                //const qr_ = qrDecompositionFactory()
                ({ decomposition, solve: s_ } = qrDecompositionFactory())
                decomposition(A)
            } else if (method === "cholesky") {
                chol = true
                const C = new Array(n).fill(0).map(e => new Array(n).fill(0))
                for (let i = 0; i < n; i++) {
                    for (let j = 0; j < n; j++) {
                        for (let k = 0; k < m; k++) {
                            C[i][j] += A[k][i] * A[k][j]
                        }
                    }
                }
                ({decomposition, solve: s_} = choleskyFactory())
                decomposition(C)
                //s_ = cholesky.solve
            }
        }
    }
    function solve(d) {
        let b = undefined
        if (chol) {
            b = new Array(n).fill(0)
            for (let i = 0; i < n; i++) {
                for (let k = 0; k < m; k++) {
                    b[i] += A[k][i] * d[k]
                }
            }
        } else {
            b = [...d]
        }
        return s_(b)
    }
    return {
        // factorize the matrix according to the selected method. 
        // The default method is QR factorization
        // @param {Array} M matrix
        // @param {string} method 'qr' or 'cholesky'
        init,
        // solve the least squares problem
        // @param {Array} d right hand side
        solve
    }
} // leastSquaresFactory()