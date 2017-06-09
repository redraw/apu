var request = require('request');
var util = require('util');

var api = {
  host: "https://d735s5r2zljbo.cloudfront.net",
  limit: 5,
  
  request: {
    headers: {'user-agent': 'bitbucket.org/agustinbv/apu'}
  },

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
    var req = util._extend(this.request, {
      url: util.format("%s/prod/productos?string=%s&lat=%s&lng=%s&limit=%s", this.host, str, lat, lng, this.limit)
    })
    return this.promise(req)
  },

  producto: function(id, lat, lng) {
    var req = util._extend(this.request, {
      url: util.format("%s/prod/producto?id_producto=%s&lat=%s&lng=%s&limit=%s", this.host, id, lat, lng, this.limit)
    })
    return this.promise(req)
  },

  img: function(id) {
    return util.format("https://imagenes.preciosclaros.gob.ar/productos/%s.jpg", id)
  }
}

module.exports = api
