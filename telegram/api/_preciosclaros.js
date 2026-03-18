var request = require('request')

var api = {
  host: "https://d3e6htiiul5ek9.cloudfront.net",

  defaults: {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 5.1; Win64; x64; Trident/4.0)',
      'x-api-key': 'zIgFou7Gta7g87VFGL9dZ4BEEs19gNYS1SOQZt96',
      'referer': 'https://preciosclaros.gob.ar',
    }
  },

  request: function(payload) {
    return new Promise((resolve, reject) => {
      var req = Object.assign({}, this.defaults, payload)
      request(req, function(err, res, body) {
        if (err || res.statusCode !== 200) {
          console.error(err, res)
          return reject(err || new Error(`Request failed with status ${res && res.statusCode}`))
        }
        var data = JSON.parse(body);
        if (data.status !== 200) {
          console.log(data)
          return reject(new Error(data.errorDescription || `API error status ${data.status}`))
        }
        resolve(data)
      })
    })
  },

  _encodeParams: function(params) {
    return Object.entries(params).map(kv => kv.map(encodeURIComponent).join('=')).join('&')
  },

  buscar: function(q, lat, lng, offset = 0, limit = 5) {
    const params = this._encodeParams({
      string: q,
      lat,
      lng,
      offset,
      limit,
      sort: '-cant_sucursales_disponible'
    })
    var payload = {
      url: `${this.host}/prod/productos?${params}`
    }
    return this.request(payload)
  },

  producto: function(id, lat, lng, limit = 5) {
    const params = this._encodeParams({
      id_producto: id,
      lat,
      lng,
      limit,
    })

    var payload = {
      url: `${this.host}/prod/producto?${params}`
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
