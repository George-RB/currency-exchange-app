// scripts/hash-passwords.js
const bcrypt = require('bcryptjs');
const connection = require('../config/database');

async function hashPasswords() {
  console.log('🔐 Начинаем хеширование паролей...');
  
  // Получаем всех пользователей
  connection.query('SELECT id, login, password FROM users', async (error, users) => {
    if (error) {
      console.error('❌ Ошибка получения пользователей:', error);
      process.exit(1);
    }

    for (const user of users) {
      // Проверяем, не захеширован ли уже пароль
      if (user.password.length < 20) { // Простая проверка
        try {
          // Хешируем пароль
          const hashedPassword = await bcrypt.hash(user.password, 10);
          
          // Обновляем в базе
          connection.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, user.id],
            (err) => {
              if (err) {
                console.error(`❌ Ошибка обновления пользователя ${user.login}:`, err);
              } else {
                console.log(`✅ Пароль для ${user.login} захеширован`);
              }
            }
          );
        } catch (err) {
          console.error(`❌ Ошибка хеширования для ${user.login}:`, err);
        }
      } else {
        console.log(`⏭️ Пароль для ${user.login} уже захеширован`);
      }
    }
    
    console.log('🎉 Хеширование завершено!');
    process.exit(0);
  });
}

hashPasswords();