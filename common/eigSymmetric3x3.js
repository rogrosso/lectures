/**
 * Implements a method to compute the eigenvalues and eigenvectors of a symmetric 3x3 matrix, as described 
 * in the Wikipedia article https://en.wikipedia.org/wiki/Eigenvalue_algorithm#3%C3%973_real_symmetric_matrices
 * @param {Array} A, symmetric 3x3 matrix to compute eigenvalues and eigenvectors
 * @param {*} sort, sort order of eigenvalues, it must be 'asc', 'desc', or 'unsorted'
 * @returns {Object} {Q, D} where Q is the matrix of eigenvectors and D is the vector of eigenvalues
 */
export function eigSymm3x3(A, sort = 'desc') {
    if (A.length !== 3 || A[0].length !== 3) {
        throw new Error("Input must be a 3x3 matrix.")
    }
    let eig = null

    const a = A[0][0]
    const b = A[0][1]
    const c = A[0][2]
    const d = A[1][1]
    const e = A[1][2]
    const f = A[2][2]

    const p1 = b * b + c * c + e * e
    if (p1 === 0) {
        eig = [a, d, f];
        eig.sort((a, b) => b - a);
    } else {
        const q = (a + d + f) / 3  // trace(A) / 3
        const p2 = (a - q) * (a - q) + (d - q) * (d - q) + (f - q) * (f - q) + 2 * p1
        const p = Math.sqrt(p2 / 6);

        const B = [
            [(a - q) / p, b / p, c / p],
            [b / p, (d - q) / p, e / p],
            [c / p, e / p, (f - q) / p]
        ];

        const r = (B[0][0] * (B[1][1] * B[2][2] - B[1][2] * B[2][1]) - 
                   B[0][1] * (B[1][0] * B[2][2] - B[1][2] * B[2][0]) +
                   B[0][2] * (B[1][0] * B[2][1] - B[1][1] * B[2][0])) / 2

        let phi;
        if (r <= -1) {
            phi = Math.PI / 3
        } else if (r >= 1) {
            phi = 0
        } else {
            phi = Math.acos(r) / 3
        }

        const eig1 = q + 2 * p * Math.cos(phi)
        const eig3 = q + 2 * p * Math.cos(phi + (2 * Math.PI / 3))
        const eig2 = 3 * q - eig1 - eig3
        eig = [eig1, eig2, eig3]
        if (sort === 'desc') {
            eig.sort((a, b) =>  b - a)
        } else if (sort === 'asc') {
            eig.sort((a, b) => a - b)
        }
    }
    const Q = eigenvectors(A, eig)
    
    return { Q, D: eig }
}
function eigenvectors(A, eig) {
    const n = A.length;
    const Q = new Array(3).fill(0).map(() => new Array(3).fill(0));
    const cols = [[0,1],[1,2],[0,2]];
    for (let j = 0; j < 3; j++) {
        const e = eig[j];
        const v1 = [0, 0, 0];
        const v2 = [0, 0, 0];
        for (let r = 0; r < 3; r++) {
            for (let i = 0; i < n; i++) {
                v1[i] = A[i][cols[r][0]];
                v2[i] = A[i][cols[r][1]];
            }
            v1[0] -= e;
            v2[1] -= e;
            const v3 = [
                v1[1] * v2[2] - v1[2] * v2[1],
                v1[2] * v2[0] - v1[0] * v2[2],
                v1[0] * v2[1] - v1[1] * v2[0]
            ];
            const norm = Math.sqrt(v3[0] * v3[0] + v3[1] * v3[1] + v3[2] * v3[2]);
            if (norm === 0) {
                continue;
            }
            for (let i = 0; i < n; i++) {
                v3[i] /= norm;
            }
            for (let i = 0; i < n; i++) {
                Q[i][j] = v3[i];
            }
            break;
        }
    }
    return Q;
}