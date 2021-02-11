module.exports = (doc, key0, maxLength) => {
    const key1List = [
        'LineOne',
        'LineTwo',
        'LineThree',
        'LineFour',
        'LineFive',
        // 'PostcodeCode',
    ]

    let textAddress = ""
    key1List.forEach((key1) => {
        // skip postcode, header case
        if (key0 === 'SCTT.AHTA.BTP.PTA' && key1 === 'LineFive') {
            return
        }
        if (doc[`${key0}.${key1}`]) {
            textAddress = textAddress + " " + doc[`${key0}.${key1}`]
        }
    })
    let textArray = textAddress.trim().split(" ").filter((x)=> x!=='')

    let arrayResult = []
    let textResult = ""
    textArray.forEach((text, index)=> {
        if (textResult.length < maxLength) {
            textResult = textResult + " " + text
        } else {
            arrayResult.push(textResult.trim())
            textResult = text
        }

        if (textArray.length - 1 === index) {
            arrayResult.push(textResult.trim())
        }
    })

    return {
        address1: arrayResult[0] ? arrayResult[0] : "",
        address2: arrayResult[1] ? arrayResult[1] : "",
        address3: arrayResult[2] ? arrayResult[2] : "",
    }
}