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

module.exports = router;
