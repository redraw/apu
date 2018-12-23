const api = require('./api')
const barcode = require('./barcode')

const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const session = require('telegraf/session')

const bot = new Telegraf(process.env.TELEGRAM_TOKEN)

bot.use(session())
bot.use(location())

bot.start(ctx => {
  ctx.replyWithMarkdown('Buenos dias ✌')
})

bot.command('ubicacion', ctx => {
  return requestLocation(ctx)
})

bot.on('text', ctx => {
  ctx.replyWithChatAction('typing')
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
  ctx.reply('Dígame un producto o envía una foto con un codigo de barras🔎')
})

bot.on('photo', ctx => {
  ctx.reply('Espere un momentos')
  ctx.replyWithChatAction('typing')
  console.log('[photo]', ctx.message)
  const photo = ctx.message.photo.pop()
  ctx.telegram.getFileLink(photo.file_id).then(url => {
    barcode.reader.decode(url).then(code => {
      const {latitude, longitude} = ctx.session.location
      api.producto(code, latitude, longitude).then(data => {
        const p = data.producto
        const permalink = api.permalink(p.id, latitude, longitude)
        ctx.replyWithMarkdown(`*${p.nombre}*\n[img](${api.img(p.id)}) | [link](${permalink})`)
        let text = data.sucursales.map(s => {
          const mapLink = `https://google.com/maps?q=${s.lat},${s.lng}`
          return `📍 [${s.banderaDescripcion}](${mapLink}) (${s.distanciaDescripcion}) $${s.preciosProducto.precioLista}`
        }).join("\n")
        ctx.replyWithMarkdown(text, {
          disable_web_page_preview: true
        })
      })
    }).catch(err => {
      ctx.reply(err)
    })
  })
})

function location() {
  return (ctx, next) => {
    if (ctx.message.text == '/start' || ctx.session.location || ctx.message.location) {
      return next(ctx)
    } else {
      return requestLocation(ctx)
    }
  }
}

function requestLocation(ctx) {
  return ctx.reply('Necesitaré su ubicación para buscar precios cercas suyo',
    Extra.markup(markup => {
      return markup.oneTime().resize()
        .keyboard([markup.locationRequestButton('Enviar ubicación')])
      }
    )
  )
}

// zeit now hack
const server = require('http').createServer((req, res) => res.end('ok'))
server.listen(8888)

bot.startPolling()
