const express = require('express');
const { verifyToken } = require('../middleware/jwtAuth');
const roleAuth = require('../middleware/roleAuth'); // если сделаем отдельно, но пока можно встроить
const connection = require('../config/database');
const router = express.Router();

// 👇 Все роуты ниже требуют валидный JWT и роль operator
router.use(verifyToken);
router.use((req, res, next) => {
if (req.user.role.toLowerCase() !== 'operator') {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }
  next();
});

// Обмен валют
router.post('/exchange', async (req, res) => {
  const { fromCurrency, toCurrency, amount } = req.body;
  const user = req.user; // 👈 теперь из токена

  try {
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Сумма должна быть положительной' });
    }

    const fromRate = await getCurrentRate(fromCurrency);
    const toRate = await getCurrentRate(toCurrency);

    if (!fromRate || !toRate) {
      return res.status(400).json({ error: 'Курсы для валют не найдены' });
    }

    const result = (amount * fromRate) / toRate;

    connection.query(
      `INSERT INTO operations_log (user_id, action_description, datetime, amount, from_currency, to_currency, result_amount)
       VALUES ((SELECT id FROM users WHERE login = ?), ?, NOW(), ?, ?, ?, ?)`,
      [
        user.login,
        `Обмен ${amount} ${fromCurrency} → ${result.toFixed(2)} ${toCurrency}`,
        amount,
        fromCurrency,
        toCurrency,
        result,
      ],
      (error) => {
        if (error) {
          console.error('❌ Ошибка сохранения:', error);
          return res.status(500).json({ error: 'Ошибка сохранения операции' });
        }

        res.json({
          success: true,
          result: result.toFixed(2),
          rate: (fromRate / toRate).toFixed(4),
        });
      }
    );
  } catch (error) {
    console.error('💥 Ошибка при обмене:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// История
router.get('/history', (req, res) => {
  const user = req.user;

  connection.query(
    `SELECT action_description, datetime 
     FROM operations_log 
     WHERE user_id = (SELECT id FROM users WHERE login = ?) 
     AND DATE(datetime) = CURDATE()
     ORDER BY datetime DESC`,
    [user.login],
    (error, results) => {
      if (error) {
        console.error('Ошибка загрузки истории:', error);
        return res.status(500).json({ error: 'Ошибка загрузки истории' });
      }
      res.json({ success: true, history: results });
    }
  );
});

// Вспомогательная функция
const getCurrentRate = async (currencyCode) => {
  return new Promise((resolve, reject) => {
    connection.query(
      'SELECT rate FROM currency_rates WHERE currency_code = ? ORDER BY date DESC LIMIT 1',
      [currencyCode],
      (error, results) => {
        if (error) return reject(error);
        resolve(results[0] ? results[0].rate : null);
      }
    );
  });
};

module.exports = router;