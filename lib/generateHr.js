const globalVariable = { startY: 20, startX: 20, fontSize: 14 }

module.exports = (doc, y) => {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(globalVariable.startY, y)
    .lineTo(600 - globalVariable.startY, y)
    .stroke()
}