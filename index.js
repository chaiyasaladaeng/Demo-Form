const createInvoice = require('./invoice');
const createIncluded = require('./included');
const createReceipt = require('./receipt');
const createCreditNote = require('./creditNote');
const createDebitNote = require('./debitNote');
const createReceiptAndTaxInvoice = require('./receiptAndTaxInvoice');
// const PDFDocument = require('pdfkit');
// const getLogoCompany = require('./lib/getLogoCompany')

module.exports = function getPDFDocument(docObj, imageLogo, PDFDocument, generateOnCloudFunction = false) {
  // let docId = "20000001_RE"
  // let companyId = "EaNkyK4IMTflSMDhSwQ2"

  // let company = await admin.firestore().collection('Companies').doc(companyId).get()
  // let docs = await admin.firestore().collection('Companies').doc(companyId).collection('Docs').doc(docId).get()
  const doc = docObj.data()

  // console.log('getPDFDocument', docObj)

  // doc['@DocType'] = 5
  // console.log("DocType: ", doc['@DocType']);
  let documentPDF = new PDFDocument({ size: "A4", margin: 20 })

  switch (doc['@DocType']) {
    case 1:
      // 1 ใบกำกับภาษีเต็มรูป TX
      return createInvoice(doc, imageLogo, documentPDF, generateOnCloudFunction)
    case 2:
      // 2 ใบกำกับภาษีอย่างย่อ AB
      return createIncluded(doc, imageLogo, documentPDF, generateOnCloudFunction)
    case 3:
      // 3 ใบเพิ่มหนี้ DR
      return createDebitNote(doc, imageLogo, documentPDF, generateOnCloudFunction)
    case 4:
      // 4 ใบลดหนี้ CR
      return createCreditNote(doc, imageLogo, documentPDF, generateOnCloudFunction)
    case 5:
      // 5 ใบรับ RE
      return createReceiptAndTaxInvoice(doc, imageLogo, documentPDF, generateOnCloudFunction)
    case 6:
      // 6 ใบเสร็จรับเงิน / ใบกำกับภาษี RT
      return createReceiptAndTaxInvoice(doc, imageLogo, documentPDF, generateOnCloudFunction)
    default:
      return null

  }
}