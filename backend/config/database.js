const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'exchange_db',
});

connection.connect((err) => {
  if (err) {
    console.log('Ошибка подключения к БД: ', err);
    return;
  }
  console.log('✅ Успешно подключены к MySQL базе данных');
});

module.exports = connection;
