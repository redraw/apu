var request = require('request')

var reader = {
  decode: function(url) {
    return new Promise((resolve, reject) => {
      request.post("https://zxing.org/w/decode?full=false", {
        formData: {f: request.get(url, {encoding: null})}
      }, (err, res, body) => {
        console.log('[barcode]', body)
        if (err || res.statusCode !== 200) {
          reject("Mi escaner no funciona muy bien, intente de nuevos con una mejor toma")
        } else {
          resolve(body.trim())
        }
      })
    })
  }
}

module.exports = {
  reader
}