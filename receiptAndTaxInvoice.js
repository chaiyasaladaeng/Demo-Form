const splitPage = require('./lib/splitPage')
const generateFooter = require('./lib/generateFooter')
const generateHeader = require('./lib/generateHeader')
const formatDate = require('./lib/formatDate')
const formatCurrency = require('./lib/formatCurrency')
const generateHr = require('./lib/generateHr')
const generateTableTotal = require('./lib/generateTableTotal')
const generateTableHeader = require('./lib/generateTableHeader')
const generateTextGrandTotal = require('./lib/generateTextGrandTotal')
const getTaxIdAndBranch = require('./lib/getTaxIdAndBranch')
const getAddress = require('./lib/getAddress')

let currentPosition = 0
const linePositionHasTotal = 535
const linePositionFullPage = 735
const limitRow = 15

const globalVariable = { startY: 20, startX: 20, fontSize: 14 }

module.exports = function createReceiptAndTaxInvoice(doc, imageLogo, documentPDF, generateOnCloudFunction) {
  let pageList = splitPage(doc['SCTT.ISCTLI'], ['STP.ID', 'STP.Name'])

  //generate ref no
  // let referenceNo = doc['SCTT.AHTA.ARD'].map(ref => ref['']).join(", ")

  const headerAddress = getAddress(doc, 'SCTT.AHTA.STP.PTA', 65)
  const shippingAddress = getAddress(doc, 'SCTT.AHTA.BTP.PTA', 38)

  const data = {
    docType: doc['@DocType'],
    header: {
      imageLogo: imageLogo,
      companyName: doc['SCTT.AHTA.STP.Name'],
      address1: headerAddress.address1,
      address2: headerAddress.address2,
      strID: doc['SCTT.AHTA.STP.STR.ID']

    },
    info: {
      no: doc['ED.ID'],
      date: doc['ED.IssueDateTime'],
      noRef: doc['SCTT.AHTA.ARD'].map(ref => ref['IssuerAssignedID']).join(", ")
      // referenceNo: referenceNo,
    },
    shipping: {
      customerCode: doc['SCTT.AHTA.BTP.ID'],
      name: doc['SCTT.AHTA.BTP.Name'],
      // buildingNumber: doc['SCTT.AHTA.BTP.PTA.LineOne'],
      // address: doc['SCTT.AHTA.BTP.PTA.LineTwo'],
      // city: doc['SCTT.AHTA.BTP.PTA.LineThree'],
      // state: doc['SCTT.AHTA.BTP.PTA.LineFour'],
      // country: doc['SCTT.AHTA.BTP.PTA.LineFive'],
      // postalCode: doc['SCTT.AHTA.BTP.PTA.PostcodeCode'],
      address1: shippingAddress.address1,
      address2: shippingAddress.address2,
      address3: shippingAddress.address3,
      strID: doc['SCTT.AHTA.BTP.STR.ID']
    },
    items: [],
    total: {
      basisAmount: doc['SCTT.AHTS.ATT.BasisAmount'], // จำนวนเงินรวม
      taxBasisTotalAmount: doc['SCTT.AHTS.STSHMS.TaxBasisTotalAmount'], // มูลค่าก่อนภาษี
      taxTotalAmount: doc['SCTT.AHTS.STSHMS.TaxTotalAmount'], // ภาษีมูลค่าเพิ่ม
      grandTotalAmount: doc['SCTT.AHTS.STSHMS.GrandTotalAmount'] // จำนวนเงินรวมทั้งสิ้น
    },
    payment: {
      cash: doc['@Payments'] ? doc['@Payments'].find((element) => element.paymentType === 2) : '',
      transfer: doc['@Payments'] ? doc['@Payments'].find((element) => element.paymentType === 1) : '',
      cheques: doc['@Payments'] ? doc['@Payments'].filter((element) => element.paymentType === 3) : '',
      other: doc['@Payments'] ? doc['@Payments'].find((element) => element.paymentType === 4) : ''
    },
    reason: doc['ED.Purpose'],
    reasonDetail: doc['SCTT.AHTA.ARD'][0],
    remark: doc['ED.IN.Subject'],
  }

  // count total
  let totalCountPage = 0
  for (let i = 0; i < pageList.length; i++) {
    totalCountPage += 1
    let lastRow = (i === pageList.length - 1)
    let totalCountRow = pageList[i].reduce((n, item) => n + item.rowCount, 0)

    let addPageForTotal = lastRow && (totalCountRow > limitRow)
    if (addPageForTotal) {
      totalCountPage += 1
    }
  }

  for (let i = 0; i < pageList.length; i++) {
    //last row
    let lastRow = (i === pageList.length - 1)

    // generate items
    let items = []
    let totalCountRow = 0
    for (let j = 0; j < pageList[i].length; j++) {
      let item = pageList[i][j]
      totalCountRow += item.rowCount
      let itemTmp = {
        lineID: item['ADLD.LineID'],
        code: item['STP.ID'],
        description: item['STP.Name'],
        unitPrice: item['SLTA.GPPTP.ChargeAmount'],
        quantity: item['SLTD.BilledQuantity'],
        unit: item['SLTD.BilledQuantity.unitCode'],
        amount: item['SLTS.STSLMS.NetLineTotalAmount'],
        discount: item['SLTS.STAC.ActualAmount']
      }
      items.push(itemTmp)
    }
    let addPageForTotal = lastRow && (totalCountRow > limitRow)

    data.items = items

    if (i !== 0) {
      documentPDF.addPage()
    }

    generateHeader(documentPDF, data)
    generateCustomerInformation(documentPDF, data)

    let hrLinePosition = linePositionHasTotal
    if (totalCountRow > limitRow) {
      hrLinePosition = linePositionFullPage
    }

    generateInvoiceTable(documentPDF, data, hrLinePosition)
    generateFooter(documentPDF, i + 1, totalCountPage, !generateOnCloudFunction)

    if (addPageForTotal) {
      data.items = []
      documentPDF.addPage()
      generateHeader(documentPDF, data)
      generateCustomerInformation(documentPDF, data)
      generateInvoiceTable(documentPDF, data, linePositionHasTotal)
      generateFooter(documentPDF, i + 2, totalCountPage, !generateOnCloudFunction)
    }

    if (lastRow) {
      generateTotal(documentPDF, data)
      generateRemark(documentPDF, data)
    }

  }

  return documentPDF
}

