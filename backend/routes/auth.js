const express = require('express');
const router = express.Router();

// ПРОСТАЯ проверка логина/пароля (без шифрования, только для разработки!)
router.post('/login', (req, res) => {
  try {
    const { login, password } = req.body;

    // ПРОСТАЯ проверка (вместо сложной с bcrypt)
    if (login === 'admin' && password === 'admin123') {
      return res.json({
        success: true,
        user: {
          login: 'admin',
          role: 'admin',
        },
      });
    }

    if (login === 'operator' && password === 'operator123') {
      return res.json({
        success: true,
        user: {
          login: 'operator',
          role: 'operator',
        },
      });
    }

    // Если не совпало
    res.status(401).json({
      success: false,
      error: 'Неверный логин или пароль',
    });
  } catch (error) {
    console.error('Ошибка при входе:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Простая функция для логирования действий
const logAction = (userLogin, action) => {
  console.log(`[${new Date().toISOString()}] ${userLogin} (${action})`);
  // Позже добавим запись в БД
};

// Добавляем к экспорту
module.exports = { router, logAction };
