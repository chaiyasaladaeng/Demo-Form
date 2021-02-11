module.exports = (key) => {
  switch (key) {
    case 1:
      // 1 ใบกำกับภาษีเต็มรูป
      return ["ใบกำกับภาษี", "Tax Invoice"]
    case 2:
      // 2 ใบกำกับภาษีอย่างย่อ
      return ["ใบกำกับภาษีอย่างย่อ", "Tax Invoice (ABB)"]
    case 3:
      // 3 ใบเพิ่มหนี้
      return ["ใบเพิ่มหนี้", "A/R Debit Note"]
    case 4:
      // 4 ใบลดหนี้
      return ["ใบลดหนี้", "A/R Credit Note"]
    case 5:
      // 5 ใบรับ
      return ["ใบเสร็จรับเงิน", "Receipt"]
    case 6:
      // 6 ใบเสร็จรับเงิน / ใบกำกับภาษี
      return ["ใบเสร็จรับเงิน/ใบกำกับภาษี", "Receipt/Tax Invoice"]
    default:
      return ["", ""]

  }
}