function generateCustomerInformation(doc, invoice) {
  generateHr(doc, 100)

  const customerInformationTop = 105

  doc
    .fontSize(globalVariable.fontSize)
    // .font("src/pdfGenerator/THSarabun.ttf")
    .text("รหัสลูกค้า / Customer Code", globalVariable.startY, customerInformationTop)
    .text(" : " + invoice.shipping.customerCode, 160, customerInformationTop)
    .text("ชื่อลูกค้า / Customer Name", globalVariable.startY, customerInformationTop + 15)
    .text(" : " + invoice.shipping.name, 160, customerInformationTop + 15)
    .text("ที่อยู่ / Address", globalVariable.startY, customerInformationTop + 30)
    // .text(
    //   " : " +
    //   invoice.shipping.buildingNumber + " " +
    //   invoice.shipping.city + " " +
    //   invoice.shipping.state
    //   , 160, customerInformationTop + 30
    // )
    .text(" : " + invoice.shipping.address1, 160, customerInformationTop + 30)

    // .text(invoice.shipping.country + " " + invoice.shipping.postalCode, 170, customerInformationTop + 45)
    .text(invoice.shipping.address2, 170, customerInformationTop + 45)
    .text(invoice.shipping.address3, 170, customerInformationTop + 60)

    .text("เลขประจำตัวผู้เสียภาษีอากร / Tax ID", globalVariable.startY, customerInformationTop + 75)
    .text(" : " + getTaxIdAndBranch(invoice.shipping.strID), 160, customerInformationTop + 75)

    .fontSize(globalVariable.fontSize)
    .text("เลขที่ / No.", 400, customerInformationTop)
    // .font("src/pdfGenerator/THSarabun.ttf")
    .text(" : " + invoice.info.no, 470, customerInformationTop)
    // .font("src/pdfGenerator/THSarabun.ttf")
    .text("วันที่ / Date", 400, customerInformationTop + 15)
    .text(" : " + formatDate(invoice.info.date), 470, customerInformationTop + 15)

  // type RE
  if (invoice.docType === 5) {
    doc
        .text("อ้างอิงใบกำกับภาษีเลขที่ /", 400, customerInformationTop + 30)
        .text("Tax Invoice No. Ref.", 400, customerInformationTop + 45)
        .text(" : " + invoice.info.noRef, 495, customerInformationTop + 30)
  } else {
    // type RT
    doc
        .text("อ้างอิงใบแจ้งหนี้ /", 400, customerInformationTop + 30)
        .text("Invoice No. Ref.", 400, customerInformationTop + 45)
        .text(" : " + invoice.info.noRef, 470, customerInformationTop + 30)
  }

    // .text("Reference No.", 400, customerInformationTop + 45)

  doc.moveDown()

  generateHr(doc, 200)
}

