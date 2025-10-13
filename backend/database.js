const mysql = require('mysql2');

// In-memory база данных для демо
let rates = [
  { currency_code: 'USD', rate: 2.5, date: new Date() },
  { currency_code: 'EUR', rate: 3.0, date: new Date() },
  { currency_code: 'BYN', rate: 1.0, date: new Date() },
];

let users = [
  { id: 1, login: 'admin', password: 'admin123', role: 'admin' },
  { id: 2, login: 'operator', password: 'operator123', role: 'operator' },
];

let operations = [];

// Имитация MySQL connection
const connection = {
  query: (sql, params, callback) => {
    console.log('SQL:', sql);
    console.log('Params:', params);

    try {
      // SELECT из currency_rates
      if (sql.includes('currency_rates')) {
        if (sql.includes('ORDER BY date DESC LIMIT 1')) {
          const currency = params[0];
          const rate = rates.find((r) => r.currency_code === currency);
          callback(null, rate ? [rate] : []);
        } else if (sql.includes('WHERE currency_code IN (?)')) {
          const currencies = params[0];
          const result = rates.filter((r) =>
            currencies.includes(r.currency_code)
          );
          callback(null, result);
        } else {
          callback(null, rates);
        }
      }

      // SELECT из users
      else if (sql.includes('users WHERE login')) {
        const user = users.find(
          (u) => u.login === params[0] && u.password === params[1]
        );
        callback(null, user ? [user] : []);
      }

      // INSERT в currency_rates
      else if (sql.includes('INSERT INTO currency_rates')) {
        const newRate = {
          currency_code: params[0],
          rate: parseFloat(params[1]),
          date: new Date(),
        };
        rates.push(newRate);
        callback(null, { insertId: rates.length });
      }

      // INSERT в operations_log
      else if (sql.includes('INSERT INTO operations_log')) {
        const newOp = {
          id: operations.length + 1,
          action_description: params[1],
          datetime: new Date(),
        };
        operations.push(newOp);
        callback(null, { insertId: operations.length });
      }

      // SELECT из operations_log для отчётов
      else if (
        sql.includes('operations_log') &&
        sql.includes('GROUP BY DATE(datetime)')
      ) {
        // Простые mock данные для отчётов
        const reports = [
          { date: '2024-12-19', operations_count: 5 },
          { date: '2024-12-18', operations_count: 3 },
        ];
        callback(null, reports);
      }

      // SELECT из operations_log для истории
      else if (
        sql.includes('operations_log') &&
        sql.includes('ORDER BY datetime DESC')
      ) {
        callback(null, operations.slice(-10).reverse()); // Последние 10 операций
      }

      // DELETE FROM currency_rates (для reset)
      else if (sql.includes('DELETE FROM currency_rates')) {
        rates = [
          { currency_code: 'USD', rate: 2.5, date: new Date() },
          { currency_code: 'EUR', rate: 3.0, date: new Date() },
          { currency_code: 'BYN', rate: 1.0, date: new Date() },
        ];
        callback(null, { affectedRows: 3 });
      } else {
        callback(null, []);
      }
    } catch (error) {
      callback(error);
    }
  },
};

// Имитация connect
connection.connect = (callback) => {
  console.log('✅ In-memory база данных подключена');
  if (callback) callback(null);
};

module.exports = connection;
