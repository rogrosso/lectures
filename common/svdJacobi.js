/**
 * Singular Value Decomposition
 * It computes the singular value decomposition of a matrix C. This function implements the classical 
 * Jacobi algorithm. The implementation is based on the algorithms
 * described in the text books:
 * 1. "Numerische Mathematik" by Hans Rudolf Schwarz and Norbert Köckler, 7th edition, 2009
 * 2. "Numerische Mathematik 2" by Josef Stoer and Roland Bulirsch, 5th edition, 2005
 * Notes:
 * 1. The algorithm is not optimized for speed or memory usage.
 * 3. The Jacobi algorithm is provably good enough for most of the applications. 
 */
import { jacobiEigenvalueFactory } from "./eigJacobi.js"
/*
 * @param {Array} C - matrix to be decomposed.
 * @returns {Object} - {U, t, V} where U and V are orthogonal matrices and t is
 * is a vector with the singular values, such that C = U * diag(t) * V^t
 */
export function svdJacobiFactory(A) {
    let sortFlag = true
    function symmetricMatrix(C) {
        const N = C.length
        const n = C[0].length
        const A = new Array(n).fill(0).map((e, i) => new Array(n).fill(0))
        for (let i = 0; i < n; i++) {
            for (let j = i; j < n; j++) {
                let sum = 0
                for (let k = 0; k < N; k++) {
                    sum += C[k][i] * C[k][j]
                }
                A[i][j] = sum
                A[j][i] = sum
            }
        }
        return A
    }
    function multiply(C, V, l) {
        const N = C.length
        const n = C[0].length
        const U = new Array(N).fill(0).map((e, i) => new Array(N).fill(0))
        const t = l.map( e => Math.sqrt(e))
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < n; j++) {
                let sum = 0
                for (let k = 0; k < n; k++) {
                    sum += C[i][k] * V[k][j] 
                }
                U[i][j] = sum / t[j]
            }
        }
        orthogonalize(U, n)
        return {t, U}
    }
    // Gram-Schmidt to complete the orthogonalization of U
    function orthogonalize(U, n) {
        const N = U.length
        for (let c = n; c < N; c++) {
            U[c][c] = 1
            const q = new Array(N).fill(0)
            q[c] = 1
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < c; j++) {
                    q[i] -= U[c][j] * U[i][j]
                }
            }
            // normalize
            let sum = 0
            for (let i = 0; i < N; i++) sum += q[i] * q[i]
            sum = Math.sqrt(sum)
            for (let i = 0; i < N; i++) U[i][c] = q[i] / sum
        }
    }
    return {
        /** Soft singular values */
        set sort(flag) {
            sortFlag = flag
        },
        /**
         * Implements the classical Jacobi SVD algorithm.
         * @param {Array} C
         * @returns {Object} {t, U, V}
         */
        jacobi(C) {
            const A_ = symmetricMatrix(C)
            const jacobi = jacobiEigenvalueFactory()
            jacobi.sort = sortFlag
            const { l, V } = jacobi.jacobi(A_)
            const { U, t } = multiply(C, V, l)
            return {U, t, V}
        }


    }
}