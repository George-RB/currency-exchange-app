const express = require("express");
const { verifyToken } = require("../middleware/jwtAuth");
const roleAuth = require("../middleware/roleAuth");
const connection = require("../config/database");
const router = express.Router();

const rateScheduler = require("../services/rateScheduler");

// Все роуты ниже требуют токен и роль admin
router.use(verifyToken);
router.use(roleAuth("admin"));

// Установка курса
router.post("/rates", async (req, res) => {
  const { currency, rate } = req.body;
  const user = req.user;

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

// ===== ПРОСТЫЕ ОТЧЁТЫ =====
router.get("/reports", async (req, res) => {
  connection.query(
    `SELECT 
        DATE_FORMAT(datetime, '%d.%m.%Y') as date, 
        COUNT(*) as operations_count
     FROM operations_log 
     WHERE action_description LIKE 'Обмен%'
     GROUP BY DATE_FORMAT(datetime, '%d.%m.%Y')
     ORDER BY STR_TO_DATE(date, '%d.%m.%Y') DESC`,
    (error, results) => {
      if (error) {
        console.error("Ошибка отчетов:", error);
        return res.status(500).json({ error: "Ошибка загрузки отчетов" });
      }
      res.json({ success: true, reports: results });
    },
  );
});

// ===== НОВЫЙ РОУТ: ПОЛНЫЕ ОТЧЁТЫ С ФИЛЬТРАМИ =====
router.get("/reports/full", async (req, res) => {
  const { startDate, endDate, currency } = req.query;

  let sql = `
    SELECT 
      DATE(datetime) as date,
      from_currency,
      to_currency,
      COUNT(*) as operations_count,
      COALESCE(SUM(amount), 0) as total_amount_from,
      COALESCE(SUM(result_amount), 0) as total_amount_to,
      COALESCE(AVG(result_amount / amount), 0) as avg_rate
    FROM operations_log 
    WHERE action_description LIKE 'Обмен%'
  `;

  const params = [];

  if (startDate) {
    sql += " AND DATE(datetime) >= ?";
    params.push(startDate);
  }

  if (endDate) {
    sql += " AND DATE(datetime) <= ?";
    params.push(endDate);
  }

  if (currency) {
    sql += " AND (from_currency = ? OR to_currency = ?)";
    params.push(currency, currency);
  }

  sql += ` GROUP BY DATE(datetime), from_currency, to_currency 
           ORDER BY date DESC, from_currency`;

  connection.query(sql, params, (error, results) => {
    if (error) {
      console.error("Ошибка отчётов:", error);
      return res.status(500).json({ error: "Ошибка загрузки отчётов" });
    }

    // Общие итоги за период
    const totals = {
      total_operations: results.reduce((sum, r) => sum + r.operations_count, 0),
      total_amount_from: results.reduce(
        (sum, r) => sum + parseFloat(r.total_amount_from || 0),
        0,
      ),
      total_amount_to: results.reduce(
        (sum, r) => sum + parseFloat(r.total_amount_to || 0),
        0,
      ),
    };

    res.json({
      success: true,
      reports: results,
      totals,
    });
  });
});

// ===== СИНХРОНИЗАЦИЯ С НАЦБАНКОМ =====
router.post("/sync-nbrb", async (req, res) => {
  try {
    const result = await rateScheduler.manualUpdate();

    if (result) {
      res.json({
        success: true,
        message: "Курсы успешно синхронизированы с Нацбанком",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Не удалось получить данные от Нацбанка",
      });
    }
  } catch (error) {
    console.error("Ошибка синхронизации:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

module.exports = router;
