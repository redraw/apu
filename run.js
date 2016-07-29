/* 
TODO
- guardar location en redis, por usuario
- mostrar las promociones que devuelve el endpoint de producto
*/

var Botkit = require('botkit');
var api = require('./api.js')
var util = require('util');
var geocoder = require('geocoder');

var controller = Botkit.slackbot({
  debug: false
});

// connect the bot to a stream of messages
bot = controller.spawn({
  token: process.env.token,
}).startRTM()

var location = {
  lat: '-34.9138008',
  lng: '-57.9593571',
  name: 'Calle 43 915, 1900AEK La Plata, Buenos Aires, Argentina'
}

var EVENTS = {
  default: ['direct_message','direct_mention','mention']
}

var mapa = function(lat, lng) {
  return util.format("https://maps.google.com/maps?q=%s,%s", lat, lng)
}

var error = function(err) {
  return {
    "attachments": [{
      "title": "vuelvas prontos!!! error!",
      "color": "danger",
      "text": err
    }]
  }
}


// patterns
controller.hears('buscar (.*)', EVENTS.default, buscar);
controller.hears('en (.*)', EVENTS.default, en);


function buscar(bot, message) {
  var query = message.match[1];

  bot.reply(message, 'espere un momentos')

  api.buscar(query, location.lat, location.lng).then(data => {
    var productos = data.productos;
    var opciones = productos.map(p => p['id']);

    bot.startConversation(message, function(err, convo) {
      var question = {
        "attachments": productos.map((p, idx) => {
          return {
            "title": util.format("%s", p['nombre']),
            "text": util.format("$%s - $%s", p['precioMin'], p['precioMax']),
            "footer": idx,
            "thumb_url": api.img(p['id']),
            "mrkdwn_in": ["text"]
          }
        })
      }
      convo.ask(question, [
        {
          pattern: '^([0-9])$',
          callback: function(response, convo) {
            var opcion = parseInt(response.match[1]);

            if (opcion > opciones.length) {
              convo.repeat();
              convo.next();
              return;
            }

            api.producto(opciones[opcion], location.lat, location.lng).then(data => {
              var sucursales = data.sucursales.map(s => {
                //console.log(s)
                var precio = util.format("$%s", s['preciosProducto']['precioLista'])
                var direccion = util.format(" <%s|%s> ", mapa(s['lat'], s['lng']), s['comercioRazonSocial'])
                var distancia = util.format(" _(%s)_", s['distanciaDescripcion'])
                return precio + direccion + distancia
              });
              convo.say({
                "text": 'aqui los resultados desde ' + location.name,
                "attachments": [{
                  "title": data.producto['nombre'],
                  "text": sucursales.join('\n'),
                  "image_url": api.img(data.producto['id']),
                  "mrkdwn_in": ["text"]
                }]
              });
              convo.next();
            }, err => {
              convo.say(error(err));
              convo.next();
            })
          }
        },
        {
          default: true,
          callback: function(response,convo) {
            console.log(response)
            bot.api.reactions.add({
              timestamp: response.ts,
              channel: convo.source_message.channel,
              name: '+1'
            })
            convo.say('estaba programado para esperar una opcion, repetidme si fuera necesario')
            convo.next();
          }
        }
      ]);
    })
  }, err => {
    bot.reply(message, error(err));
  })
}

function en(bot, message) {
  var query = message.match[1];

  geocoder.geocode(query, function(err, res) {
    console.log(res);
    if (!err && res.status === "OK") {
      var data = res.results[0];
      location.lat = data.geometry.location.lat
      location.lng = data.geometry.location.lng
      location.name = data.formatted_address
      bot.reply(message, ':airplane_arriving: informando desde ' + location.name);
    } else {
      bot.reply(message, error(err))
    }
  })
}


























Array.prototype.random = function(){
  return this[Math.floor(Math.random()*this.length)];
}

controller.hears('hard?cod.*', 'ambient', function(bot, message) {
  bot.api.reactions.add({
    channel: message.channel,
    timestamp: message.ts,
    name: ['+1', 'beer'].random()
  })
});