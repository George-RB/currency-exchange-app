const express = require("express");
const bcrypt = require("bcryptjs");
const connection = require("../config/database");
const { generateToken } = require("../middleware/jwtAuth");
const router = express.Router();
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/login", authLimiter, async (req, res) => {
  try {
    const { login, password } = req.body;

    connection.query(
      "SELECT * FROM users WHERE login = ?",
      [login],
      async (error, results) => {
        if (error || results.length === 0) {
          return res
            .status(401)
            .json({ success: false, error: "Неверный логин или пароль" });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return res
            .status(401)
            .json({ success: false, error: "Неверный логин или пароль" });
        }

        // Генерируем токен
        const token = generateToken(user);
        console.log("✅ Сгенерирован токен:", token);

        // Устанавливаем HTTP-Only куку
        res.cookie("token", token, {
          httpOnly: true, // ❌ Недоступно из JavaScript
          secure: false, // false для localhost (в продакшене true)
          sameSite: "lax", // Защита от CSRF
          maxAge: 24 * 60 * 60 * 1000, // 24 часа
        });

        // Отправляем только пользователя (без токена)
        res.json({
          success: true,
          user: {
            id: user.id,
            login: user.login,
            role: user.role,
          },
        });
      },
    );
  } catch (error) {
    console.error("💥 Ошибка:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true });
});

module.exports = { router };
