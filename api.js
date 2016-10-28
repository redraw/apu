var request = require('request');
var util = require('util');

var HTTP_REQUEST = {
  headers: {
    'x-api-key': "PkVRKmPu0k6O2F0Y9J78TaFekqe3mAAe3RWJ5Vaj"
  }
}

var api = {
  url: "https://8kdx6rx8h4.execute-api.us-east-1.amazonaws.com",
  limit: 5,

  promise: function(req) {
    return new Promise((resolve, reject) => {
      request(req, function(err, res, body) {
        if (err || res.statusCode !== 200) {
          console.log(err, res)
          reject(err || body)
        }
        var data = JSON.parse(body);
        resolve(data)
      })
    })
  },

  buscar: function(str, lat, lng) {
    var req = util._extend(HTTP_REQUEST, {
      url: util.format("%s/prod/productos?string=%s&lat=%s&lng=%s&limit=%s", this.url, str, lat, lng, this.limit)
    })
    return this.promise(req)
  },

  producto: function(id, lat, lng) {
    var req = util._extend(HTTP_REQUEST, {
      url: util.format("%s/prod/producto?id_producto=%s&lat=%s&lng=%s&limit=%s", this.url, id, lat, lng, this.limit)
    })
    return this.promise(req)
  },

  img: function(id) {
    return util.format("https://imagenes.preciosclaros.gob.ar/productos/%s.jpg", id)
  }
}

module.exports = api