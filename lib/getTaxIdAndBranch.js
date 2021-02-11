module.exports = (taxIdAndBranch) => {
  if (taxIdAndBranch.length === 18) {
    let taxId = taxIdAndBranch.substring(0, 13)
    let branch = taxIdAndBranch.substring(13)
    if (branch === "00000") {
      return `${taxId} (สำนักงานใหญ่)`
    } else {
      return `${taxId} (สาขาที่ ${branch})`
    }
  }

  return taxIdAndBranch
}