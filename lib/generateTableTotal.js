module.exports = (doc, y, totalList) => {
  doc.fontSize(15)
  let positionStart = y
  for (let i = 0; i < totalList.length; i++) {
    let xText = 300
    if (totalList[i].textUnderline) {
      doc.text(totalList[i].textUnderline, xText, positionStart, { align: "left", underline: true })
      xText += 20
    }
    doc.text(totalList[i].text, xText, positionStart, { align: "left" })
    doc.text(totalList[i].value, 0, positionStart, { align: "right" })
    positionStart += 15
  }
  return positionStart
}