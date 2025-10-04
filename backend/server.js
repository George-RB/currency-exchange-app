const express = require('express');
const authRoutes = require('./routes/auth').router;
const operatorRoutes = require('./routes/operator');
const adminRoutes = require('./routes/admin');
const PORT = 3000;

const app = express();

app.use(express.json());
app.use(require('cors')());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/admin', adminRoutes);

const mysql = require('mysql2');

// Настройки подключения к БД
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'r00t',
  database: 'exchange_db',
});

// Проверяем подключение
connection.connect((err) => {
  if (err) {
    console.error('❌ Ошибка подключения к БД:', err);
    return;
  }
  console.log('✅ Успешно подключены к MySQL базе данных');
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

app.get('/api/rates/:currency', (req, res) => {});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
