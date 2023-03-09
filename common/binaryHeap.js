/* Description:
 *   This is a modified version of the implementation of a binary heap presented in the book
 *   Eloquent JavaScript, first edition 2007, Marijn Haverbeke 
 * Author: Marijn Haverbeke (Eloquent JavaScript, first edition 2007)
 * Copyright: © Marijn Haverbeke (license), written March to July 2007, last modified on November 28 2013.
 * Link: https://eloquentjavascript.net/1st_edition/appendix2.html
 * License: CC (Attribution 3.0 Unported (CC BY 3.0))
 * Disclaimer Notice in the license text: 
 *      You are free to:
 *          Share — copy and redistribute the material in any medium or format
 *          Adapt — remix, transform, and build upon the material
 *          for any purpose, even commercially.
 *     This license is acceptable for Free Cultural Works.
 *     The licensor cannot revoke these freedoms as long as you follow the license terms.
 * Modifications to the original code:
 *      1. Use a factory function
 *      2. Use a map and modify some functions to make the update of the queue faster
 *      3. Do not use 'var'. Use 'const' and if necessary 'let'
 *      4. Some few changes in the syntax
 *      5. Some new simple functions, for usability
 */

export function binaryHeapFactory(scoreFunction) {
    const content = []
    const map = new Map()
    return {
        print() {
            content.forEach((e, index) => {
                const el = map.get(e.value)
                console.log(`pos: ${index}, value: ${scoreFunction(e.value)}, map index: ${el.index}`)
            })
        },
        push(element) {
            // Add the new element to the end of the array.
            const el = {value: element, index: content.length}
            content.push(el)
            map.set(element, el)
            // Allow it to bubble up.
            this.bubbleUp(content.length - 1)
        },
        peek() {
            return content[0].value
        },
        element(i) {
            return content[i].value
        },
        pop() {
            // Store the first element so we can return it later.
            const result = content[0]
            // Get the element at the end of the array.
            const end = content.pop()
            map.delete(result.value)
            // If there are any elements left, put the end element at the
            // start, and let it sink down.
            if (content.length > 0) {
                content[0] = end
                content[0].index = 0
                this.sinkDown(0)
            }
            return result.value
        },
        remove: function (node) {
            if (content.length === 0) return null
            // To remove a value, we must search through the array to find
            // it.
            let result = null
            const el = map.get(node)
            if (el !== undefined) {
                if (map.delete(node)) {
                    result = node
                    if (el.index === content.length - 1) {
                        content.pop()
                    } else {
                        const end = content.pop()
                        if (content.length > 0) {
                            const index = el.index
                            content[index] = end
                            content[index].index = index
                            this.bubbleUp(index)
                            this.sinkDown(index)
                        }
                    }
                } else {
                    console.log('cannot delete node')
                }
            }
            return result
        },
        update: function(node) {
            this.remove(node)
            this.push(node)
        },
        size: function () {
            return content.length
        },
        empty: function() {
            return content.length <= 0
        },
        bubbleUp(n) {
            // Fetch the element that has to be moved.
            const element = content[n]
            if (element === undefined) debugger
            const score = scoreFunction(element.value)
            // When at 0, an element can not go up any further.
            while (n > 0) {
                // Compute the parent element's index, and fetch it.
                const parentN = Math.floor((n + 1) / 2) - 1
                const parent = content[parentN]
                // If the parent has a lesser score, things are in order and we
                // are done.
                if (score < scoreFunction(parent.value)) {
                    // Otherwise, swap the parent with the current element and continue.
                    content[parentN] = element
                    content[n] = parent
                    content[n].index = n
                    content[parentN].index = parentN
                    n = parentN
                } else {
                    break
                }
            }
        },
        sinkDown: function (n) {
            // Look up the target element and its score.
            const length = content.length
            const element = content[n]
            const elemScore = scoreFunction(element.value)
            while (true) {
                // Compute the indices of the child elements.
                const child2N = (n + 1) * 2
                const child1N = child2N - 1
                let child1Score = null
                //let child2Score = null
                // This is used to store the new position of the element, if any.
                let swap = null
                // If the first child exists (is inside the array)...
                if (child1N < length) {
                    // Look it up and compute its score.
                    child1Score = scoreFunction(content[child1N].value)
                    // If the score is less than our element's, we need to swap.
                    if (child1Score < elemScore) {
                        swap = child1N
                    }
                }
                // Do the same checks for the other child.
                if (child2N < length) {
                    const child2Score = scoreFunction(content[child2N].value)
                    if (child2Score < (swap == null ? elemScore : child1Score)) {
                        swap = child2N
                    }
                }
                // No need to swap further, we are done.
                if (swap != null) {
                    // Otherwise, swap and continue.
                    content[n] = content[swap]
                    content[swap] = element
                    content[n].index = n
                    content[swap].index = swap
                    n = swap
                } else {
                    break
                }
            }
        }
    }
} // factory function
