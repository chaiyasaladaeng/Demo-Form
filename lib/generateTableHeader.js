module.exports = (doc, y, tableHeaderList) => {
  doc.fontSize(15)
  for (let i = 0; i < tableHeaderList.length; i++) {
    if (tableHeaderList[i].positionStartTH) {
      doc.text(tableHeaderList[i].th, tableHeaderList[i].positionStartTH, y, tableHeaderList[i].option)
    } else {
      doc.text(tableHeaderList[i].th, tableHeaderList[i].positionStart, y, tableHeaderList[i].option)
    }
    doc.text(tableHeaderList[i].en, tableHeaderList[i].positionStart, y + 15, tableHeaderList[i].option)
  }
}