module.exports = (doc, currentPage, totalPage, hideTextDigitally, y = 800) => {
  doc.fontSize(15)
  if (hideTextDigitally) {
    doc.text("เอกสารนี้ได้จัดทำและส่งข้อมูลให้แก่กรมสรรพากรด้วยวิธีการทางอิเล็กทรอนิกส์", 260, y - 20)
  }
    // .text("Digitally " + companyName, 260, y - 45)
    // .text("Date: .....( วันที่มีการส่งมอบเอกสารให้ลูกค้า หรือ Signing Time ).....", 260, y - 30)
  doc.text(`Page ${currentPage} of ${totalPage}`, 0, y, { align: "right" })
}