const jwt = require("jsonwebtoken");

// Секретный ключ должен лежать в .env
const JWT_SECRET = process.env.JWT_SECRET || "theSecret012345";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      login: user.login,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "24h" }, // токен живёт 24 часа
  );
};

const verifyToken = (req, res, next) => {
  // Читаем токен из куки вместо заголовка
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Не авторизован" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Недействительный токен" });
  }
};

module.exports = { generateToken, verifyToken };
