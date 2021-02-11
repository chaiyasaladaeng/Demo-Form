const functions = require('firebase-functions')
const admin = require('firebase-admin')
const axios = require('axios');
const getPDFDocument = require('../../index')
const PDFDocument = require('pdfkit')

try {
    admin.initializeApp()
} catch (e) { /* */
}

module.exports = functions.https.onRequest(async (request, response) => {
    let companyID = "g8KVrEfaXMjh0LcUIEKX"
    let docID = "RV-20000024_RE"
    let company = await admin.firestore().collection('Companies').doc(companyID).get()
    let docs = await admin.firestore().collection('Companies').doc(companyID).collection('Docs').doc(docID).get()
    let imageLogo = await getLogoCompany(company.data().imageLogoUrl)
    let documentPDF = getPDFDocument(docs, imageLogo, PDFDocument, true)
    response.contentType("application/pdf");
    documentPDF.pipe(response)
    documentPDF.end()
})

async function getLogoCompany(imageLogoPath) {
    try {
        let result = await axios.get(imageLogoPath, {
            responseType: 'arraybuffer'
        })
        return Buffer.from(result.data, 'base64')

    } catch (err) {
        console.log(err.message)

    }
    return ""
}