/**
 * Least squares fit of a linear model using Cholesky decomposition
 * to solve the normal equations.
 * The implementation is based on the text book:
 * "Numerische Mathematik" by Hans Rudolf Schwarz and Norbert Köckler, 7., überarbeitete Auflage, 2009 
 */
import choleskyFactory from './choleskyDecomposition.js'

export default function leastSquaresFactory() {
    const cholesky = choleskyFactory()
    /**
     * Least squares fit of a linear model using Cholesky decomposition
     * to solve the normal equations.
     * Notes:
     * 1. Computes the positive definite matrix C = A^T A
     * 2. Computes the right hand side b = A^T d
     * 3. Solves the linear system C x = b using Cholesky decomposition
     * @param {Array} A the matrix of the linear model
     * @param {Array} d the data vector
     * @returns {Array} the solution vector
     * @note the matrix A is not modified
     * @note the data vector d is not modified
     */
    function solve(A, d) {
        const N = A.length
        const n = A[0].length
        const b = new Array(n).fill(0)
        const C = new Array(n).fill(0).map(e => new Array(n).fill(0))
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < n; j++) {
                b[j] += A[i][j] * d[i]
                for (let k = 0; k < n; k++) {
                    C[j][k] += A[i][j] * A[i][k]
                }
            }
        }
        cholesky.decomposition(C)
        const x = cholesky.solve(b)
        return x
    } // solve()
    return {
        solve
    }
} // leastSquaresFactory()