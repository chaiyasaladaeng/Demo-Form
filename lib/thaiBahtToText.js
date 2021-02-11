/**
 * @author Jirachai Chansivanon <antronic.inc@gmail.com>
 * @see {@link https://github.com/antronic/that-baht-text-js|GitHub}
 */

// options

const primaryCurrency = 'บาท'
const secondaryCurrency = 'สตางค์'
const fullMoney = 'ถ้วน'

const numbersText = 'ศูนย์,หนึ่ง,สอง,สาม,สี่,ห้า,หก,เจ็ด,แปด,เก้า,สิบ'.split(',')
const unitsText = 'สิบ,ร้อย,พัน,หมื่น,แสน,ล้าน'.split(',')


// convert function without async

const convert = (numberInput) => {
  let numberStr = numberInput.toString()
  numberStr = numberStr.split('').reverse().join('')

  let textOutput = ''

  numberStr.split('').map((number, i) => {
    const currentNumber = Number(number)
    let numberText = numbersText[currentNumber]
    let unitText = ''

    if (i !== 0) {
      unitText = unitsText[Math.abs(i - 1) % 6]
    }

    if (i % 6 === 1 && currentNumber <= 2) {
      if (currentNumber === 2) {
        unitText = 'สิบ'
        numberText = 'ยี่'
      } else if (i > 6 && currentNumber === 1) {
        unitText = 'สิบ'
        numberText = ''
      } else {
        numberText = ''
      }
    }

    if (i >= 6 && i % 6 === 0) {
      if (currentNumber === 1) {
        if (i + 1 < numberStr.length) {
          numberText = 'เอ็ด'
        }
      }
    }

    if (numberStr.length > 1 && i === 0 && currentNumber === 1) {
      numberText = 'เอ็ด'
    }

    if (currentNumber === 0) {
      unitText = (i >= 6 && i % 6 === 0) ? unitText : ''
      numberText = ''
    }

    textOutput = numberText + unitText + textOutput
    return number
  })
  return textOutput
}

module.exports = (numberInput) => {
  const numberStr = parseFloat(numberInput).toFixed(2)

  const decimalStr = numberStr.split('.')[0]
  const floatingStr = numberStr.split('.')[1]

  let textOutput = ''

  textOutput = convert(decimalStr)
  if (floatingStr !== undefined && floatingStr !== '00') {
    textOutput = `${textOutput}${primaryCurrency}${convert(floatingStr)}${secondaryCurrency}`
  } else {
    textOutput = `${textOutput}${primaryCurrency}${fullMoney}`
  }

  return textOutput
}