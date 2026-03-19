const express = require("express");
const cookieParser = require("cookie-parser"); // 👈 ПОДНЯЛ ВВЕРХ!
const cors = require("cors"); // 👈 ПОДНЯЛ ВВЕРХ!
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth").router;
const operatorRoutes = require("./routes/operator");
const adminRoutes = require("./routes/admin");
const connection = require("./config/database");

const { globalLimiter } = require("./middleware/rateLimiter");

const app = express();
const PORT = 3000;

// сначала парсеры
// Rate limiting для всех API
app.use("/api", globalLimiter);
app.use(express.json());
app.use(cookieParser());

// CORS для фронтенда
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

// раздача статических файлов фронтенда
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/operator", operatorRoutes);
app.use("/api/admin", adminRoutes);

// для SPA роутинга
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// ЕДИНСТВЕННЫЙ роут для получения курсов
app.get("/api/rates", (req, res) => {
  connection.query(
    "SELECT * FROM currency_rates ORDER BY date DESC",
    (error, results) => {
      if (error) {
        console.error("Ошибка запроса курсов:", error);
        return res.status(500).json({ error: "Ошибка базы данных" });
      }
      console.log("📋 Курсы из БД:", results.length);
      res.json(results);
    },
  );
});

// Роут для получения курса конкретной валюты
app.get("/api/rates/:currency", (req, res) => {
  const currency = req.params.currency;
  connection.query(
    "SELECT * FROM currency_rates WHERE currency_code = ? ORDER BY date DESC",
    [currency],
    (error, results) => {
      if (error) {
        console.error("Ошибка запроса курса:", error);
        return res.status(500).json({ error: "Ошибка базы данных" });
      }
      res.json(results);
    },
  );
});

// Обработчик ошибок
app.use((err, req, res, next) => {
  console.error("💥 Глобальная ошибка:", err);
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
