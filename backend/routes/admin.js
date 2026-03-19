const express = require("express");
const { verifyToken } = require("../middleware/jwtAuth");
const roleAuth = require("../middleware/roleAuth");
const connection = require("../config/database");
const router = express.Router();

// Все роуты ниже требуют токен и роль admin
router.use(verifyToken);
router.use(roleAuth("admin"));

// Установка курса
router.post("/rates", async (req, res) => {
  const { currency, rate } = req.body;
  const user = req.user; // теперь из JWT токена

  connection.query(
    "INSERT INTO currency_rates (currency_code, rate, date) VALUES (?, ?, CURDATE())",
    [currency, rate],
    (error) => {
      if (error) {
        console.error("Ошибка сохранения курса:", error);
        return res.status(500).json({ error: "Ошибка сохранения курса" });
      }

      connection.query(
        "INSERT INTO operations_log (user_id, action_description, datetime) VALUES ((SELECT id FROM users WHERE login = ?), ?, NOW())",
        [user.login, `Установлен курс ${currency} = ${rate}`],
        (error) => {
          if (error) console.error("Ошибка логирования:", error);
        },
      );

      res.json({
        success: true,
        message: `Курс ${currency} установлен на ${rate}`,
      });
    },
  );
});

// Сброс курсов
router.post("/reset-rates", async (req, res) => {
  const user = req.user;

  const defaultRates = [
    { currency: "USD", rate: 2.5 },
    { currency: "EUR", rate: 3.0 },
    { currency: "BYN", rate: 1.0 },
  ];

  connection.query("DELETE FROM currency_rates", (error) => {
    if (error) {
      console.error("Ошибка сброса курсов:", error);
      return res.status(500).json({ error: "Ошибка сброса курсов" });
    }

    const values = defaultRates.map((rate) => [rate.currency, rate.rate]);
    connection.query(
      "INSERT INTO currency_rates (currency_code, rate, date) VALUES ?",
      [values.map((item) => [...item, new Date()])],
      (error) => {
        if (error) {
          console.error("Ошибка установки начальных курсов:", error);
          return res.status(500).json({ error: "Ошибка установки курсов" });
        }

        connection.query(
          "INSERT INTO operations_log (user_id, action_description, datetime) VALUES ((SELECT id FROM users WHERE login = ?), ?, NOW())",
          [user.login, "Сброс всех курсов к начальным значениям"],
          (error) => {
            if (error) console.error("Ошибка логирования:", error);
          },
        );

        res.json({
          success: true,
          message: "Курсы сброшены к начальным значениям",
        });
      },
    );
  });
});

// Отчёты
router.get("/reports", async (req, res) => {
  connection.query(
    `SELECT 
        DATE(datetime) as date, 
        COUNT(*) as operations_count
     FROM operations_log 
     WHERE action_description LIKE 'Обмен%'
     GROUP BY DATE(datetime) 
     ORDER BY DATE(datetime) DESC`,
    (error, results) => {
      if (error) {
        console.error("Ошибка отчетов:", error);
        return res.status(500).json({ error: "Ошибка загрузки отчетов" });
      }

      const formattedReports = results.map((report) => ({
        ...report,
        date: new Date(report.date).toLocaleDateString("ru-RU"),
      }));

      res.json({ success: true, reports: formattedReports });
    },
  );
});

module.exports = router;
