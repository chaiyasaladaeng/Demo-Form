const getName = require('./getName')
const getTaxIdAndBranch = require('./getTaxIdAndBranch')

const globalVariable = { startY: 20, startX: 20, fontSize: 14 }

module.exports = (doc, data) => {

  if (data.header.imageLogo) {
    doc.image(data.header.imageLogo, globalVariable.startY + 5, globalVariable.startX, { fit: [70, 70], align: 'center', valign: 'center' })
  }

  let fontpath = (__dirname+'/THSarabun.ttf');
  doc
    .fillColor("#444444")
    .font(fontpath)
    // .font("THSarabun.ttf")

    .fontSize(18)
    .text(data.header.companyName, globalVariable.startY + 100, globalVariable.startX, { align: "left" })

    .fontSize(15)
    .text(data.header.address1, globalVariable.startY + 100, globalVariable.startX + 20, { align: "left" })
    .text(data.header.address2, globalVariable.startY + 100, globalVariable.startX + 35, { align: "left" })
    .text("เลขประจำตัวผู้เสียภาษี / Tax ID : " + getTaxIdAndBranch(data.header.strID), globalVariable.startY + 100, globalVariable.startX + 50, { align: "left" })

    .fontSize(20)
    .text(getName(data.docType)[0], 0, globalVariable.startX, { align: "right" })
    .text(getName(data.docType)[1], 0, globalVariable.startX + 15, { align: "right" })

    .moveDown()
}