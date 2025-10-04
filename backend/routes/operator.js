const express = require('express');
const { simpleAuth } = require('../middleware/auth');
const { logAction } = require('./auth');
const router = express.Router();

// Роут для обмена валют
router.post('/exchange', simpleAuth, (req, res) => {
  const { fromCurrency, toCurrency, amount } = req.body;
  const user = req.user;

  // ПРОСТАЯ логика конвертации (пока фиктивная)
  const rates = {
    'USD-EUR': 0.85,
    'EUR-USD': 1.18,
    'USD-BYN': 3.25,
    'BYN-USD': 0.31,
  };

  const rate = rates[`${fromCurrency}-${toCurrency}`] || 1;
  const result = amount * rate;

  // Логируем действие
  logAction(
    user.login,
    `Обмен ${amount} ${fromCurrency} -> ${result.toFixed(2)} ${toCurrency}`
  );

  res.json({
    success: true,
    result: result.toFixed(2),
    rate: rate,
  });
});

module.exports = router;
