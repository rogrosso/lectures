/**
 * A matrix is a 2D array of numbers. A vector is a 1D array of numbers.
 * This is a factory of matrix functions.
 * @returns 
 */
const matrixFactory = () => {
    function create(m, n) {
        return new Array(m).fill(0).map( row => new Array(n).fill(0))
        
    }
    function copy(A, b = null) {
        let r = null
        switch(arguments.length) {
        case 1:
          r = new Array(A.length).fill(0).map( (e, i) => [...A[i]])
          break
        case 2:
          r = new Array(A.length).fill(0).map( (e, i) => [...A[i],b[i]])
          break 
        }
        return r
    }
    function tensorProduct(C) {
        const n = C.length
        const r = new Array(n).fill(0).map( () => new Array(n).fill(0))
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            r[i][j] = C[i] * C[j]
          }
        }
        return r
    }
    function sumMatrixMatrix(a,b) {
        const m = a.length
        const n = a[0].length
        const r = new Array(m).fill(0).map( () => new Array(n).fill(0))
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            r[i][j] = a[i][j] + b[i][j]
          }
        }
        return r
    }
    function addMatrixToMatrix(a,b) {
        const m = a.length
        const n = a[0].length
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            a[i][j] += b[i][j]
          }
        }
    }
    function diffMatrixMatrix(a,b) {
        const m = a.length
        const n = a[0].length
        const r = new Array(m).fill(0).map( () => new Array(m).fill(0))
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            r[i][j] = a[i][j] - b[i][j]
          }
        }
        return r 
    }
    function multMatrixVector(a,x) {
        const n = x.length
        const m = a.length
        const r = new Array(m).fill(0)
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            r[i] += a[i][j] * x[j]
          }
        }
        return r
    }
    function multMatrixMatrix(a,b) {
        const ma = a.length
        const na = a[0].length
        const mb = b.length
        const nb = b[0].length
        if (na !== mb) {
          console.log(`ERROR: wrong matrix sizes: ${na} != ${mb}`)
          return null
        }
        const r = new Array(ma).fill(0).map( () => new Array(nb).fill(0))
  
        for (let i = 0; i < ma; i++) {
          for (let j = 0; j < nb; j++) {
            for (let k = 0; k < mb; k++) {
              r[i][j] += a[i][k] * b[k][j]
            }
          }
        }
        return r
    }
    function multMatrixTranspose(a,b) {
        const ma = a.length
        const na = a[0].length
        const mb = b.length
        const nb = b[0].length
        if (na !== mb) {
          console.log(`ERROR: wrong matrix sizes: ${na} != ${mb}`)
          return null
        }
        const r = new Array(ma).fill(0).map( () => new Array(nb).fill(0))
  
        for (let i = 0; i < ma; i++) {
          for (let j = 0; j < nb; j++) {
            for (let k = 0; k < mb; k++) {
              r[i][j] += a[i][k] * b[j][k]
            }
          }
        }
        return r
    }
    function transpose(A) {
        const m = A.length
        const n = A[0].length
        const At = new Array(n).fill(0).map( () => new Array(m).fill(0) )
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            At[j][i] = A[i][j]
          }
        }
        return At
    }
    return {
        create,
        copy,
        tensorProduct,
        sumMatrixMatrix,
        addMatrixToMatrix,
        diffMatrixMatrix,
        multMatrixVector,
        multMatrixMatrix,
        multMatrixTranspose,
        transpose
    } // return 
  } // matrixFactory()
  
  export default matrixFactory