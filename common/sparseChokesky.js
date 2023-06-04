
/**
 * Sparse Cholesky factorization of a symmetric positive definite matrix A = LL^T
 * Implementation based of the books:
 * 1. "Algorithms for Sparse Linear Systems" by Jennifer Scott and Miroslav Tuma
 * 2. "Numerische Mathematik 1" by Josef Stoer
 * 3. The Wikipedia article "Cholesky decomposition"
 * Notes:
 * 1. The algorithm is not optimized for speed or memory usage.
 * 2. The function factorization() implements the algorithm presented in the Wikipedia article for the numeric factorization.
 * 3. The function factorization2() implements the algorithm presented in the book "Numerische Mathematik 1" for the numeric factorization.
 * @returns a sparse Cholesky factorization object
 */
export default function sparseCholeskyFactory2() {
    let A = undefined
    let n = 0
    let L = undefined
    let l = undefined
    let LT = undefined
    let d = undefined
    function setMatrix(sz,M) {
        n = sz
        A = M
    }
    function graph() { // row matrix for elimination tree and symbolic factorization
        const G = new Array(n).fill(null).map(() => [])
        for (let e of A) {
            if (e.i > e.j) G[e.i].push(e.j)
        }
        for (let i = 0; i < n; i++) {
            G[i].sort((a,b) => a - b)
        }
        return G
    }
    function eliminationTree() {
        const G = graph()
        const parent = new Array(n).fill(0)
        const ancestor = new Array(n).fill(0)
        for (let i = 0; i < n; i++) {
            parent[i] = -1
            ancestor[i] = -1
            for (let j of G[i]) {
                let jroot = j
                while (ancestor[jroot] !== -1 && ancestor[jroot] !== i) {
                    const l = ancestor[jroot]
                    ancestor[jroot] = i
                    jroot = l
                }
                if (ancestor[jroot] === -1) {
                    ancestor[jroot] = i
                    parent[jroot] = i
                }
            }
        }
        return { G, parent }
    }
    /**
     * Implements the symbolic factorization algorithm presented in the book
     * "Algorithms for Sparse Linear Systems" by Jennifer Scott and Miroslav Tuma.
     * @returns adjacency graph of the symbolic Cholesky factorization
     */
    function symbolicFactorization() {
        const { G, parent } = eliminationTree()
        L = new Array(n).fill(null).map( e => [])
        const mark = new Array(n).fill(-1)
        for (let i = 0; i < n; i++) {
            const row = L[i]
            mark[i] = i
            for (let k of G[i]) {
                let j = k
                while(mark[j] !== i) {
                    mark[j] = i
                    row.push(j)
                    j = parent[j]
                }
            }
        }
        for (let e of L) e.sort((a,b) => a - b)
        return L
    }
    /**
     * Sparse Cholesky left-looking factorization, 
     * based on the algorithm presented at the Wikipedia article "Cholesky decomposition"
     * @returns true if factorization succeeded
     */
    function numericFactorization() {
        for (let i = 0; i < n; i++) {
            L[i].push(i) // add diagonal element
        }
        d = new Array(n).fill(null).map((e,i) => [])
        l = new Array(n).fill(null).map((e,i) => new Map())
        for (let i = 0; i < n; i++) {
            for (let e of L[i]) {
                l[i].set(e, d[i].length)
                d[i].push(0)
            }
        }
        const a = new Array(n).fill(null).map((e,i) => [])
        const m = new Array(n).fill(null).map((e,i) => new Map())
        for (let e of A) {
            m[e.i].set(e.j, a[e.i].length)
            a[e.i].push(e.v)
        }
        for (let i = 0; i < n; i++) {
            const ni = L[i].length
            for (let e0 = 0; e0 < ni; e0++) { 
                const j = L[i][e0]
                const nj = L[j].length
                let sum = 0
                for (let e1 = 0; e1 < nj-1; e1++) {
                    const ik = l[i].get(L[j][e1])
                    if (ik !== undefined) {
                        sum += d[i][ik] * d[j][e1]
                    }
                }
                if (i === j) {
                    const aii = a[i][m[i].get(i)] - sum
                    if (aii <= 0) return false
                    d[i][ni-1] = Math.sqrt(aii)
                } else {
                    const aij = m[i].get(j)
                    if (aij !== undefined) {
                        d[i][e0] = (a[i][aij] - sum) / d[j][nj-1]
                    } else {
                        d[i][e0] -= sum / d[j][nj-1]
                    }
                }
            }
        }
        LT = new Array(n).fill(null).map(() => [])
        for (let i = 0; i < n; i++) {
            for (let j of L[i]) {
                LT[j].push(i)
            }
        }
        return true
    }
    /**
     * Sparse Cholesky: Standard factorization algorithm (left looking)
     * based on the algorithm presented in the book 
     * "Numerische Mathematik" by Hans Rudolf Schwarz and Norbert Köckler, 7. überarbeitete Auflage, 2009
     * Note: This algorithm is slightly slower as the previous one
     * @returns true if factorization succeeded
     */
    function numericFactorization2() {
        for (let i = 0; i < n; i++) {
            L[i].push(i) // add diagonal element
        }
        d = new Array(n).fill(null).map((e,i) => [])
        l = new Array(n).fill(null).map((e,i) => new Map())
        const a = new Array(n).fill(null).map((e,i) => [])
        const C = new Array(n).fill(null).map((e,i) => [])
        for (let i = 0; i < n; i++) {
            for (let e of L[i]) {
                l[i].set(e, d[i].length)
                d[i].push(0)
                a[i].push(0)
                C[e].push(i)
            }
        }
        for (let e of A) {
            const i = e.i
            const j = l[i].get(e.j)
            a[e.i][j] = e.v
        }
        for (let k = 0; k < n; k++) {
            const nk = L[k].length
            let akk = a[k][nk-1]
            if (akk < 0) return false
            const lkk = Math.sqrt(akk)
            d[k][nk-1] = lkk
            const nc = C[k].length
            for (let i = 1; i < nc; i++) {
                const ik = C[k][i]
                const ki = l[ik].get(k)
                d[ik][ki] = a[ik][ki] / lkk
                for (let j = 1; j < nc; j++) {
                    const jk = C[k][j]
                    if (jk > ik) break 
                    a[ik][l[ik].get(jk)] -= d[ik][ki] * d[jk][l[jk].get(k)]
                }
            }
        }
        LT = new Array(n).fill(null).map(() => [])
        for (let i = 0; i < n; i++) {
            for (let j of L[i]) {
                LT[j].push(i)
            }
        }
        return true
    }
    function factorization(n,M) {
        setMatrix(n,M)
        symbolicFactorization()
        numericFactorization()
    }
    function factorization2(n,M) {
        setMatrix(n,M)
        symbolicFactorization()
        numericFactorization2()
    }
    function solve(b) {
        const y = new Array(n).fill(0)
        for (let i = 0; i < n; i++) {
            let s = b[i]
            for (let j of L[i]) {
                if (j < i) {
                    const lij = d[i][l[i].get(j)]
                    s -= lij * y[j]
                }
            }

            y[i] = s / d[i][l[i].get(i)]
        }
        const x = new Array(n).fill(0)
        for (let i = n-1; i >= 0; i--) {
            let s = y[i]
            for (let j of LT[i]) {
                s -= d[j][l[j].get(i)] * x[j]
            }
            x[i] = s / d[i][l[i].get(i)]
        }
        return x
    }
    return {
        factorization,
        factorization2,
        solve
    }
} // sparseCholeskyFactory()