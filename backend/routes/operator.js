const express = require('express');
const { simpleAuth } = require('../middleware/auth');
const connection = require('../config/database'); // Добавляем подключение к БД
const router = express.Router();

// Функция для получения актуального курса из БД
const getCurrentRate = async (currencyCode) => {
  return new Promise((resolve, reject) => {
    connection.query(
      'SELECT rate FROM currency_rates WHERE currency_code = ? ORDER BY date DESC LIMIT 1',
      [currencyCode],
      (error, results) => {
        if (error) reject(error);
        resolve(results[0] ? results[0].rate : null);
      }
    );
  });
};

// Обновленный роут обмена валют
router.post('/exchange', simpleAuth, async (req, res) => {
  const { fromCurrency, toCurrency, amount } = req.body;
  const user = req.user;

  try {
    // Получаем реальные курсы из БД
    const fromRate = await getCurrentRate(fromCurrency);
    const toRate = await getCurrentRate(toCurrency);

    if (!fromRate || !toRate) {
      return res.status(400).json({ error: 'Курс для валюты не найден' });
    }

    // Рассчитываем результат (через базовую валюту)
    const amountInBase = amount * fromRate; // Конвертируем в базовую валюту
    const result = amountInBase / toRate; // Конвертируем в целевую валюту

    // Сохраняем операцию в БД
    connection.query(
      'INSERT INTO operations_log (user_id, action_description, datetime) VALUES ((SELECT id FROM users WHERE login = ?), ?, NOW())',
      [
        user.login,
        `Обмен ${amount} ${fromCurrency} -> ${result.toFixed(2)} ${toCurrency}`,
      ],
      (error) => {
        if (error) {
          console.error('Ошибка сохранения операции:', error);
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
    console.error('Ошибка при обмене:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавь в operator.js
router.get('/history', simpleAuth, (req, res) => {
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
        console.error('Ошибка получения истории:', error);
        return res.status(500).json({ error: 'Ошибка получения истории' });
      }

      res.json({
        success: true,
        history: results,
      });
    }
  );
});

module.exports = router;
