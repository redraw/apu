var request = require('request');
var util = require('util');

var api = {
  host: "https://d735s5r2zljbo.cloudfront.net",
  limit: 5,

  defaults: {
    headers: {'user-agent': 'bitbucket.org/agustinbv/apu'}
  },

  request: function(payload) {
    return new Promise((resolve, reject) => {
      var req = Object.assign({}, this.defaults, payload)
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
    var payload = {
      url: `${this.host}/prod/productos?string=${str}&lat=${lat}&lng=${lng}&limit=${this.limit}`
    }
    return this.request(payload)
  },

  producto: function(id, lat, lng) {
    var payload = {
      url: `${this.host}/prod/producto?id_producto=${id}&lat=${lat}&lng=${lng}&limit=${this.limit}`
    }
    return this.request(payload)
  },

  img: function(id) {
    return `https://imagenes.preciosclaros.gob.ar/productos/${id}.jpg`
  },

  permalink: function(id, lat, lng) {
    return `https://www.preciosclaros.gob.ar/?producto=${id}&lat=${lat}&lng=${lng}`
  }
}

module.exports = api
