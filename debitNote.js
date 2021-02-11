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
const linePositionHasTotal = 580
const linePositionFullPage = 770
const limitRow = 15

const globalVariable = { startY: 20, startX: 20, fontSize: 14 }

module.exports = function createDebitNote(doc, imageLogo, documentPDF, generateOnCloudFunction) {
  let pageList = splitPage(doc['SCTT.ISCTLI'], ['STP.ID', 'STP.Name'])

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
      dueDate: "",
      taxInvoiceNoRef: doc['SCTT.AHTA.ARD'].map(ref => ref['IssuerAssignedID']).join(", "),
      taxInvoiceDateRef: doc['SCTT.AHTA.ARD'].map(ref => formatDate(ref['IssueDateTime'])).join(", ")
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
      previousInvoiceValue: doc['SCTT.AHTS.STSHMS.OriginalInformationAmount'],
      totalValue: doc['SCTT.AHTS.STSHMS.LineTotalAmount'],
      differenceValue: doc['SCTT.AHTS.STSHMS.DifferenceInformationAmount'],
      vat: doc['SCTT.AHTS.STSHMS.TaxTotalAmount'],
      grandTotal: doc['SCTT.AHTS.STSHMS.GrandTotalAmount'] // จำนวนเงินรวมทั้งสิ้น
    },
    reason: doc['ED.Purpose']
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
      // generateRemark(documentPDF, data)

    }
  }

  return documentPDF
}

function generateCustomerInformation(doc, invoice) {
  generateHr(doc, 105)

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

  // let positionStartInfo1 = 500
  doc
    .fontSize(globalVariable.fontSize)
    .text("เลขที่ / No.", 400, customerInformationTop)
    // .font("src/pdfGenerator/THSarabun.ttf")
    .text(" : " + invoice.info.no, 450, customerInformationTop)
    // .font("src/pdfGenerator/THSarabun.ttf")
    .text("วันที่ / Date", 400, customerInformationTop + 15)
    .text(" : " + formatDate(invoice.info.date), 450, customerInformationTop + 15)

    // .text("อ้างอิงใบกำกับภาษีเลขที่ /", 400, customerInformationTop + 30)
    // .text(" : " + invoice.info.taxInvoiceNoRef, positionStartInfo1, customerInformationTop + 30)
    // .text("Tax Invoice No. Ref.", 400, customerInformationTop + 45)
    // .text("อ้างอิงใบกำกับภาษีวันที่ /", 400, customerInformationTop + 60)
    // .text(" : " + invoice.info.taxInvoiceDateRef, positionStartInfo1, customerInformationTop + 60)
    // .text("Tax Invoice Date Ref.", 400, customerInformationTop + 75)

    .moveDown()

  let lineEndCustomerInfo = 200
  generateHr(doc, lineEndCustomerInfo)

  doc
      .text("อ้างอิงใบกำกับภาษีเลขที่ /", globalVariable.startY, lineEndCustomerInfo + 5)
      .text(" : " + invoice.info.taxInvoiceNoRef, globalVariable.startY + 100, lineEndCustomerInfo + 5, {width: 75})
      .text("Tax Invoice No. Ref.", globalVariable.startY, lineEndCustomerInfo + 20)

      .text("อ้างอิงใบกำกับภาษีวันที่ /", globalVariable.startY + 180, lineEndCustomerInfo + 5)
      .text(" : " + invoice.info.taxInvoiceDateRef, globalVariable.startY + 275, lineEndCustomerInfo + 5, {width: 75})
      .text("Tax Invoice Date Ref.", globalVariable.startY + 180, lineEndCustomerInfo + 20)

      .text("เหตุผลการเพิ่มหนี้ /", globalVariable.startY + 360, lineEndCustomerInfo + 5)
      .text(" : " + invoice.reason, globalVariable.startY + 430, lineEndCustomerInfo + 5, {width: 140})
      .text("Reason", globalVariable.startY + 360, lineEndCustomerInfo + 20)
}

function generateInvoiceTable(doc, invoice, hrLinePosition) {
  let i
  generateHr(doc, 235)
  currentPosition = 235

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
      positionStart: itemsPositionX.unit
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
    // let position = itemPosition + (i + 1) * 30;z
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
      text: "มูลค่าตามใบกำกับภาษีเดิม /",
      value: formatCurrency(invoice.total.previousInvoiceValue)
    },
    {
      text: "PREVIOUS INVOICE VALUE",
      value: ""
    },
    {
      text: "มูลค่าของสินค้าที่ถูกต้อง / TOTAL VALUE",
      value: formatCurrency(invoice.total.totalValue)
    },
    {
      text: "ผลต่าง / DIFFERENCE VALUE",
      value: formatCurrency(invoice.total.differenceValue)
    },
    {
      text: "ภาษีมูลค่าเพิ่ม / VAT 7%",
      value: formatCurrency(invoice.total.vat)
    },
    {
      text: "จำนวนเงินรวมทั้งสิ้น / GRAND TOTAL",
      value: formatCurrency(invoice.total.grandTotal)
    }
  ]

  currentPosition += 5
  currentPosition = generateTableTotal(doc, currentPosition, totalList)
  generateTextGrandTotal(doc, currentPosition, invoice.total.grandTotal)
}

function generateRemark(doc, data) {
  let y = globalVariable.startY

  doc.fontSize(globalVariable.fontSize).text("เหตุผลการเพิ่มหนี้ / Reason : " + data.reason, y + 20, currentPosition += 15)

  doc
    .text("โปรดสั่งจ่ายเช็คในนาม หรือโอนเงินเข้าบัญชีธนาคาร", y + 20, currentPosition += 30)
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(230, currentPosition += 15)
    .lineTo(500, currentPosition)
    .dash(1, { space: 2 })
    .stroke()

  doc
    .text("Please pay by cheque in the account of or transfer to bank account", y + 20, currentPosition)
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(340, currentPosition += 15)
    .lineTo(500, currentPosition)
    .dash(1, { space: 2 })
    .stroke()
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
  let lengthLine = 15

  // append description line
  for (let i = 2; i < numberDescRow; i++) {
    doc.text("", itemsPositionX.description, y + lengthLine, { width: 170 })
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