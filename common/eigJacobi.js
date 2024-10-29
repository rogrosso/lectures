
/**
 * Jacobi eigenvalue algorithm: Computes the eigenvalues for a symmetric matrix
 * The implementation is based on the algorithm given in 
 * chapter 5, section 5.2 of the text book 
 * "Numerische Mathematik" by Hans Rudolf Schwarz and Norbert Köckler, 7., überarbeitete Auflage, 2009
 * We use the formulas 5.12 and 5.13 for the rotations. The function returns 
 * the eigenvalues and eigenvectors sorted from smallest to largest eigenvalue of
 * an orthogonal matrix, such that V^t * A * V = diag(l_1, ..., l_n). The matrix V
 * contains the eigenvectors as columns. The eigenvalues can be sorted from smallest to largest.
 * @returns {Object} eigenvalues and eigenvectors object
 */
export function jacobiEigenvalueFactory() {
    let A_ = undefined
    let U_ = undefined
    let l_ = undefined
    let V_ = undefined
    let n = 0
    let eps = 1e-12
    let maxIter = 100 // maximum number of iterations
    let sort_ = 'desc' // true if the eigenvalues are sorted
    
    /**
     * Find pair of indices p and q such that |A[p][q]| is maximal
     * @returns {Object} object with indices p and q
     */
    const findIndexPair = () => {
        let p = 1
        let q = 0
        for(let i = 0; i < (n-1); i++) {
            for(let j = i+1; j < n; j++) {
                if (Math.abs(A_[i][j]) > Math.abs(A_[p][q])) {
                    p = i
                    q = j
                }
            }
        }
        return {p, q}
    }
    /**
     * Sorts the eigenvalues and eigenvectors
     */
    const sortEigenvalues = () => {
        l_ = new Array(n).fill(0)
        V_ = new Array(n).fill(null).map(e => new Array(n).fill(0))
        const l = []
        for (let i = 0; i < n; i++) {
            l.push({ index: i, value: A_[i][i] })
        }
        if (sort_ === 'asc') {
            l.sort((a, b) => a.value - b.value)
        } else if (sort_ === 'desc') {
            l.sort((a, b) => b.value - a.value)
        }
        for (let i = 0; i < n; i++) {
            l_[i] = l[i].value
            for (let j = 0; j < n; j++) {
                V_[j][i] = U_[j][l[i].index]
            }
        }
    }
    /**
     * Computes the eigenvalues and eigenvectors of a symmetric matrix
     * The methods uses the Jacobi algorithm based on Given rotations
     * @returns {Object} eigenvalues and eigenvectors object
     */
    function solve() {
        for (let iter = 0; iter < maxIter; iter++) {
            const {p, q} = findIndexPair()
            const theta = (A_[q][q] - A_[p][p]) / (2 * A_[p][q])
            const t = theta > 0 ? 1 / (theta + Math.sqrt(1 + theta * theta)) : 1 / (theta - Math.sqrt(1 + theta * theta))
            const c = 1 / Math.sqrt(1 + t * t)
            const s = t * c
            for (let j = 0; j < n; j++) {
                const tmp = A_[p][j]
                A_[p][j] = c * tmp - s * A_[q][j]
                A_[q][j] = s * tmp + c * A_[q][j]
            }
            for (let i = 0; i < n; i++) {
                const tmp = A_[i][p]
                A_[i][p] = c * tmp - s * A_[i][q]
                A_[i][q] = s * tmp + c * A_[i][q]
            }
            for (let i = 0; i < n; i++) {
                const tmp = U_[i][p]
                U_[i][p] = c * tmp - s * U_[i][q]
                U_[i][q] = s * tmp + c * U_[i][q]
            }
            let S = 0
            for (let i = 0; i < (n-1); i++) {
                for (let j = i+1; j < n; j++) {
                    S += A_[i][j] * A_[i][j]
                }
            }
            if (S < eps) {
                if (sort_ !== 'unsorted') sortEigenvalues()
                return {l: l_, V: V_}
            } 
        }
        // if you reach this point, the algorithm did not converge
        throw new Error(`Jacobi algorithm did not converge in ${maxIter} iterations`)
    }
    return {
        jacobi(A) {
            n = A.length
            A_ = A.map( e => [...e])
            U_ = new Array(n).fill(null).map( e => new Array(n).fill(0))
            for (let i = 0; i < n; i++) U_[i][i] = 1
            return solve()
        },
        set sortOrder(f) { 
            if (f === 'asc' || f === 'desc' || f === 'unsorted') {
                sortFlag = f
            }
        }
    }
}