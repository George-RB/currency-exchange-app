const express = require('express');
const bcrypt = require('bcryptjs');
const connection = require('../config/database');
const router = express.Router();

// Логин с проверкой хеша пароля
router.post('/login', (req, res) => {
  try {
    const { login, password } = req.body;

    // Ищем пользователя в БД
    connection.query(
      'SELECT * FROM users WHERE login = ?',
      [login],
      async (error, results) => {
        if (error) {
          console.error('❌ Ошибка БД:', error);
          return res.status(500).json({ error: 'Ошибка сервера' });
        }

        // Пользователь не найден
        if (results.length === 0) {
          return res.status(401).json({
            success: false,
            error: 'Неверный логин или пароль'
          });
        }

        const user = results[0];

        try {
          // Сравниваем пароль с хешем
          const isMatch = await bcrypt.compare(password, user.password);
          
          if (isMatch) {
            console.log(`✅ Успешный вход: ${login}`);
            res.json({
              success: true,
              user: {
                id: user.id,
                login: user.login,
                role: user.role
              }
            });
          } else {
            console.log(`❌ Неверный пароль для: ${login}`);
            res.status(401).json({
              success: false,
              error: 'Неверный логин или пароль'
            });
          }
        } catch (err) {
          console.error('❌ Ошибка сравнения паролей:', err);
          res.status(500).json({ error: 'Ошибка сервера' });
        }
      }
    );
  } catch (error) {
    console.error('💥 Ошибка при входе:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Функция для создания нового пользователя (для админов)
router.post('/register', async (req, res) => {
  try {
    const { login, password, role } = req.body;
    
    // Проверяем права (только админ может создавать)
    // TODO: добавить проверку JWT токена

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    
    connection.query(
      'INSERT INTO users (login, password, role) VALUES (?, ?, ?)',
      [login, hashedPassword, role],
      (error) => {
        if (error) {
          console.error('❌ Ошибка создания пользователя:', error);
          return res.status(500).json({ error: 'Ошибка создания пользователя' });
        }
        
        res.json({
          success: true,
          message: 'Пользователь создан'
        });
      }
    );
  } catch (error) {
    console.error('💥 Ошибка:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = { router };