/**
 * Implements a set of methods for tree data structures.
 * @param {Object} rn root node of the tree
 * @returns 
 * @note The main purpose of this project is information visualization.
 *       We deal with geometry and geometric primivites. Thus, we
 *       have coordinates, size, width and height. 
 *       We call the height of a node in the tree, tHeight. The height
 *       and width occupied by the node in the visual representation
 *       are called height and width. 
 */
export function treeFactory(rn) {
    const root = rn
    /**
     * Computes the height of the nodes in the tree and 
     * returns the height of the tree.
     */
    function treeHeight() {
        let h = 0
        let s = [root]
        const q = []
        while (s.length > 0) {
            const n = s.pop()
            n.tHeight = 0
            q.push(n)
            for (let c of n.children) {
                s.push(c)
            }
        }
        while (q.length > 0) {
            const n = q.pop()
            if (hasChildren(n)) {
                n.tHeight = 1 + Math.max(...n.children.map((c) => c.tHeight))
            }
            h = Math.max(h, n.tHeight)
        }
        return h
    }
    /**
     * Computes the depth of the nodes in the tree.
     */
    function treeDepth() {
        root.depth = 0
        let s = [root]
        while (s.length > 0) {
            const n = s.pop()
            if (hasParent(n)) {
                n.depth = n.parent.depth + 1
            }
            if (hasChildren(n)) {
                for (let c of n.children) {
                    s.push(c)
                }
            }
        }
    }
    /** check if a node has children nodes */
    function hasChildren(n) {
        return n.children && n.children.length > 0
    }
    /** check if a node has a parent node */
    function hasParent(n) {
        return n.parent !== undefined && n.parent !== null
    }
    /** check if a node is the root node of the tree */
    const isRoot = (node) => {
        if (node.parent === null || node.parent === undefined) {
            return true
        } else {
            return false
        }
    }
    /** check if the node a leaf node, i.e. it has no children */
    const isLeaf = (node) => {
        return node.tHeight === 0
    }
    /** returns the number of children of a node */
    const nrChildren = (node) => {
        if (hasChildren(node)) {
            return node.children.length
        } else {
            return 0
        }
    }
    /** check if a node is left most between all siblings */
    const isLeftMost = (node) => {
        if (hasParent(node)) {
            const siblings = node.parent.children
            const index = siblings.indexOf(node)
            if (index === 0) {
                return true
            } else {
                return false
            }
        }
        return true
    }
    /** check if a node is right most between all siblings */
    const isRightMost = (node) => {
        if (hasParent(node)) {
            const siblings = node.parent.children
            const index = siblings.indexOf(node)
            if (index === siblings.length - 1) {
                return true
            } else {
                return false
            }
        }
        return true
    }
    /** check if a node has a sibling */
    const hasSibling = (node) => {
        if (!isRoot(node)) {
            return node.parent.children.length > 1
        }
        return false
    }
    /** from left to right returns all node's left siblings */
    const allLeftSiblings = (node) => {
        const siblings = []
        if (!isRoot(node)) {
            const ch = node.parent.children
            for (let i = 0; i < ch.length; i++) {
                if (ch[i] !== node) {
                    siblings.push(ch[i])
                } else break
            }
        }
        return siblings
    }
    /** from left to right returns previous node's sibling */
    const previousSibling = (node) => {
        if (!isRoot(node)) {
            const siblings = node.parent.children
            const index = siblings.indexOf(node)
            if (index === 0) {
                return undefined
            } else {
                return siblings[index - 1]
            }
        }
        return undefined
    }
    /** from left to right returns next node's sibling */
    const nextSibling = (node) => {
        if (!isRoot(node)) {
            const siblings = node.parent.children
            const index = siblings.indexOf(node)
            if (index >= siblings.length - 1) {
                return undefined
            } else {
                return siblings[index + 1]
            }
        }
        return undefined
    }
    /** returns left most sibling of node */
    const leftMostSibling = (node) => {
        if (!isRoot(node)) {
            if (node !== node.parent.children[0]) {
                return node.parent.children[0]
            } else {
                return undefined
            }
        }
        return undefined
    }
    /** returns right most sibling of node */
    const rightMostSibling = (node) => {
        if (!isRoot(node)) {
            const nrSiblings = node.parent.children.length
            if (node !== node.parent.children[nrSiblings - 1]) {
                return node.parent.children[nrSiblings - 1]
            } else {
                return undefined
            }
        }
        return undefined
    }
    /** returns left most child of node */
    const leftMostChild = (node) => {
        if (hasChildren(node)) {
            return node.children[0]
        }
        return undefined
    }
    /** returns right most child of node */
    const rightMostChild = (node) => {
        if (hasChildren(node)) {
            return node.children[node.children.length - 1]
        }
        return undefined
    }
    /**
     * Computes the descendants of node n. The node itself is included in the result.
     * If n is not specified, the descendants of the root node are returned.
     * @param {Object} n node
     * @returns {Array} descendants of node n
     */
    function descendants(n) {
        let node = root
        if (n) node = n
        const s = [node]
        const d = []
        while (s.length > 0) {
            const n = s.pop()
            d.push(n)
            for (let c of n.children) {
                s.push(c)
            }
        }
        return d
    }
    /**
     * Computes the ancestors of node n. The node itself is not included in the result.
     * @param {Object} n node
     * @returns {Array} ancestors of node n
     */
    function ancestors(n) {
        let node = root 
        if (n) node = n
        const a = []
        while (hasParent(node)) {
            node = node.parent
            a.push(node)
        }
        return a
    }
    /**
     * Returns the leaves of the subtree rooted at node n.
     */
    function leaves(n) {
        const leaves_ = (n, l) => {
            if (isLeaf(n)) {
                l.push(n)
            } else {
                for (let c of n.children) {
                    leaves_(c, l)
                }
            }
        } 
        const l = []
       leaves_(n, l)
       return l
    }
    /**
     * Returns the path from source to target node
     * The path is an array of nodes starting with the source node
     * and ending with the target node.
     * @param {Node} source
     * @param {Node} target
     * @returns {Array} path
     */
    function path(source, target) {
        const s = [source].concat(ancestors(source))
        const t = [target].concat(ancestors(target))
        const sSz = s.length
        const tSz = t.length
        const l = Math.min(sSz, tSz)
        if (sSz === 0) t.pop()
        if (tSz === 0) s.pop()
        let i = 0
        let lca = null
        while (i < l && s[sSz - 1 - i] === t[tSz - 1 - i]) {
            lca = s[sSz - 1 - i]
            s.pop()
            t.pop()
            i++
        }
        return s.concat(lca, t.reverse())
    }
    treeHeight()
    treeDepth()
    return {
        root,
        treeDepth,
        treeHeight,
        isRoot,
        isLeaf,
        hasChildren,
        hasParent,
        nrChildren,
        isLeftMost,
        isRightMost,
        hasSibling,
        allLeftSiblings,
        previousSibling,
        nextSibling,
        leftMostSibling,
        rightMostSibling,
        leftMostChild,
        rightMostChild,
        leaves,
        descendants,
        ancestors,
        path
    }
}

