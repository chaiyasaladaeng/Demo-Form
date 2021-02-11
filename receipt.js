const PDFDocument = require('pdfkit').default

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

module.exports = function createReceipt(doc, imageLogo, documentPDF) {
  let pageList = splitPage(doc['SCTT.ISCTLI'], ['', 'STP.ID'])

  //generate ref no
  // let referenceNo = doc['SCTT.AHTA.ARD'].map(ref => ref['']).join(", ")

  const headerAddress = getAddress(doc, 'SCTT.AHTA.STP.PTA', 65)
  const shippingAddress = getAddress(doc, 'SCTT.AHTA.BTP.PTA', 40)

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
      currencyCode: doc['SCTT.AHTS.InvoiceCurrencyCode']
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
      strID: doc['SCTT.AHTA.BTP.STR.ID']
    },
    items: [],
    total: {
      grandTotalAmount: doc['SCTT.AHTS.STSHMS.GrandTotalAmount'] // จำนวนเงินรวมทั้งสิ้น
    },
    payment: {
      cash: doc['@Payments'].find((element) => element.paymentType === 2),
      transfer: doc['@Payments'].find((element) => element.paymentType === 1),
      cheques: doc['@Payments'].filter((element) => element.paymentType === 3),
      other: doc['@Payments'].find((element) => element.paymentType === 4)
    }
  }

  // count total
  let totalCountPage = 0
  for (let i = 0; i < pageList.length; i++) {
    totalCountPage += 1
    let lastRow = (i === pageList.length - 1)
    let totalCountRow = pageList[i].reduce((n, item) => n + item.rowCount, 0)

    let addPageForTotal = lastRow && (totalCountRow > limitRow)
    if (lastRow && addPageForTotal) {
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
        invoiceNo: item['STP.ID'],
        invoiceDate: doc['SCTT.AHTA.ARD'].length !== 0 && doc['SCTT.AHTA.ARD'][j] ? doc['SCTT.AHTA.ARD'][j]['IssueDateTime'] : "",
        invoiceDueDate: doc['SCTT.AHTS.STPT'].length !== 0 && doc['SCTT.AHTS.STPT'][j] ? doc['SCTT.AHTS.STPT'][j]['DueDateDateTime'] : "",
        amount: item['SLTS.STSLMS.NetLineTotalAmount'],
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
    generateFooter(documentPDF, i + 1, totalCountPage)

    if (addPageForTotal) {
      data.items = []
      documentPDF.addPage()
      generateHeader(documentPDF, data)
      generateCustomerInformation(documentPDF, data)
      generateInvoiceTable(documentPDF, data, linePositionHasTotal)
      generateFooter(documentPDF, i + 2, totalCountPage)
    }

    if (lastRow) {
      generateTotal(documentPDF, data)
      generatePaymentMeans(documentPDF, data)
    }
  }

  return documentPDF
}

function generateCustomerInformation(doc, invoice) {
  generateHr(doc, 100)

  const customerInformationTop = 110

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

    .text("เลขประจำตัวผู้เสียภาษีอากร / Tax ID", globalVariable.startY, customerInformationTop + 60)
    .text(" : " + getTaxIdAndBranch(invoice.shipping.strID), 160, customerInformationTop + 60)


    .text("เลขที่ / No.", 400, customerInformationTop)
    // .font("src/pdfGenerator/THSarabun.ttf")
    .text(" : " + invoice.info.no, 470, customerInformationTop)
    // .font("src/pdfGenerator/THSarabun.ttf")
    .text("วันที่ / Date", 400, customerInformationTop + 15)
    .text(" : " + formatDate(invoice.info.date), 470, customerInformationTop + 15)
    // .text("เอกสารอ้างอิง /", 400, customerInformationTop + 30)
    // .text(" : " + invoice.info.referenceNo, 470, customerInformationTop + 30)
    // .text("Reference No.", 400, customerInformationTop + 45)

    .text("สกุลเงิน / Currency : " + invoice.info.currencyCode, 0, customerInformationTop + 60, { align: "right" })

    .moveDown()

  generateHr(doc, 200)
}

function generateInvoiceTable(doc, invoice, hrLinePosition) {
  let i
  currentPosition = 200

  const itemsPositionX = {
    no: globalVariable.startY,
    invoiceNo: globalVariable.startY + 50,
    invoiceDate: globalVariable.startY + 180,
    invoiceDueDate: globalVariable.startY + 360,
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
      en: "Invoice No.",
      th: "เลขที่เอกสาร",
      option: { width: 170, align: "center" },
      positionStart: itemsPositionX.invoiceNo
    },
    {
      en: "Invoice Date",
      th: "วันที่เอกสาร",
      option: { width: 170, align: "center" },
      positionStart: itemsPositionX.invoiceDate
    },
    {
      en: "Invoice DueDate",
      th: "วันที่ครบกำหนด",
      option: { width: 90, align: "center" },
      positionStart: itemsPositionX.invoiceDueDate
    },
    {
      en: "Amount",
      th: "จำนวนเงิน",
      option: { width: 570, align: "right" },
      positionStart: itemsPositionX.amount
    },
  ]

  generateTableHeader(doc, currentPosition, tableHeaderList)
  generateHr(doc, currentPosition + 35)

  // doc.font("src/pdfGenerator/THSarabun.ttf");

  currentPosition += 35
  for (i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i]
    // let position = itemPosition + (i + 1) * 30;
    currentPosition = generateTableRow(
      doc,
      itemsPositionX,
      currentPosition,
      item.lineID,
      item.invoiceNo,
      formatDate(item.invoiceDate),
      formatDate(item.invoiceDueDate),
      formatCurrency(item.amount),
    )
  }

  currentPosition = hrLinePosition
  generateHr(doc, currentPosition)
}

