const Telegraf = require('telegraf');
const RedisSession = require('telegraf-session-redis')

loadConfig = function() {
  const yaml = require('js-yaml');
  const fs = require('fs');
  try {
    return loadedConfig = yaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));
  } catch (e) {
    console.error(e);
  }
};

const config = loadConfig();

const bot = new Telegraf(config.telegram.token, config.telegram.username);

const session = new RedisSession({
  store: {
    host: config.redis.host || '127.0.0.1',
    port: config.redis.port || 6379
  }
})

bot.use(session.middleware());

bot.on('message', (ctx) => {
  ctx.session.previousMessages = ctx.session.previousMessages || [];
  if (ctx.chat.type === "group" || ctx.chat.type === "supergroup") {
    console.log(ctx.session.previousMessages.length);
    if (ctx.session.previousMessages.length === 0) {
      ctx.session.previousMessages.push({
        timestamp: ctx.update.message.date,
        obj: ctx.update.message
      })
    } else {
      ctx.session.previousMessages.forEach((message, index, array) => {
        console.log(Date.now() - message.timestamp);
        if (Date.now() - message.timestamp > 5000) {
          array.pop(message);
        }
        if (message == ctx.update.message && ctx.update.message.date - message.timestamp < 5000) {
          ctx.reply("YOU JUST GOT NINJED", {reply_to_message_id: message.obj.id});
          array.pop(message);
        } else {
          array.push({
            timestamp: ctx.update.message.date,
            obj: ctx.update.message,
            text: ctx.update.message.text
          })
        }
      })
    }
  }

  console.log('Session', ctx.session)
})

/*
 * Start the bot
 */
bot.startPolling();
