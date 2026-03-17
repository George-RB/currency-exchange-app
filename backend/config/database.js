
// const mysql = require('mysql2'); // 👈 без /promise

// const connection = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   port: process.env.DB_PORT || 3306,
// });

// connection.connect((err) => {
//   if (err) {
//     console.error('❌ Ошибка подключения к БД:', err);
//     return;
//   }
//   console.log('✅ Успешно подключены к MySQL');
// });

// module.exports = connection;
const mysql = require('mysql2');

// Загружаем .env
require('dotenv').config();

// ВРЕМЕННО: используем прямые данные для проверки
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root123',
  database: 'currency_exchange',
  port: 3306,
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Ошибка подключения к БД:', err);
    return;
  }
  console.log('✅ Успешно подключены к MySQL');
});

module.exports = connection;