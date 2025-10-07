const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'r00t',
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