function generateInvoiceTable(doc, invoice, hrLinePosition) {
  let i
  currentPosition = 200

  const itemsPositionX = {
    no: globalVariable.startY,
    code: globalVariable.startY + 30,
    description: globalVariable.startY + 120,
    unitPrice: globalVariable.startY + 250,
    quantity: globalVariable.startY + 310,
    unit: globalVariable.startY + 385,
    discount: globalVariable.startY + 410,
    amount: 0
  }

  // doc.font("src/pdfGenerator/THSarabun.ttf");
  let tableHeaderList = [
    {
      en: "No.",
      th: "ลำดับ",
      option: { width: 30, align: "center" },
      positionStart: itemsPositionX.no
    },
    {
      en: "Code",
      th: "รหัสสินค้า",
      option: { width: 80, align: "center" },
      positionStart: itemsPositionX.code
    },
    {
      en: "Description",
      th: "รายการ",
      option: { width: 170, align: "center" },
      positionStart: itemsPositionX.description
    },
    {
      en: "Unit Price",
      th: "หน่วยละ",
      option: { width: 90, align: "right" },
      positionStart: itemsPositionX.unitPrice,
      positionStartTH: itemsPositionX.unitPrice - 5
    },
    {
      en: "Quantity",
      th: "จำนวน",
      option: { width: 90, align: "right" },
      positionStart: itemsPositionX.quantity,
      positionStartTH: itemsPositionX.quantity - 5
    },
    {
      en: "Unit",
      th: "หน่วยนับ",
      option: { width: 90, align: "center" },
      positionStart: itemsPositionX.unit,
    },
    {
      en: "Discount",
      th: "ส่วนลด",
      option: { width: 90, align: "right" },
      positionStart: itemsPositionX.discount,
      positionStartTH: itemsPositionX.discount - 5,
    },
    {
      en: "Amount",
      th: "จำนวนเงิน",
      option: { align: "right" },
      positionStart: itemsPositionX.amount
    },
  ]

  generateTableHeader(doc, currentPosition, tableHeaderList)
  generateHr(doc, currentPosition + 35)

  // doc.font("src/pdfGenerator/THSarabun.ttf");

  currentPosition += 35
  for (i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i]
    currentPosition = generateTableRow(
      doc,
      itemsPositionX,
      currentPosition,
      item.lineID,
      item.code,
      item.description,
      formatCurrency(item.unitPrice),
      formatCurrency(item.quantity),
      item.unit,
      formatCurrency(item.discount),
      formatCurrency(item.amount)
    )
  }

  currentPosition = hrLinePosition
  generateHr(doc, currentPosition)
}

function generateTotal(doc, invoice) {
  let totalList = [
    {
      text: "จำนวนเงินรวม / GROSS TOTAL",
      value: formatCurrency(invoice.total.basisAmount)
    },
    {
      textUnderline: "หัก",
      text: "เงินมัดจำ / DOWN PAYMENT",
      value: formatCurrency("0000")
    },
    {
      text: "มูลค่าก่อนภาษี / SUBTOTAL",
      value: formatCurrency(invoice.total.taxBasisTotalAmount)
    },
    {
      text: "ภาษีมูลค่าเพิ่ม / VAT 7%",
      value: formatCurrency(invoice.total.taxTotalAmount)
    },
    {
      text: "จำนวนเงินรวมทั้งสิ้น / GRAND TOTAL",
      value: formatCurrency(invoice.total.grandTotalAmount)
    }
  ]

  currentPosition += 5
  currentPosition = generateTableTotal(doc, currentPosition, totalList)
  generateTextGrandTotal(doc, currentPosition, invoice.total.grandTotalAmount)
}

