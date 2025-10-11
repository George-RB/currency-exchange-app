const express = require('express');
const { simpleAuth } = require('../middleware/auth');
const connection = require('../config/database');
const router = express.Router();

router.post('/exchange', simpleAuth, async (req, res) => {
  console.log('🟢 POST /exchange вызван');
  console.log('📦 Тело запроса:', req.body);

  const { fromCurrency, toCurrency, amount } = req.body;
  const user = req.user;

  try {
    // Валидация
    if (!amount || amount <= 0) {
      console.log('❌ Неверная сумма:', amount);
      return res.status(400).json({ error: 'Сумма должна быть положительной' });
    }
    if (fromCurrency === toCurrency) {
      console.log('❌ Одинаковые валюты:', fromCurrency, toCurrency);
      return res.status(400).json({ error: 'Валюты должны быть разными' });
    }

    // Получаем курсы
    console.log(`🔍 Получаем курс для ${fromCurrency}...`);
    const fromRate = await getCurrentRate(fromCurrency);
    console.log(`🔍 Получаем курс для ${toCurrency}...`);
    const toRate = await getCurrentRate(toCurrency);

    console.log('📊 Курсы из БД:', {
      fromCurrency,
      fromRate,
      toCurrency,
      toRate,
    });

    // Проверяем что курсы найдены
    if (fromRate === null || toRate === null) {
      console.error('❌ Курсы не найдены');
      return res.status(400).json({ error: 'Курсы для валют не найдены' });
    }

    // Расчет
    const result = (amount * fromRate) / toRate;
    console.log(
      '🧮 Расчет:',
      `${amount} × ${fromRate} / ${toRate} = ${result}`
    );

    // Сохранение
    connection.query(
      'INSERT INTO operations_log (user_id, action_description, datetime) VALUES ((SELECT id FROM users WHERE login = ?), ?, NOW())',
      [
        user.login,
        `Обмен ${amount} ${fromCurrency} -> ${result.toFixed(2)} ${toCurrency}`,
      ],
      (error) => {
        if (error) {
          console.error('❌ Ошибка сохранения:', error);
          return res.status(500).json({ error: 'Ошибка сохранения операции' });
        }

        console.log('✅ Операция успешно сохранена');
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
const getCurrentRate = async (currencyCode) => {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Ищем курс для: ${currencyCode}`);

    connection.query(
      'SELECT rate FROM currency_rates WHERE currency_code = ? ORDER BY date DESC LIMIT 1',
      [currencyCode],
      (error, results) => {
        if (error) {
          console.error(`❌ Ошибка БД для ${currencyCode}:`, error);
          reject(error);
          return;
        }

        console.log(`📊 Результат запроса для ${currencyCode}:`, results);
        resolve(results[0] ? results[0].rate : null);
      }
    );
  });
};
module.exports = router;
