// const mysql = require('mysql2');
// require('dotenv').config();

// const connection = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: 'exchange_db',
// });

// connection.connect((err) => {
//   if (err) {
//     console.log('Ошибка подключения к БД: ', err);
//     return;
//   }
//   console.log('✅ Успешно подключены к MySQL базе данных');
// });

// module.exports = connection;
// const mysql = require('mysql2');

// const connection = mysql.createConnection({
//   host: process.env.DB_HOST || 'db4free.net',
//   user: process.env.DB_USER || 'exchange_db',
//   password: process.env.DB_PASSWORD || 'exchange_db0',
//   database: process.env.DB_NAME || 'exchange_db',
//   port: process.env.DB_PORT || 3306,
// });

// connection.connect((err) => {
//   if (err) {
//     console.log('Ошибка подключения к БД: ', err);
//     return;
//   }
//   console.log('✅ Успешно подключены к MySQL базе данных');
// });

// module.exports = connection;
const mysql = require('mysql2'); // 👈 без /promise

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Ошибка подключения к БД:', err);
    return;
  }
  console.log('✅ Успешно подключены к MySQL');
});

module.exports = connection;