/** 
 * construct hierarchy from flare data set 
 * @param {Object} data flare data set is json format
 */
export function readFlareHierarchy(data) {
    const hMap = new Map()
    hMap.set("flare", {
        name: "flare",
        children: [],
        parent: undefined,
        key: "flare",
        size: undefined,
        imports: undefined,
    })
    data["flare"].forEach((n) => {
        let n_name = n["name"]
        hMap.set(n["name"], {
            name: n_name.substring(n_name.lastIndexOf(".") + 1),
            children: [],
            parent: undefined,
            key: n_name,
            size: n["size"],
            imports: n["imports"],
        })
        // add parent elements up to root node
        while (n_name.lastIndexOf(".") > -1) {
            n_name = n_name.substring(0, n_name.lastIndexOf("."))
            if (!hMap.has(n_name)) {
                hMap.set(n_name, {
                    name: n_name.substring(n_name.lastIndexOf(".") + 1),
                    children: [],
                    parent: undefined,
                    key: n_name,
                    size: undefined,
                    imports: undefined,
                })
            }
        }
    })
    // connect parents and children
    hMap.forEach((e, k, m) => {
        // compute parent
        let n_name = k
        const pKey = n_name.substring(0, n_name.lastIndexOf("."))
        if (pKey.length > 0) {
            hMap.get(pKey).children.push(hMap.get(n_name))
            hMap.get(n_name).parent = hMap.get(pKey)
        }
    })
    return treeFactory(hMap.get("flare"))
}