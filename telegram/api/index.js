const api = require('./_preciosclaros')
const barcode = require('./_barcode')

const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const RedisSession = require('telegraf-session-redis')

const bot = new Telegraf(process.env.TELEGRAM_TOKEN, {
  telegram: {webhookReply: true}
})

const session = new RedisSession({
  store: { url: process.env.REDIS_URL || 'redis://127.0.0.1' }
})

bot.use(session)
bot.use(location())

bot.start(async ctx => {
  await ctx.replyWithMarkdown('Buenos dias ✌')
})

bot.command('ubicacion', ctx => {
  return requestLocation(ctx)
})

bot.on('text', async ctx => {
  await ctx.replyWithChatAction('typing')
  const {latitude, longitude} = ctx.session.location
  return api.buscar(ctx.message.text, latitude, longitude).then(async data => {
    console.log('[buscar]', data)
    const productos = data.productos.filter(p => p.cantSucursalesDisponible > 0);
    if (productos.length <= 0) {
      await ctx.reply('No results, vuelvas prontos')
    } else {
      return ctx.replyWithMarkdown(
        productos.map((p, idx) => `*${idx+1}* 🛒 ${e(p.nombre)} desde *$${p.precioMin}*`).join("\n\n"),
        Extra.webPreview(false).markup(m => {
          return m.inlineKeyboard(productos.map((p, idx) => {
            return m.callbackButton(idx+1, p.id)
          }))
        })
      )
    }
  })
})

bot.on('callback_query', async ctx => {
  await ctx.answerCbQuery(`Buscando...`)
  const code = ctx.callbackQuery.data
  console.log('[callback_query]', code)
  return replyWithProduct(ctx, code)
})

bot.on('location', async ctx => {
  ctx.session.location = ctx.message.location
  await ctx.reply('Dígame un producto o envíe una foto con un codigo de barras🔎')
})

bot.on('photo', async ctx => {
  await ctx.reply('Espere un momentos')
  await ctx.replyWithChatAction('typing')
  const photo = ctx.message.photo.pop()
  return ctx.telegram.getFileLink(photo.file_id).then(url => {
    return barcode.reader.decode(url).then(code => {
      return replyWithProduct(ctx, code)
    }).catch(err => {
      return ctx.reply(err)
    })
  }).catch(err => {
    return ctx.reply(err)
  })
})

async function replyWithProduct(ctx, code) {
  const {latitude, longitude} = ctx.session.location
  return api.producto(code, latitude, longitude).then(async data => {
    if (data.total === 0) {
      return ctx.reply('No results, vuelvas prontos')
    }
    const producto = data.producto
    const permalink = api.permalink(producto.id, latitude, longitude)
    let text = `[🛒](${permalink}) *${e(producto.nombre)}*\n\n`
    text += data.sucursales.map(s => {
      const mapLink = `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`
      let item = `📍 [${e(s.banderaDescripcion)}](${mapLink}) (${s.distanciaNumero.toFixed(2)}km) a *$${s.preciosProducto.precioLista}*`
      if (s.preciosProducto.promo1.precio) {
        item += `\n🎁 *$${s.preciosProducto.promo1.precio}* ${e(s.preciosProducto.promo1.descripcion)}`
      }
      if (s.preciosProducto.promo2.precio) {
        item += `\n🎁 *$${s.preciosProducto.promo2.precio}* ${e(s.preciosProducto.promo2.descripcion)}`
      }
      return item
    }).join("\n\n")
    return ctx.replyWithPhoto({ url: api.img(producto.id) }, { 
      caption: text,
      parse_mode: 'Markdown',
    }).catch(err => {
      if (err.response.description.includes("IMAGE_PROCESS_FAILED")) {
        return ctx.replyWithMarkdown(text, { disable_web_page_preview: true })
      }
      return ctx.reply(err)
    })
  }).catch(err => {
    return ctx.reply(err)
  })
}

function location() {
  return (ctx, next) => {
    if (ctx.message && (ctx.message.text == '/start' || ctx.message.location) || ctx.session.location) {
      return next(ctx)
    } else {
      return requestLocation(ctx)
    }
  }
}

function requestLocation(ctx) {
  return ctx.reply('Necesitaré una ubicación para buscar precios cercas suyos.\nPuedes compartir una ubicación distinta pulsando en 📎, moviendo el pin en el mapa.',
    Extra.markup(markup => {
      return markup.oneTime().resize()
        .keyboard([markup.locationRequestButton('Enviar ubicación')])
      }
    )
  )
}

function e(text) {
  const SPECIAL_CHARS = [ '\\', '_', '*', '[', ']', '(', ')', '~', '`', '>', '<', '&', '#', '+', '-', '=', '|', '{', '}', '.', '!' ]
  SPECIAL_CHARS.forEach(char => (text = text.replaceAll(char, `\\${char}`)))
  return text
}

export default async function handler(request, response) {
  console.log('[request]', request.body)
  try {
    await bot.handleUpdate(request.body)
    return response.status(200).send('OK')
  } catch (error) {
    console.error(error)
    return response.status(500).send('Error')
  }
}
