/**
 * QR Decomposition using Householder reflections
 * The implementation is based on the text book (chapter 6)
 * "Numerische Mathematik" by Hans Rudolf Schwarz I Norbert Köckler, 7., überarbeitete Auflage, 2009
 * Notes:
 * 1. decompose a matrix A into a product A = QR, where Q is orthogonal and R is upper triangular
 * 2. solve linear systems
 * 3. is commonly used to solve the least squares problem
 * @returns {Object} QR decomposition object
 */
export function qrDecompositionFactory() {
    let N = 0
    let n = 0
    let U_ = undefined
    let t_ = undefined
    /**
     * Householder reflections to compute the QR decomposition
     * @returns true if successful, false otherwise
     */
    function householder() {
        for (let l = 0; l < n; l++) {
            let gamma = 0
            for (let i = l; i < N; i++) gamma += U_[i][l] * U_[i][l]
            gamma = Math.sign(U_[l][l]) * Math.sqrt(gamma)
            const beta = Math.sqrt(2 * gamma * (gamma + U_[l][l]))
            t_[l] = -gamma
            U_[l][l] = (U_[l][l] + gamma) / beta
            for (let k = l+1; k < N; k++) {
                U_[k][l] /= beta
            }
            for (let j = l+1; j < n; j++) {
                let p = 0
                for (let k = l; k < N; k++) {
                    p += U_[k][l] * U_[k][j]
                }
                p = p + p
                for (let i = l; i < N; i++) {
                    U_[i][j] -= p * U_[i][l]
                }
            }
        }
        return true
    }
    /**
     * QR decomposition: compute Q and R
     * @returns {Object} {Q, R}
     */
    function qr_() {
        let Q0 = new Array(N).fill(0).map((e, i) => new Array(N).fill(0))
        let Q1 = new Array(N).fill(0).map((e, i) => new Array(N).fill(0))
        const R = new Array(N).fill(null).map( e => new Array(n).fill(0))
        for (let i = 0; i < n; i++) {
            R[i][i] = t_[i]
            for(let j = i+1; j < n; j++) {
                R[i][j] = U_[i][j]
            }
        }
        for (let i = 0; i < N; i++) Q0[i][i] = 1
        for (let l = (n-1); l >= 0; l--) { 
            for (let i = 0; i < N; i++) Q1[i].fill(0)
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < N; j++) {
                    Q1[i][j] = Q0[i][j]
                    if (i >= l) {
                        for (let k = l; k < N; k++) {
                            Q1[i][j] -= 2 * U_[i][l] * U_[k][l] * Q0[k][j]
                        }
                    }
                }
            }
            [Q0, Q1] = [Q1, Q0]
        }
        return {Q: Q0, R}
    }
    /**
     * Solve linear systems
     * @param {Array} d right hand side
     * @param {Array} x solution
     * @returns true if successful, false otherwise
     */
    function solve_(d, x) {
        for (let l = 0; l < n; l++) {
            let s = 0
            for (let k = l; k < N; k++) {
                s += U_[k][l] * d[k]
            }
            s = s + s
            for (let k = l; k < N; k++) {
                d[k] -= s * U_[k][l]
            }
        }
        for (let i = n - 1; i >= 0; i--) {
            let s = d[i]
            for (let k = i + 1; k < n; k++) {
                s -= U_[i][k] * x[k]
            }
            x[i] = s / t_[i]
        }

        return true
    } // solve()
    return {
        decomposition: (A) => {
            N = A.length
            n = A[0].length
            U_ = new Array(N).fill(0).map((e, i) => [...A[i]])
            t_ = new Array(n).fill(0)
            householder()
        },
        getQR: () => qr_(),
        solve: (d) => {
            const x = new Array(n).fill(0)
            const d_ = Array.from(d)
            if (solve_(d_, x)) {
                return x
            } else {
                return undefined
            }
        }
    }
} // qrDecompositionFactory()