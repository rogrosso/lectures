/** 
 * Implement a kd-tree
 * Restrictions:
 *  1. kd-tree is static, no insert() or remove() method.
 *  2. works only for 3D euclidean space.
 *  3. the distance metric is the euclidean distance.
 */

import { binaryHeapFactory } from "./binaryHeap.js"

export function kdTreeFactory(points_) {
    const nodeFactory = (index, dimension, parent) => ({
        index,
        dimension,
        distance: Infinity,
        parent,
        left: null,
        right: null,
    })
    let nn = null

    const points = points_
    const dimensions = ["x", "y", "z"]
    let pq_ = null // priority queue
    const root = kdtree([...Array(points.length).keys()], 0, null)
    /**
     * Recursively build the kd-tree
     * @param {Array} indices, array of indices of the points
     * @param {Number} depth, depth of the node
     * @param {Object} parent, parent node
     * @returns node, node of the kd-tree
     */
    function kdtree(indices, depth, parent) {
        const dimension = dimensions[depth % 3]
        if (indices.length === 0) return null
        if (indices.length === 1) {
            return nodeFactory(indices[0], dimension, parent)
        }
        indices.sort((a, b) => points[a][dimension] - points[b][dimension])
        const median = Math.floor(indices.length / 2)        
        const node = nodeFactory(indices[median], dimension, parent)
        node.left  = kdtree(indices.slice(0, median), depth + 1, node)
        node.right = kdtree(indices.slice(median + 1), depth + 1, node)
        
        return node
    }
    /**
     * Search for the nearest neighbor. 
     * @param {Object} target, target point
     * @param {Object} node, node to compare
     * @param {Number} depth, depth of the node 
     * @returns bestCandidate, node with the smallest distance
     */
    function select(node) {
        if (node === null) return
        if (node.distance < nn.distance) nn = node
    }
    function searchOne(target, node, depth) {
        if (node === null) return null
        node.distance = distance(target, points[node.index])
        const dimension = dimensions[depth % 3]
        let next = null
        let opposite = null
        const side = target[dimension] - points[node.index][dimension]
        if (side < 0) {
            next = node.left
            opposite = node.right
        } else {
            next = node.right
            opposite = node.left
        }
        searchOne(target, next, depth + 1)
        select(node)
        // search the other side of the hyperplane if needed
        const squaredSide = side * side
        if (squaredSide <= nn.distance) {
            searchOne(target, opposite, depth + 1)
        }
        
    }
    /**
     * Search for the k nearest neighbors. Add to the priority queue
     * all the nodes found all the way down in the recursion tree.
     * @param {Object} target, target point
     * @param {Object} node, node to compare
     * @param {Number} depth, depth of the node
     * @param {Number} k, maximum size of the priority queue, i.e. k-nearest neighbors
     * @returns void
     */
    function searchMany(target, node, depth, k) {
        if (node === null) return 
        node.distance = distance(target, points[node.index])
        const dimension = dimensions[depth % 3]
        let next = null
        let opposite = null
        const side = target[dimension] - points[node.index][dimension]
        if (side < 0) {
            next = node.left
            opposite = node.right
        } else {
            next = node.right
            opposite = node.left
        }
        searchMany(target, next, depth + 1, k)
        if (pq_.size() < k || node.distance <= pq_.peek().distance) {
            pq_.push({ index: node.index, distance: node.distance })
            if (pq_.size() > k) pq_.pop()
        } 
        // search the other side of the hyperplane if needed
        const squaredSide = side * side
        if (squaredSide <= pq_.peek().distance || pq_.size() < k) { 
            searchMany(target, opposite, depth + 1, k)
        }
    }
    /**
     * Squared distance between two points
     * @param {Object} p0 point 0
     * @param {Object} p1 point 1
     * @returns squared distance between p0 and p1
     */
    function distance(p0, p1) {
        let sum = 0
        for (let d of dimensions) {
            sum += (p0[d] - p1[d]) ** 2
        }
        return sum
    }
    /**
     * Search for the nearest point in the tree from a given point
     * @param {Object} point 
     * @returns the nearest point
     */
    function nearest(point) {
        nn = root
        nn.distance = distance(point, points[nn.index])
        searchOne(point, root, 0)
        if (nn === null) {
            return null 
        } else {
            return {
                index: nn.index,
                point: points[nn.index],
                distance: nn.distance,
            }
        }
    }
    /**
     * Search for the k-nearest points in the tree from a given point
     * @param {Object} point
     * @param {Number} k
     * @returns the k-nearest points
     */
    function knn(point, k) {
        pq_ = binaryHeapFactory((e) => -e.distance)
        searchMany(point, root, 0, k)
        if (pq_.size() === 0) {
            return null 
        } else {

            const result = []
            for (let i = 0; i < pq_.size(); i++) {
                const n = pq_.element(i)
                result.push({index: n.index, point: points[n.index], distance: n.distance})
            }
            return result.sort( (n1,n2) => n1.distance - n2.distance )
        }
        
    }
    /**
     * Print the tree in order
     * @returns void
     */
    function print() {
        function inOrder(node) {
            if (node === null) return
            inOrder(node.left)
            console.log(
                points[node.index]["x"] +
                    ", " +
                    points[node.index]["y"] +
                    ", index: " +
                    node.index
            )
            inOrder(node.right)
        }
        inOrder(root)
    }
    
    return {
        print,
        nearest,
        knn
    }
}

