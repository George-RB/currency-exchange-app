const express = require('express');
const authRoutes = require('./routes/auth').router;
const operatorRoutes = require('./routes/operator');
const adminRoutes = require('./routes/admin');
require('dotenv').config();
const PORT = 3000;

const app = express();

app.use(express.json());
app.use(require('cors')());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/admin', adminRoutes);

// Новый тестовый роут - получаем курсы валют из БД
app.get('/api/rates', (req, res) => {
  connection.query('SELECT * FROM currency_rates', (error, results) => {
    if (error) {
      console.error('Ошибка запроса:', error);
      return res.status(500).json({ error: 'Ошибка базы данных' });
    }
    res.json(results); // отправляем курсы валют клиенту
  });
});

// connection импортирован
const connection = require('./config/database');

app.get('/api/rates', (req, res) => {
  connection.query(
    'SELECT currency_code, rate FROM currency_rates ORDER BY date DESC',
    (error, results) => {
      if (error) {
        console.error('Ошибка запроса курсов:', error);
        return res.status(500).json({ error: 'Ошибка базы данных' });
      }
      console.log('📋 Курсы из БД:', results); // для диагностики
      res.json(results);
    }
  );
});

app.get('/api/rates/:currency', (req, res) => {});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
