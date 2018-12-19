var Botkit = require('botkit');
var api = require('./api.js')

const http = require('http')
const server = http.createServer(
  (req, res) => res.end('ok')
)

var controller = Botkit.slackbot({
  debug: false,
  retry: Infinity
});

// connect the bot to a stream of messages
bot = controller.spawn({
  token: process.env.SLACK_TOKEN,
}).startRTM()

var location = {
  lat: process.env.LAT,
  lng: process.env.LNG,
}

// patterns
controller.hears('.*', ['direct_message', 'direct_mention'], buscar);

// actions
function buscar(bot, message) {
  console.log(`[${message.user}] ${message.text}`)
  bot.reply(message, 'espere un momentos');

  api.buscar(message.match[0], location.lat, location.lng).then(data => {
    console.log(data)
    var productos = data.productos.filter(p => p.cantSucursalesDisponible > 0);

    if (productos.length <= 0) {
      bot.reply(message, 'no results, vuelvas prontos')
    } else {
      bot.reply(message, {
        "attachments": productos.map(p => {
          return {
            "title": p.nombre,
            "mrkdwn_in": ["text"],
            "title_link": api.permalink(p.id, location.lat, location.lng),
            "thumb_url": api.img(p.id),
            "text": p.precioMin == p.precioMax ? `$${p.precioMin}` : `$${p.precioMin} a $${p.precioMax}`
          }
        })
      })
    }
  }).catch(e => {
    bot.reply(message, showError(e));
  });
}

function showError(err) {
  return {
    "attachments": [{
      "title": "ERROR",
      "color": "danger",
      "text": err
    }]
  }
}

server.listen(8888)
