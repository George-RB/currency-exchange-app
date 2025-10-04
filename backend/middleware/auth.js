// backend/middleware/simple-auth.js - ПРОСТАЯ АВТОРИЗАЦИЯ

const simpleAuth = (req, res, next) => {
  // Получаем логин и роль из заголовков (вместо сложного JWT)
  const userLogin = req.headers['x-user-login'];
  const userRole = req.headers['x-user-role'];

  // Просто проверяем, что они есть
  if (!userLogin || !userRole) {
    return res.status(401).json({ error: 'Не авторизован' });
  }

  // Добавляем пользователя в запрос (как в старом коде, но проще)
  req.user = {
    login: userLogin,
    role: userRole,
  };

  next(); // Передаем управление дальше
};

module.exports = { simpleAuth };
