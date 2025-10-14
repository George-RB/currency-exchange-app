const express = require('express');
const authRoutes = require('./routes/auth').router;
const operatorRoutes = require('./routes/operator');
const adminRoutes = require('./routes/admin');
const path = require('path');
require('dotenv').config();
const PORT = 3000;
const connection = require('./config/database');

const app = express();

app.use(express.json());
// app.use(require('cors')());
app.use(
  require('cors')({
    origin: [
      'http://localhost:5173',
      'https://currency-exchange-app-zkkc.onrender.com',
      'http://localhost:3000',
    ],
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

// раздача статических файлов фронтенда
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/admin', adminRoutes);

// для SPA роутинга
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

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
