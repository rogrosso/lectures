/**
 * Singular Value Decomposition
 * It computes the singular value decomposition of a matrix. Two methods are implemented.
 * The classical Jacobi algorithm and a simple and accurate method for symmetric 3x3 matrices. 
 * 1. "Numerische Mathematik" by Hans Rudolf Schwarz and Norbert Köckler, 7th edition, 2009
 * 2. "Numerische Mathematik 2" by Josef Stoer and Roland Bulirsch, 5th edition, 2005
 * Notes:
 * 1. The algorithm is not optimized for speed or memory usage.
 * 3. The Jacobi algorithm is provably good enough for most of the applications. 
 * 4. The funciton symmetric3x3() implements the special case for symmetric 3x3 matrices.
 * 5. The function jacobi() implements the Jacobi algorithm. 
 * 
 * @returns {Object} - {U, s, V} where U and V are orthogonal matrices and s is
 * is a vector with the singular values, such that C = U * diag(t) * V^t
 */
import { svdJacobiFactory } from "./svdJacobi.js"
import { eigSymm3x3 } from "./eigSymmetric3x3.js"

export function svdFactory( ) {
    const jacobi = svdJacobiFactory()
    function svdSymm3x3(A, sort = 'desc') {
        const { Q: U, D: s } = eigSymm3x3(A, sort);
        let flag = false;
        const V = new Array(3).fill(0).map((_,i) => [...U[i]]);
        for (let i = 0; i < 3; i++) {
            if (s[i] < 0) {
                flag = true;
                s[i] = -s[i];
                for (let j = 0; j < 3; j++) {
                    V[j][i] = -V[j][i];
                }
            }
        }
        return { U, s, V };
    }
    /** 
     * Singular Value Decomposition of a 3x3 matrix
     * @param {Array<Array<number>>} A - 3x3 matrix
     * @returns {Object} - {U, D, V} where U and V are orthogonal matrices and D is a vector with the singular values
     * such that A = U * diag(D) * V^t
     * Note:
     * U contains the left singular vectors as columns
     * V contains the right singular vectors as columns
     * Method:
     * 1. Compute A^t * A
     * 2. Compute the eigenvalues and eigenvectors of A^t * A, this are the right singular vectors. Use the 
     * eigSymm3x3() function.
     * 3. Compute the singular values as the square root of the eigenvalues.
     * 4. Compute the left singular vectors as the product of A and the right singular vectors divided by the 
     * corresponding singular value.
    */
    function svd3x3(A) {
        const a1 = new Array(3).fill(0).map( () => new Array(3).fill(0))  //multiplyTransposeMatrixMatrix(A, A)
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                let val = 0
                for (let k = 0; k < 3; k++) {
                    val += A[k][i] * A[k][j]
                }
                a1[i][j] = val
            }
        }
        let { Q: V, D } = eigSymm3x3(a1)
        const U = new Array(3).fill(0).map(() => new Array(3).fill(0))
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                let val = 0
                for (let k = 0; k < 3; k++) {
                    val += A[j][k] * V[k][i]
                }
                U[j][i] = val / D[i]
            }
        }
        // normalize columns of U. Tje columns of V are already normalized
        for (let i = 0; i < 3; i++) {
            let norm = 0
            for (let j = 0; j < 3; j++) {
                norm += U[j][i] * U[j][i]
            }
            norm = Math.sqrt(norm)
            for (let j = 0; j < 3; j++) {
                U[j][i] /= norm
            }
        }
        
        return { U, D, V }
    }
    return {
        jacobi: jacobi.jacobi,
        svdSymm3x3: svdSymm3x3,
        svd3x3: svd3x3
    }
}