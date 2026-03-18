const express = require('express');
const bcrypt = require('bcryptjs');
const connection = require('../config/database');
const { generateToken } = require('../middleware/jwtAuth'); // 👈 добавили
const router = express.Router();

router.post('/login', (req, res) => {
  try {
    const { login, password } = req.body;

    connection.query(
      'SELECT * FROM users WHERE login = ?',
      [login],
      async (error, results) => {
        if (error || results.length === 0) {
          return res.status(401).json({ success: false, error: 'Неверный логин или пароль' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return res.status(401).json({ success: false, error: 'Неверный логин или пароль' });
        }

        // 👇 Генерируем токен
        const token = generateToken(user);

        res.json({
          success: true,
          token, // 👈 отправляем на фронтенд
          user: {
            id: user.id,
            login: user.login,
            role: user.role,
          },
        });
      }
    );
  } catch (error) {
    console.error('💥 Ошибка:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = { router };