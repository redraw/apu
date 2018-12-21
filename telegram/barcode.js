var request = require('request')

var reader = {
  decode: function(url) {
    return new Promise((resolve, reject) => {
      request.post("https://zxing.org/w/decode?full=false", {
        formData: {f: request.get(url, {encoding: null})}
      }, (err, res, body) => {
        console.log(body)
        if (err || res.statusCode !== 200) {
          reject("No se pudo escanear el código")
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