function generateTotal(doc, invoice) {
  let totalList = [
    {
      text: "จำนวนเงินรวมทั้งสิ้น / GRAND TOTAL",
      value: formatCurrency(invoice.total.grandTotalAmount)
    }
  ]

  currentPosition += 20
  currentPosition = generateTableTotal(doc, currentPosition, totalList)
  generateTextGrandTotal(doc, currentPosition, invoice.total.grandTotalAmount)
}

function generatePaymentMeans(doc, data) {
  let positionStart = currentPosition + 30
  doc
    .fontSize(globalVariable.fontSize)
    .text("ใบเสร็จรับเงินฉบับนี้จะสมบูรณ์ ต่อเมื่อบริษัทได้รับเงินตามเช็คแล้วเท่านั้น", 50, positionStart)
    .text("This receipt will be valid only after the cheque is honored by bank.", 50, positionStart += 15)

    .text("วิธีการรับชำระ / Payment Means", 50, positionStart += 30)

  // draw rectangle
  let widthRectangle = 10
  let y = positionStart + 15
  doc
    // cash
    .lineWidth(0.5)
    .rect(50, y + 4, widthRectangle, widthRectangle).stroke()

  if (data.payment.cash) {
    doc.text("/", 53, y, { lineBreak: false })
  }

  doc.text("เงินสด / Cash", 65, y)

    // transfer
    .lineWidth(0.5)
    .rect(160, y + 4, widthRectangle, widthRectangle).stroke()

  if (data.payment.transfer) {
    doc.text("/", 163, y, { lineBreak: false })
  }

  doc.text("เงินโอน / Transfer", 175, y)

  // other
  doc
    .lineWidth(0.5)
    .rect(280, y + 4, widthRectangle, widthRectangle).stroke()

  if (data.payment.other) {
    doc.text("/", 283, y, { lineBreak: false })
  }
  doc.text("อื่นๆ", 295, y)


  // cheque
  if (data.payment.cheques.length > 0) {
    data.payment.cheques.forEach((cheque, index) => {
      y += 15

      if (index === 0) {
        doc
          .lineWidth(0.5)
          .rect(50, y + 4, widthRectangle, widthRectangle).stroke()
          .text("/", 53, y, { lineBreak: false })
      }

      doc.text("เช็ค เลขที่ / Cheque No.", 65, y)
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(170, y + 15)
        .lineTo(250, y + 15)
        .dash(1, { space: 2 })
        .stroke()

      if (cheque.chequeNum) {
        doc.text(cheque.chequeNum, 175, y, { width: 80 })
      }

      doc.text("ลงวันที่ / Date", 260, y)
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(320, y + 15)
        .lineTo(390, y + 15)
        .dash(1, { space: 2 })
        .stroke()

      if (cheque.dueDate) {
        doc.text(formatDate(cheque.dueDate), 325, y, { width: 80 })
      }

      doc.text("ธนาคาร / Bank", 400, y)
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(465, y + 15)
        .lineTo(550, y + 15)
        .dash(1, { space: 2 })
        .stroke()

      if (cheque.bankName) {
        doc.text(cheque.bankName, 470, y, { width: 80 })
      }
    })

  } else {

    y += 15
    doc
      .lineWidth(0.5)
      .rect(50, y + 4, widthRectangle, widthRectangle).stroke()

    doc.text("เช็ค เลขที่ / Cheque No.", 65, y)
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(170, y + 15)
      .lineTo(250, y + 15)
      .dash(1, { space: 2 })
      .stroke()

    doc.text("ลงวันที่ / Date", 260, y)
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(320, y + 15)
      .lineTo(390, y + 15)
      .dash(1, { space: 2 })
      .stroke()

    doc.text("ธนาคาร / Bank", 400, y)
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(465, y + 15)
      .lineTo(550, y + 15)
      .dash(1, { space: 2 })
      .stroke()

  }
}

function generateTableRow(
  doc,
  itemsPositionX,
  y,
  no,
  invoiceNo,
  invoiceDate,
  invoiceDueDate,
  amount,
) {
  let numberDescRow = Math.ceil(invoiceNo.length / 30)
  let length = 15
  doc
    .fontSize(globalVariable.fontSize)
    .text(no, itemsPositionX.no, y, { width: 30, align: "center" })

  doc.text(invoiceNo, itemsPositionX.invoiceNo, y, { width: 170, align: "center" })
  // append invoiceNo line
  for (let i = 2; i < numberDescRow; i++) {
    doc.text("", itemsPositionX.invoiceNo, y + length, { width: 170, align: "center" })
  }

  doc
    .text(invoiceDate, itemsPositionX.invoiceDate, y, { width: 170, align: "center" })
    .text(invoiceDueDate, itemsPositionX.invoiceDueDate, y, { width: 90, align: "center" })
    .text(amount, itemsPositionX.amount, y, { width: 570, align: "right" })

  // generateHr(doc, y + (length * numberDescRow) + 5);
  y = y + (length * numberDescRow) + 5
  return y
}