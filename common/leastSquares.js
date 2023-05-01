/**
 * Least squares fit of a linear model using Cholesky decomposition
 * The implementation is based on the text book:
 * Hans Rudolf Schwarz and Norbert Köckler
 * Numerische Mathematik
 * 7., überarbeitete Auflage, 2009 
 */
import choleskyFactory from './choleskyDecomposition.js'

export default function leastSquaresFactory() {
    const cholesky = choleskyFactory()
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