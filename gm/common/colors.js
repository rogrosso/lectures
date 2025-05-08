import { random_seed } from "../../common/random.js"

// colors generated at https://mokole.com/palette.html
export const colorsUno = [ 
    // darkolivegreen
    '#556b2f',
    // sienna
    '#a0522d',
    // forestgreen
    '#228b22',
    // darkslateblue
    '#483d8b',
    // darkcyan
    '#008b8b',
    // steelblue
    '#4682b4',
    // navy
    '#000080',
    // yellowgreen
    '#9acd32',
    // darkseagreen
    '#8fbc8f',
    // purple
    '#800080',
    // maroon3
    '#b03060',
    // orangered
    '#ff4500',
    // orange
    '#ffa500',
    // yellow
    '#ffff00',
    // mediumblue
    '#0000cd',
    // lime
    '#00ff00',
    // springgreen
    '#00ff7f',
    // crimson
    '#dc143c',
    // aqua
    '#00ffff',
    // sandybrown
    '#f4a460',
    // fuchsia
    '#ff00ff',
    // dodgerblue
    '#1e90ff',
    // lightgreen
    '#90ee90',
    // lightblue
    '#add8e6',
    // deeppink
    '#ff1493',
    // mediumslateblue
    '#7b68ee',
    // violet
    '#ee82ee',
    // moccasin
    '#ffe4b5',
    // lightpink
    '#ffb6c1',
    //gray
    '#808080'
]
export const colorsDos = [
    // forestgreen
    '#228b22',
    // maroon2
    '#7f0000',
    // olive
    '#808000',
    // darkslateblue
    '#483d8b',
    // darkcyan
    '#008b8b',
    // peru
    '#cd853f',
    // darkblue
    '#00008b',
    // purple
    '#800080',
    // maroon3
    '#b03060',
    // orangered
    '#ff4500',
    // darkorange
    '#ff8c00',
    // lime
    '#00ff00',
    // blueviolet
    '#8a2be2',
    // springgreen
    '#00ff7f',
    // crimson
    '#dc143c',
    // deepskyblue
    '#00bfff',
    // blue
    '#0000ff',
    // lightcoral
    '#f08080',
    // greenyellow
    '#adff2f',
    // orchid
    '#da70d6',
    // thistle
    '#d8bfd8',
    // fuchsia
    '#ff00ff',
    // dodgerblue
    '#1e90ff',
    // laserlemon
    '#ffff54',
    // lightgreen
    '#90ee90',
    // deeppink
    '#ff1493',
    // mediumslateblue
    '#7b68ee',
    // paleturquoise
    '#afeeee',
    // moccasin
    '#ffe4b5',
    // dimgray
    '#696969',
]

export function randColors(...s) {
    let seed = 1234
    if (s.length > 0) seed = s[0]
    const rand = random_seed(seed)
    return function () {
        const cStr = Math.floor(rand() * 16777215).toString(16)
        const r = parseInt("0x" + cStr.substring(0, 2))
        const g = parseInt("0x" + cStr.substring(2, 4))
        const b = parseInt("0x" + cStr.substring(4, 2))
        return [r,g,b]
    }
}