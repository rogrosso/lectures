/**
 * Singular Value Decomposition
 * It computes the singular value decomposition of a matrix C. Two methods are implemented.
 * The classical Jacobi algorithm and the algorithm of Golub-Reinsch. We use Householder
 * transformations to reduce the matrix. The implementation is based on the algorithms
 * described in the text books:
 * 1. "Numerische Mathematik" by Hans Rudolf Schwarz and Norbert Köckler, 7th edition, 2009
 * 2. "Numerische Mathematik 2" by Josef Stoer and Roland Bulirsch, 5th edition, 2005
 * Notes:
 * 1. The algorithm is not optimized for speed or memory usage.
 * 2. The implementation of the Golub-Reinsch algorithm is slower than the Jacobi algorithm.
 * 3. The Jacobi algorithm is provably good enough for most of the applications. 
 * 4. The funciton svd() implements the Golub-Reinsch algorithm.
 * 5. The function svdJacobi() implements the Jacobi algorithm. 
 * @param {Array} C - matrix to be decomposed.
 * @returns {Object} - {t, U, V} where U and V are orthogonal matrices and t is
 * is a vector with the singular values, such that C = U * diag(t) * V^t
 */
import jacobiEigenvalueFactory from "./jacobiEigenvalue.js"
export default function grSVDFactory(A) {
    function accumulateU(U, u) {
        const N = U.length
        const U_ = new Array(N).fill(null).map( (e, i) => [...U[i]])
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                let pj = 0
                for (let k = 0; k < N; k++) {
                    pj +=  u[k] * U_[k][j]
                }
                pj = pj + pj
                U[i][j] = U_[i][j] - u[i] * pj
            }
        }
    }
    function updateUC(C, u, l) {
        const N = C.length
        const n = C[0].length
        const C_ = new Array(N).fill(null).map( (e, i) => [...C[i]])
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < n; j++) {
                let pj = 0
                for (let k = 0; k < N; k++) {
                    pj +=  u[k] * C_[k][j]
                }
                pj = pj + pj
                C[i][j] = C_[i][j] - u[i] * pj
            }
        }
        for (let i = l+1; i < N; i++) C[i][l] = 0
    }
    function accumulateV(V, v) {
        const n = V.length
        const V_ = new Array(n).fill(null).map( (e, i) => [...V[i]])
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                let pi = 0
                for (let k = 0; k < n; k++) {
                    pi += V_[i][k] * v[k]
                }
                pi = pi + pi
                V[i][j] = V_[i][j] - pi * v[j]
            }
        }
    }
    function updateCV(C, v, l) {
        const N = C.length
        const n = C[0].length
        const C_ = new Array(N).fill(null).map( (e, i) => [...C[i]])
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < n; j++) {
                let pi = 0
                for (let k = 0; k < n; k++) {
                    pi += C_[i][k] * v[k]
                }
                pi = pi + pi
                C[i][j] = C_[i][j] - pi * v[j]
            }
        }
        for (let i = l+2; i < n; i++) C[l][i] = 0
    }
    function householder(C) {
        const N = C.length
        const n = C[0].length
        const C_ = new Array(N).fill(0).map((e, i) => [...C[i]])
        const U_ = new Array(N).fill(0).map((e, i) => new Array(N).fill(0))
        const V_ = new Array(n).fill(0).map((e, i) => new Array(n).fill(0))
        for (let i = 0; i < N; i++) U_[i][i] = 1
        for (let i = 0; i < n; i++) V_[i][i] = 1
        for (let l = 0; l < n; l++) {
            const u = new Array(N).fill(0)
            // U
            let gamma = 0
            for (let i = l; i < N; i++) gamma += C_[i][l] * C_[i][l]
            gamma = Math.sign(C_[l][l]) * Math.sqrt(gamma)
            let beta = Math.sqrt(2 * gamma * (gamma + C_[l][l]))
            u[l] = (C_[l][l] + gamma) / beta
            for (let k = l+1; k < N; k++) {
                u[k] = C_[k][l] / beta
            }
            accumulateU(U_, u)
            updateUC(C_, u, l)
            // V, (l, l+1)
            if(l >= (n-2)) continue
            const v = new Array(n).fill(0)
            gamma = 0
            for (let i = l+1; i < n; i++) gamma += C_[l][i] * C_[l][i]
            gamma = Math.sign(C_[l][l+1]) * Math.sqrt(gamma)
            beta = Math.sqrt(2 * gamma * (gamma + C_[l][l+1]))
            v[l+1] = (C_[l][l+1] + gamma) / beta
            for (let k = l+2; k < n; k++) {
                v[k] = C_[l][k] / beta
            }
            accumulateV(V_, v)
            updateCV(C_, v, l)
        }
        return {U: U_, V: V_, J: C_}
    } // householder()
    
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
    function orthogonalMatrices(U1_, U2_, V1_, V2_) {
        const N = U1_.length
        const n = V1_.length
        const U = new Array(N).fill(0).map((e, i) => new Array(N).fill(0))
        const V = new Array(n).fill(0).map((e, i) => new Array(n).fill(0))
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                let sum = 0
                for (let k = 0; k < N; k++) {
                    sum += U1_[i][k] * U2_[k][j]
                }
                U[i][j] = sum
            }
        }
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                let sum = 0
                for (let k = 0; k < n; k++) {
                    sum += V1_[i][k] * V2_[k][j]
                }
                V[i][j] = sum
            }
        }
        return {U, V}
    }
    return {
        /**
         * Implements the Golub-Kahan SVD algorithm.
         * @param {Array} C 
         * @returns {Object} {t, U, V}
         */
        svd(C) {
            const {J, U: U1_, V: V1_ } = householder(C)
            const {t, U: U2_, V: V2_} = this.fastSvd(J)
            const {U, V} = orthogonalMatrices(U1_, U2_, V1_, V2_)
            return {t, U, V}
        },
        /**
         * Implements the classical Jacobi SVD algorithm.
         * @param {Array} C
         * @returns {Object} {t, U, V}
         */
        fastSvd(C) {
            const A_ = symmetricMatrix(C)
            const jacobi = jacobiEigenvalueFactory()
            jacobi.sort(false)
            const { l, V } = jacobi.jacobi(A_)
            const { U, t } = multiply(C, V, l)
            return {t, U, V}
        }


    }
}