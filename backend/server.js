// const express = require('express');
// const authRoutes = require('./routes/auth').router;
// const operatorRoutes = require('./routes/operator');
// const adminRoutes = require('./routes/admin');
// const path = require('path');
// require('dotenv').config();
// const PORT = 3000;
// const connection = require('./config/database');

// const app = express();

// app.use(express.json());
// app.use(require('cors')());

// // раздача статических файлов фронтенда
// app.use(express.static(path.join(__dirname, '../frontend/dist')));

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/operator', operatorRoutes);
// app.use('/api/admin', adminRoutes);

// // для SPA роутинга
// app.get('/*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
// });

// // Новый тестовый роут - получаем курсы валют из БД
// app.get('/api/rates', (req, res) => {
//   connection.query('SELECT * FROM currency_rates', (error, results) => {
//     if (error) {
//       console.error('Ошибка запроса:', error);
//       return res.status(500).json({ error: 'Ошибка базы данных' });
//     }
//     res.json(results); // отправляем курсы валют клиенту
//   });
// });

// // connection импортирован

// app.get('/api/rates', (req, res) => {
//   connection.query(
//     'SELECT currency_code, rate FROM currency_rates ORDER BY date DESC',
//     (error, results) => {
//       if (error) {
//         console.error('Ошибка запроса курсов:', error);
//         return res.status(500).json({ error: 'Ошибка базы данных' });
//       }
//       console.log('📋 Курсы из БД:', results); // для диагностики
//       res.json(results);
//     }
//   );
// });

// app.get('/api/rates/:currency', (req, res) => {});

// app.listen(PORT, () => {
//   console.log(`Сервер запущен на порту ${PORT}`);
// });

const express = require('express');
const authRoutes = require('./routes/auth').router;
const operatorRoutes = require('./routes/operator');
const adminRoutes = require('./routes/admin');
require('dotenv').config();
const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(require('cors')());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/rates', (req, res) => {
  const connection = require('./config/database');
  connection.query('SELECT * FROM currency_rates', (error, results) => {
    if (error) {
      console.error('Ошибка запроса:', error);
      return res.status(500).json({ error: 'Ошибка базы данных' });
    }
    res.json(results);
  });
});

// ✅ СУПЕР-ПРОСТОЙ КОРНЕВОЙ РОУТ
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Обменник валют - Работает! 🎉</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container { 
            background: white; 
            padding: 40px; 
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 500px;
            width: 100%;
            text-align: center;
          }
          h1 { 
            color: #333; 
            margin-bottom: 20px;
            font-size: 2.5em;
          }
          .success { 
            color: #28a745; 
            font-size: 1.2em;
            font-weight: bold;
            margin: 20px 0;
          }
          .btn { 
            padding: 15px 30px; 
            margin: 10px; 
            font-size: 16px; 
            background: #007bff; 
            color: white; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer;
            transition: all 0.3s;
            font-weight: bold;
          }
          .btn:hover { 
            background: #0056b3; 
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,123,255,0.3);
          }
          .btn-admin { background: #28a745; }
          .btn-admin:hover { background: #1e7e34; }
          .btn-operator { background: #17a2b8; }
          .btn-operator:hover { background: #138496; }
          .test-section { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 10px;
            margin: 20px 0;
          }
          #result { 
            margin-top: 20px; 
            text-align: left; 
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
            max-height: 300px;
            overflow-y: auto;
          }
          .user-info {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
            padding: 15px;
            background: #e7f3ff;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🏦 Обменник валют</h1>
          <div class="success">✅ Проект успешно запущен!</div>
          <p>Full-stack приложение для обмена валют с авторизацией</p>
          
          <div class="user-info">
            <div><strong>Админ:</strong> admin / admin123</div>
            <div><strong>Оператор:</strong> operator / operator123</div>
          </div>

          <div class="test-section">
            <h3>Быстрый тест:</h3>
            <button class="btn btn-admin" onclick="login('admin', 'admin123')">Войти как Админ</button>
            <button class="btn btn-operator" onclick="login('operator', 'operator123')">Войти как Оператор</button>
            <button class="btn" onclick="testRates()">Проверить курсы</button>
          </div>

          <div id="result"></div>
        </div>
        
        <script>
          async function login(login, password) {
            try {
              showResult('⌛ Отправка запроса...');
              const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, password })
              });
              const data = await response.json();
              
              if (data.success) {
                showResult('✅ УСПЕШНЫЙ ВХОД!\\\\n\\\\n' + 
                  'Пользователь: ' + data.user.login + '\\\\n' +
                  'Роль: ' + data.user.role + '\\\\n\\\\n' +
                  'API работает корректно! Все функции доступны.');
              } else {
                showResult('❌ Ошибка: ' + data.error);
              }
            } catch (error) {
              showResult('❌ Ошибка соединения: ' + error);
            }
          }
          
          async function testRates() {
            try {
              showResult('⌛ Загрузка курсов...');
              const response = await fetch('/api/rates');
              const data = await response.json();
              showResult('📊 КУРСЫ ВАЛЮТ:\\\\n\\\\n' + 
                data.map(rate => rate.currency_code + ': ' + rate.rate).join('\\\\n'));
            } catch (error) {
              showResult('❌ Ошибка: ' + error);
            }
          }
          
          function showResult(message) {
            document.getElementById('result').innerHTML = 
              '<pre style="white-space: pre-wrap;">' + message + '</pre>';
          }

          // Авто-тест при загрузке
          setTimeout(() => testRates(), 1000);
        </script>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log('🚀 Сервер запущен на порту ' + PORT);
  console.log('✅ Бэкенд готов к работе!');
});
