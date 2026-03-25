const express = require("express");
const bcrypt = require("bcryptjs");
const connection = require("../config/database");
const { generateToken } = require("../middleware/jwtAuth");
const router = express.Router();

router.post("/login", async (req, res) => {
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

        const token = generateToken(user);

        res.cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 24 * 60 * 60 * 1000,
        });

        // Логируем успешный вход
        connection.query(
          `INSERT INTO operations_log (user_id, action_description, operation_type, datetime, ip_address) 
   VALUES ((SELECT id FROM users WHERE login = ?), ?, 'login', NOW(), ?)`,
          [
            login,
            `Успешный вход: ${login}`,
            req.ip || req.socket.remoteAddress,
          ],
          (err) => {
            if (err) console.error("Ошибка логирования входа:", err);
          },
        );

        // Логируем неудачную попытку входа
        connection.query(
          `INSERT INTO operations_log (user_id, action_description, operation_type, datetime, ip_address) 
   VALUES (NULL, ?, 'login', NOW(), ?)`,
          [
            `Неудачная попытка входа: ${login}`,
            req.ip || req.socket.remoteAddress,
          ],
          (err) => {
            if (err)
              console.error("Ошибка логирования неудачной попытки:", err);
          },
        );

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
  // Получаем пользователя из куки
  const token = req.cookies.token;
  let userLogin = null;

  if (token) {
    try {
      const decoded = require("jsonwebtoken").verify(
        token,
        process.env.JWT_SECRET,
      );
      userLogin = decoded.login;
    } catch (err) {
      console.error("Ошибка при выходе:", err);
    }
  }

  // Логируем выход
  if (userLogin) {
    connection.query(
      `INSERT INTO operations_log (user_id, action_description, operation_type, datetime, ip_address) 
       VALUES ((SELECT id FROM users WHERE login = ?), ?, 'logout', NOW(), ?)`,
      [
        userLogin,
        `Выход из системы: ${userLogin}`,
        req.ip || req.socket.remoteAddress,
      ],
      (err) => {
        if (err) console.error("Ошибка логирования выхода:", err);
      },
    );
  }

  res.clearCookie("token");
  res.json({ success: true });
});

module.exports = { router };
