const api = require('./api')
const request = require('request')
const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const session = require('telegraf/session')

const bot = new Telegraf(process.env.TELEGRAM_TOKEN)

bot.use(session())
bot.use(requestLocation())

bot.start(ctx => {
  ctx.replyWithMarkdown('Buenos dias ✌')
})

bot.on('text', ctx => {
  ctx.reply('Espere un momentos')
  const {latitude, longitude} = ctx.session.location
  
  api.buscar(ctx.message.text, latitude, longitude).then(data => {
    const productos = data.productos.filter(p => p.cantSucursalesDisponible > 0);
    if (productos.length <= 0) {
      ctx.reply('No results, vuelvas prontos')
    } else {
      const text = productos.map(p => {
        const permalink = api.permalink(p.id, latitude, longitude)
        const img = api.img(p.id)
        return `🛒 [${p.nombre}](${permalink}) desde $${p.precioMin}`
      }).join("\n")
      ctx.replyWithMarkdown(text, {
        disable_web_page_preview: true
      })
    }
  })
})

bot.on('location', ctx => {
  console.log('[location]', ctx.message)
  ctx.session.location = ctx.message.location
  ctx.reply('Dígame un producto')
})

bot.on('photo', ctx => {
  console.log('[photo]', ctx.message)
  const photo = ctx.message.photo.pop()
  ctx.telegram.getFileLink(photo.file_id).then(url => {
    const decoder = `https://api.qrserver.com/v1/read-qr-code/`
    request(`${decoder}?fileurl=${encodeURIComponent(url)}`, (err, res, body) => {
      console.log(body)
    })
    // Jimp.read(url).then(image => {
    //   const {data, width, height} = image.bitmap
    //   const code = jsqr(data, width, height)
    // })
  })
})

function requestLocation() {
  return (ctx, next) => {
    if (ctx.message.text == '/start' || ctx.session.location || ctx.message.location) {
      return next(ctx)
    } else {
      return ctx.reply('Necesitos su ubicación para buscar precios cercas suyo', 
        Extra.markup(markup => {
          return markup.oneTime().resize()
            .keyboard([markup.locationRequestButton('Enviar ubicación')])
          }
        )
      )
    }
  }
}

bot.startPolling()