function generateRemark(doc, data) {
    let positionStart = currentPosition + 15
    doc
        .fontSize(globalVariable.fontSize)
        .text("ใบเสร็จรับเงินฉบับนี้จะสมบูรณ์ ต่อเมื่อบริษัทได้รับเงินตามเช็คแล้วเท่านั้น", globalVariable.startX, positionStart)
        .text("This receipt will be valid only after the cheque is honored by bank.", globalVariable.startX, positionStart += 15)

        .text("วิธีการรับชำระ / Payment Means", globalVariable.startX, positionStart += 30)

    // draw rectangle
    let widthRectangle = 10
    let y = positionStart + 15
    doc
        // cash
        .lineWidth(0.5)
        .rect(globalVariable.startX, y + 4, widthRectangle, widthRectangle).stroke()

    if (data.payment.cash) {
        doc.text("/", 53, y, {lineBreak: false})
    }

    doc.text("เงินสด / Cash", 65, y)

        // transfer
        .lineWidth(0.5)
        .rect(160, y + 4, widthRectangle, widthRectangle).stroke()

    if (data.payment.transfer) {
        doc.text("/", 163, y, {lineBreak: false})
    }

    doc.text("เงินโอน / Transfer", 175, y)

    // other
    doc
        .lineWidth(0.5)
        .rect(280, y + 4, widthRectangle, widthRectangle).stroke()

    if (data.payment.other) {
        doc.text("/", 283, y, {lineBreak: false})
    }
    doc.text("อื่นๆ", 295, y)


    // cheque
    if (data.payment.cheques.length > 0) {
        data.payment.cheques.forEach((cheque, index) => {
            y += 15

            if (index === 0) {
                doc
                    .lineWidth(0.5)
                    .rect(globalVariable.startX, y + 4, widthRectangle, widthRectangle).stroke()
                    .text("/", 53, y, {lineBreak: false})
            }

            doc.text("เช็ค เลขที่ / Cheque No.", 65, y)
                .strokeColor("#aaaaaa")
                .lineWidth(1)
                .moveTo(170, y + 15)
                .lineTo(250, y + 15)
                .dash(1, {space: 2})
                .stroke()

            if (cheque.chequeNum) {
                doc.text(cheque.chequeNum, 175, y, {width: 80})
            }

            doc.text("ลงวันที่ / Date", 260, y)
                .strokeColor("#aaaaaa")
                .lineWidth(1)
                .moveTo(320, y + 15)
                .lineTo(390, y + 15)
                .dash(1, {space: 2})
                .stroke()

            if (cheque.dueDate) {
                doc.text(formatDate(cheque.dueDate), 325, y, {width: 80})
            }

            doc.text("ธนาคาร / Bank", 400, y)
                .strokeColor("#aaaaaa")
                .lineWidth(1)
                .moveTo(465, y + 15)
                .lineTo(550, y + 15)
                .dash(1, {space: 2})
                .stroke()

            if (cheque.bankName) {
                doc.text(cheque.bankName, 470, y, {width: 80})
            }
        })

    } else {

        y += 15
        doc
            .lineWidth(0.5)
            .rect(globalVariable.startX, y + 4, widthRectangle, widthRectangle).stroke()

        doc.text("เช็ค เลขที่ / Cheque No.", 65, y)
            .strokeColor("#aaaaaa")
            .lineWidth(1)
            .moveTo(170, y + 15)
            .lineTo(250, y + 15)
            .dash(1, {space: 2})
            .stroke()

        doc.text("ลงวันที่ / Date", 260, y)
            .strokeColor("#aaaaaa")
            .lineWidth(1)
            .moveTo(320, y + 15)
            .lineTo(390, y + 15)
            .dash(1, {space: 2})
            .stroke()

        doc.text("ธนาคาร / Bank", 400, y)
            .strokeColor("#aaaaaa")
            .lineWidth(1)
            .moveTo(465, y + 15)
            .lineTo(550, y + 15)
            .dash(1, {space: 2})
            .stroke()

    }
}

function generateTableRow(
  doc,
  itemsPositionX,
  y,
  no,
  item,
  description,
  unitCost,
  quantity,
  unit,
  discount,
  lineTotal
) {
  let numberDescRow = Math.ceil(description.length / 30)
  let numberCodeRow = Math.ceil(item.length / 15)

  let length = 15
  doc
    .fontSize(globalVariable.fontSize)
    .text(no, itemsPositionX.no, y, { width: 30, align: "center" })

  doc.text(item, itemsPositionX.code, y, { width: 80, align: "center" })
  // append code line
  for (let i = 0; i < numberCodeRow; i++) {
    doc.text("", itemsPositionX.code, y + length, { width: 80, align: "center" })
  }

  doc.text(description, itemsPositionX.description, y, { width: 170 })

  // append description line
  for (let i = 2; i < numberDescRow; i++) {
    doc.text("", itemsPositionX.description, y + length, { width: 170 })
  }

  doc
    .text(unitCost, itemsPositionX.unitPrice, y, { width: 90, align: "right" })
    .text(quantity, itemsPositionX.quantity, y, { width: 90, align: "right" })
    .text(unit, itemsPositionX.unit, y, { width: 90, align: "center" })
    .text(discount, itemsPositionX.discount, y, { width: 90, align: "right" })
    .text(lineTotal, itemsPositionX.amount, y, { align: "right" })

  // generateHr(doc, y + (length * numberDescRow) + 5);
  let maxRow = numberDescRow
  if (numberCodeRow > numberDescRow) {
    maxRow = numberCodeRow
  }
  y = y + (length * maxRow) + 5
  return y
}