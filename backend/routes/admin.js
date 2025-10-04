const express = require('express');
const { simpleAuth } = require('../middleware/auth');
const { logAction } = require('./auth');
const router = express.Router();

// Роут для добавления курсов
router.post('/rates', simpleAuth, (req, res) => {
  const { currency, rate } = req.body;
  const user = req.user;

  // ПРОСТАЯ логика - просто логируем
  logAction(user.login, `Установлен курс ${currency} = ${rate}`);

  res.json({
    success: true,
    message: `Курс ${currency} установлен на ${rate}`,
  });
});

module.exports = router;
