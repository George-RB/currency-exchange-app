const jwt = require('jsonwebtoken');

// Секретный ключ должен лежать в .env
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      login: user.login,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '24h' } // токен живёт 24 часа
  );
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // добавляем пользователя в запрос
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Недействительный токен' });
  }
};

module.exports = { generateToken, verifyToken };