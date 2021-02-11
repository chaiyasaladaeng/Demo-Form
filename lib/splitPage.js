module.exports = (itemsList, key, limitElement = 25) => {

  // mock data for test
  // itemsList = mockDataTest(15)

  let lineItemsCount = 0
  let itemsGroup = []
  let mergeItemsGroup = []
  for (let i = 0; i < itemsList.length; i++) {
    let totalRow = Math.ceil(itemsList[i][key[1]].length / 30)
    if (key[0]) {
      let totalRowViaCode = Math.ceil(itemsList[i][key[0]].length / 15)
      if (totalRowViaCode > totalRow) {
        totalRow = totalRowViaCode
      }
    }

    lineItemsCount += totalRow

    if (lineItemsCount < limitElement + 1) {
      itemsList[i]['rowCount'] = totalRow
      itemsGroup.push(itemsList[i])

    } else {
      mergeItemsGroup.push([...itemsGroup])

      i -= 1
      lineItemsCount = 0
      itemsGroup = []
    }

    //last row
    if (itemsList.length - 1 === i) {
      mergeItemsGroup.push([...itemsGroup])
    }
  }

  if (mergeItemsGroup.length === 0) {
    return [[]]
  } else {
    return mergeItemsGroup
  }
}

// function mockDataTest(row) {
//     let arr = []
//     for (let i = 1; i <= row; i++) {
//         arr.push({
//             'ADLD.LineID': i,
//             'STP.ID': 'FGPB000' + i,
//             'STP.Name': 'ปากกาหมึกสีดำ1 ปากกาหมึกสีดำ2',
//             'SLTA.GPPTP.ChargeAmount': 7000,
//             'SLTD.BilledQuantity': 1000,
//             'SLTS.STSLMS.NetIncludingTaxesLineTotalAmount': 7000,
//             'SLTS.STAC.ActualAmount': 1000,
//         })
//     }

//     return arr
// }