const express = require('express');
const { simpleAuth } = require('../middleware/auth');
const connection = require('../config/database');
const router = express.Router();

// Обновленный роут установки курсов
router.post('/rates', simpleAuth, async (req, res) => {
  const { currency, rate } = req.body;
  const user = req.user;

  // Сохраняем курс в БД
  connection.query(
    'INSERT INTO currency_rates (currency_code, rate, date) VALUES (?, ?, CURDATE())',
    [currency, rate],
    (error) => {
      if (error) {
        console.error('Ошибка сохранения курса:', error);
        return res.status(500).json({ error: 'Ошибка сохранения курса' });
      }

      // Логируем действие
      connection.query(
        'INSERT INTO operations_log (user_id, action_description, datetime) VALUES ((SELECT id FROM users WHERE login = ?), ?, NOW())',
        [user.login, `Установлен курс ${currency} = ${rate}`],
        (error) => {
          if (error) console.error('Ошибка логирования:', error);
        }
      );

      res.json({
        success: true,
        message: `Курс ${currency} установлен на ${rate}`,
      });
    }
  );
});

// Роут для сброса курсов к начальным значениям
router.post('/reset-rates', simpleAuth, (req, res) => {
  const user = req.user;

  // Начальные курсы (можно вынести в конфиг)
  const defaultRates = [
    { currency: 'USD', rate: 2.5 },
    { currency: 'EUR', rate: 3.0 },
    { currency: 'BYN', rate: 1.0 },
  ];

  // Удаляем старые курсы и устанавливаем новые
  connection.query('DELETE FROM currency_rates', (error) => {
    if (error) {
      console.error('Ошибка сброса курсов:', error);
      return res.status(500).json({ error: 'Ошибка сброса курсов' });
    }

    // Добавляем начальные курсы
    const values = defaultRates.map((rate) => [rate.currency, rate.rate]);
    connection.query(
      'INSERT INTO currency_rates (currency_code, rate, date) VALUES ?',
      [values.map((item) => [...item, new Date()])],
      (error) => {
        if (error) {
          console.error('Ошибка установки начальных курсов:', error);
          return res.status(500).json({ error: 'Ошибка установки курсов' });
        }

        // Логируем действие
        connection.query(
          'INSERT INTO operations_log (user_id, action_description, datetime) VALUES ((SELECT id FROM users WHERE login = ?), ?, NOW())',
          [user.login, 'Сброс всех курсов к начальным значениям'],
          (error) => {
            if (error) console.error('Ошибка логирования:', error);
          }
        );

        res.json({
          success: true,
          message: 'Курсы сброшены к начальным значениям',
        });
      }
    );
  });
});

router.get('/reports', simpleAuth, (req, res) => {
  connection.query(
    `SELECT DATE(datetime) as date, COUNT(*) as operations_count
     FROM operations_log 
     WHERE action_description LIKE 'Обмен%'
     GROUP BY DATE(datetime) 
     ORDER BY date DESC`,
    (error, results) => {
      if (error) {
        console.error('Ошибка отчетов:', error);
        return res.status(500).json({ error: 'Ошибка загрузки отчетов' });
      }
      res.json({ success: true, reports: results });
    }
  );
});

module.exports = router;
