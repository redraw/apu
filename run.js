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
  name: 'Calle 43 915, Buenos Aires, Argentina'
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
      "title": "error!",
      "color": "danger",
      "text": err
    }]
  }
}


// patterns
controller.hears('buscar (.+)', EVENTS.default, buscar);
controller.hears('en (.+)', EVENTS.default, en);
controller.hears('.*', EVENTS.default, help);


function buscar(bot, message) {
  var query = message.match[1];

  bot.reply(message, 'espere un momentos');

  api.buscar(query, location.lat, location.lng).then(data => {
    var productos = data.productos;

    if (data.productos.length == 0) {
      bot.reply(message, 'no results, vuelvas prontos')
      return;
    }

    bot.reply(message, {
      "attachments": productos.map(p => {
        return {
          "title": util.format("%s", p['nombre']),
          "text": util.format("$%s a $%s", p['precioMin'], p['precioMax']),
          "thumb_url": api.img(p['id']),
          "mrkdwn_in": ["text"]
        }
      })
    })

  }, err => {
    bot.reply(message, error(err));
  });
}

function en(bot, message) {
  var query = message.match[1];

  geocoder.geocode(query, function(err, res) {
    console.log(res);
    if (!err && res.status === "OK") {
      var data = res.results[0];
      location.lat = data.geometry.location.lat;
      location.lng = data.geometry.location.lng;
      location.name = data.formatted_address;
      bot.reply(message, ':airplane_arriving: informando desde ' + location.name);
    } else {
      bot.reply(message, error(err))
    }
  })
}

function help(bot, message) {
  bot.reply(message, 'man apu\n' +
                     '@apu buscar <producto>\n' +
                     '@apu en <lugar>');
}