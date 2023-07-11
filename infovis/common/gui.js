
export function dropdown({
    divObj,
    text,
    selection,
    keys,
    handler
}) {
    const dropdownOptions = []
    for (let k of keys) dropdownOptions.push({key: k, value: k})

    const lab = divObj.append('label')
        .attr('class', 'dropdown-label')
        .text(text)
    const select = divObj.append('select')
        .attr('aria-label', text)
        .on('change', function(event) {
            handler(text, event.target.value)
        })
    const options = select.selectAll('option').data(dropdownOptions, d => d.key)
        .join('option')
        .attr('value', d => d.value)
        .property('selected', d => d.key === selection)
        .text(d => d.value)
}