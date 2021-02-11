const moment = require("moment")

module.exports = (date) => {
  if (date) {
    return moment.parseZone(date).format('DD/MM/YYYY')
  } else {
    return ""
  }
}