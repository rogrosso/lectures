export function readOFF(text) {
    const lines = text.split(/\r?\n/)
    let pos = 1
    while (true) {
        const strs = lines[pos].split(/\s+/)
        if (strs[0] !== "#") break
        else pos++
    }
    const [nrVertices, nrFaces] = lines[pos].split(/\s+/).map((e) => +e)
    pos++
    const vertices = []
    const faces = []
    for (let i = 0; i < nrVertices; i++) {
        const v = lines[pos++].split(/\s+/).map((e) => +e)
        vertices.push({ index: i, x: v[0], y: v[1], z: v[2] })
    }
    for (let i = 0; i < nrFaces; i++) {
        const face = lines[pos++].split(/\s+/).map((e) => +e)
        if (face[0] === 3) {
            faces.push({
                index: i,
                v0: face[1],
                v1: face[2],
                v2: face[3],
                nr_v: 3
            })
        } else if (face[0] === 4) {
            faces.push({
                index: i,
                v0: face[1],
                v1: face[2],
                v2: face[3],
                v3: face[4],
                nr_v: 4
            })
        }
    }
    //console.log(faces)
    return {
        vertices,
        faces
    }
}
export function readObj(text) {
    const vertices = []
    const faces = []
    text.split(/\r?\n/).forEach((line) => {
        const entries = line.split(/\s+/)
        if (entries[0] === "v") {
            const vertex = entries.slice(1).map((e) => +e)
            const index = vertices.length
            vertices.push({
                index: index,
                x: vertex[0],
                y: vertex[1],
                z: vertex[2]
            })
        } else if (entries[0] === "f") {
            let f = null
            if (entries[entries.length - 1] === "") {
                f = entries.slice(1, entries.length - 1)
            } else {
                f = entries.slice(1)
            }
            let indices = []
            f.forEach((e) => {
                indices.push(+e.split("/")[0] - 1)
            })
            const index = faces.length
            if (indices.length === 3) {
                faces.push({
                    index: index,
                    v0: indices[0],
                    v1: indices[1],
                    v2: indices[2],
                    nr_v: 3
                })
            } else if (indices.length === 4) {
                //faces.push( {index: index, v0: indices[0], v1: indices[1], v2: indices[2] } )
                //faces.push( {index: index+1, v0: indices[0], v1: indices[2], v2: indices[3] } )
                faces.push({
                    index: index,
                    v0: indices[0],
                    v1: indices[1],
                    v2: indices[2],
                    v3: indices[3],
                    nr_v: 4
                })
            }
        }
    })
    return {
        vertices,
        faces
    }
}

export function readTextFile(text) {
    if (text.substring(0,3).toUpperCase() === 'OFF') {
        return readOFF(text)
    } else {
        return readObj(text)
    }
}
