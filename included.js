const splitPage = require('./lib/splitPage')
const generateFooter = require('./lib/generateFooter')
const generateHeader = require('./lib/generateHeader')
const formatDate = require('./lib/formatDate')
const formatCurrency = require('./lib/formatCurrency')
const generateHr = require('./lib/generateHr')
const generateTableTotal = require('./lib/generateTableTotal')
const generateTableHeader = require('./lib/generateTableHeader')
const getAddress = require('./lib/getAddress')
const generateTextGrandTotal = require('./lib/generateTextGrandTotal')

let currentPosition = 0
const linePositionHasTotal = 600
const linePositionFullPage = 700
const limitRow = 20

const globalVariable = { startY: 20, startX: 20, fontSize: 14 }

module.exports = function createIncluded(doc, imageLogo, documentPDF, generateOnCloudFunction) {
  let pageList = splitPage(doc['SCTT.ISCTLI'], ['', 'STP.Name'])
  const headerAddress = getAddress(doc, 'SCTT.AHTA.STP.PTA', 65)
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
    },
    items: [],
    total: {
      grandTotalAmount: doc['SCTT.AHTS.STSHMS.GrandTotalAmount'] // จำนวนเงินรวมทั้งสิ้น
    }
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
        description: item['STP.Name'],
        unitPrice: item['SLTA.GPPTP.ChargeAmount'],
        quantity: item['SLTD.BilledQuantity'],
        unit: item['SLTD.BilledQuantity.unitCode'],
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

  const customerInformationTop = 110

  doc
    .fontSize(globalVariable.fontSize)
    // .font("src/pdfGenerator/THSarabun.ttf")
    .text("เลขที่ใบกำกับ / ABB Receipt", globalVariable.startY, customerInformationTop)
    .text(" : " + invoice.info.no, 140, customerInformationTop)
    .text("วันที่ / Date", globalVariable.startY, customerInformationTop + 15)
    .text(" : " + formatDate(invoice.info.date), 70, customerInformationTop + 15)
    .text("Terminal ID", globalVariable.startY, customerInformationTop + 30)
    .text(" : ", 70, customerInformationTop + 30)

    .text("สกุลเงิน / Currency : " + invoice.info.currencyCode, 0, customerInformationTop + 30, { align: "right" })

    .moveDown()

  generateHr(doc, 160)
}

function generateInvoiceTable(doc, invoice, hrLinePosition) {
  let i
  currentPosition = 160

  const itemsPositionX = {
    no: globalVariable.startY,
    description: globalVariable.startY + 80,
    unitPrice: globalVariable.startY + 220,
    quantity: globalVariable.startY + 300,
    unit: globalVariable.startY + 400,
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
    // let position = itemPosition + (i + 1) * 30;
    currentPosition = generateTableRow(
      doc,
      itemsPositionX,
      currentPosition,
      item.lineID,
      item.description,
      formatCurrency(item.unitPrice),
      formatCurrency(item.quantity),
      item.unit,
      formatCurrency(item.amount)
    )

    // if (item.description.length > 42) {
    //     position += 15
    // }
  }

  currentPosition = hrLinePosition
  generateHr(doc, currentPosition)
}

function generateTotal(doc, invoice) {
  let totalList = [
    {
      text: "(ราคารวมภาษีมูลค่าเพิ่ม) รวมเงิน",
      value: formatCurrency(invoice.total.grandTotalAmount)
    }
  ]
  currentPosition += 5
  currentPosition = generateTableTotal(doc, currentPosition, totalList)
  generateTextGrandTotal(doc, currentPosition, invoice.total.grandTotalAmount, false)
}

function generateRemark(doc) {
  let positionStart = currentPosition += 10
  generateHr(doc, positionStart)
  doc
    .fontSize(globalVariable.fontSize)
    .text("-VAT INCLUDED-", globalVariable.startY, positionStart, { width: 550, align: "center" })
    .text("ผู้ขาย / Seller : ", globalVariable.startY, positionStart + 15)
}

function generateTableRow(
  doc,
  itemsPositionX,
  y,
  no,
  description,
  unitCost,
  quantity,
  unit,
  lineTotal
) {
  let numberDescRow = Math.ceil(description.length / 30)

  let length = 15
  doc
    .fontSize(globalVariable.fontSize)
    .text(no, itemsPositionX.no, y, { width: 30, align: "center" })

  doc.text(description, itemsPositionX.description, y, { width: 170 })

  // append description line
  for (let i = 2; i < numberDescRow; i++) {
    doc.text("", itemsPositionX.description, y + length, { width: 170 })
  }

  doc
    .text(unitCost, itemsPositionX.unitPrice, y, { width: 90, align: "right" })
    .text(quantity, itemsPositionX.quantity, y, { width: 90, align: "right" })
    .text(unit, itemsPositionX.unit, y, { width: 90, align: "center" })
    .text(lineTotal, itemsPositionX.amount, y, { align: "right" })

  // generateHr(doc, y + (length * numberDescRow) + 5);
  y = y + (length * numberDescRow) + 5
  return y
}