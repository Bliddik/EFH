const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');  // Для простоты — файл; лучше Firebase

const token = 'YOUR_BOT_TOKEN';  // Из BotFather
const providerToken = 'YOUR_PROVIDER_TOKEN';  // Из платежей
const bot = new TelegramBot(token, { polling: true });

// Простое хранилище (замените на API/BaaS)
let donats = {};  // {xuid: {status: 'paid', tag: 'vip', id: Date.now()}}

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Привет! Введи свой XUID или ник:');
});

bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {  // Сохраняем XUID/ник
    const xuid = msg.text;  // Валидация: если не число — ник
    bot.sendMessage(msg.chat.id, 'Выбери товар: /vip за 100 RUB');

    bot.once('text', (choice) => {
      if (choice.text === '/vip') {
        bot.sendInvoice(msg.chat.id, 'VIP-статус', 'Получи VIP на сервере!', 'payload_vip', providerToken,
          'RUB', [{ label: 'VIP', amount: 10000 }]);  // 100 RUB = 10000 коп
      }
    });
  }
});

// Pre-checkout (обязательно в 10 сек)
bot.on('pre_checkout_query', (query) => {
  bot.answerPreCheckoutQuery(query.id, true);  // Подтверждаем
});

// Успешная оплата
bot.on('successful_payment', (msg) => {
  const xuid = 'XUID_ИЗ_СООБЩЕНИЯ';  // Сохраните из предыдущего (используйте state)
  donats[xuid] = { status: 'paid', tag: 'vip', timestamp: Date.now() };
  fs.writeFileSync('donats.json', JSON.stringify(donats));  // Сохраняем
  bot.sendMessage(msg.chat.id, 'Оплата прошла! VIP выдастся через 1-5 мин на сервере.');
});

// API для Minecraft (простой endpoint на Glitch)
const express = require('express');
const app = express();
app.get('/check', (req, res) => {
  const xuid = req.query.xuid;
  res.json(donats[xuid] || { status: 'none' });
});
app.listen(3000);
