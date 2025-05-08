/**
 * @module eigSystem
 * This module provides a factory function for creating an eigensystem solver.
 * The factory function returns an object with two methods:
 * 1. eigSymm3x3(A, sort) - computes the eigenvalues and eigenvectors of a symmetric 3x3 matrix.
 * 2. jacobi(A) - computes the eigenvalues and eigenvectors of a symmetric matrix using the Jacobi algorithm.
 */
import { eigSymm3x3 } from "./eigSymmetric3x3.js"
import { jacobiEigenvalueFactory } from "./eigJacobi.js"

export function eigSystemFactory() {
    const jacobi = jacobiEigenvalueFactory()
    return {
        eigSymm3x3: eigSymm3x3,
        jacobi: jacobi.solve
    }
}