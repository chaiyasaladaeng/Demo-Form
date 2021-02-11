const THBText = require('./thaiBahtToText')
const generateHr = require('./generateHr')

const globalVariable = { startY: 20, startX: 20, fontSize: 14 }

module.exports = (doc, y, grandTotal, showTitle = true) => {
  doc.fontSize(15)
  if (showTitle) {
    doc.text("จำนวนเงินรวมทั้งสิ้น (ตัวอักษร)", globalVariable.startX, y - 30, { width: 300, align: "left" })
  }
  if (grandTotal) {
    doc.text(`(${THBText(grandTotal / 100)})`, globalVariable.startX, y - 15, { width: 300, align: "left" })
  }

  generateHr(doc, y + 10)
}