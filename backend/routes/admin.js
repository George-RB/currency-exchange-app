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
        `INSERT INTO operations_log (user_id, action_description, operation_type, datetime) 
   VALUES ((SELECT id FROM users WHERE login = ?), ?, 'rate_set', NOW())`,
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

// ===== ПОЛУЧИТЬ ОСТАТКИ В КАССЕ =====
router.get("/cash", async (req, res) => {
  connection.query(
    "SELECT * FROM cash_register ORDER BY currency_code",
    (error, results) => {
      if (error) {
        console.error("Ошибка получения кассы:", error);
        return res.status(500).json({ error: "Ошибка загрузки кассы" });
      }
      res.json({ success: true, cash: results });
    },
  );
});

// ===== ВЫДАТЬ ДЕНЬГИ В КАССУ (админ) =====
router.post("/cash/add", async (req, res) => {
  const { currency_code, amount } = req.body;
  const user = req.user;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Сумма должна быть положительной" });
  }

  connection.query(
    "UPDATE cash_register SET amount = amount + ? WHERE currency_code = ?",
    [amount, currency_code],
    (error, result) => {
      if (error) {
        console.error("Ошибка пополнения кассы:", error);
        return res.status(500).json({ error: "Ошибка пополнения кассы" });
      }

      // Логируем действие
      connection.query(
        `INSERT INTO operations_log (user_id, action_description, operation_type, datetime, ip_address) 
         VALUES ((SELECT id FROM users WHERE login = ?), ?, 'cash', NOW(), ?)`,
        [user.login, `Пополнение кассы: +${amount} ${currency_code}`, req.ip],
        (err) => {
          if (err) console.error("Ошибка логирования:", err);
        },
      );

      res.json({
        success: true,
        message: `Касса пополнена на ${amount} ${currency_code}`,
      });
    },
  );
});

// ===== ИЗЪЯТЬ ДЕНЬГИ ИЗ КАССЫ (админ) =====
router.post("/cash/remove", async (req, res) => {
  const { currency_code, amount } = req.body;
  const user = req.user;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Сумма должна быть положительной" });
  }

  // Сначала проверяем, хватает ли денег
  connection.query(
    "SELECT amount FROM cash_register WHERE currency_code = ?",
    [currency_code],
    (error, results) => {
      if (error || results.length === 0) {
        return res.status(500).json({ error: "Ошибка проверки кассы" });
      }

      if (results[0].amount < amount) {
        return res.status(400).json({
          error: `Недостаточно средств в кассе. Доступно: ${results[0].amount} ${currency_code}`,
        });
      }

      connection.query(
        "UPDATE cash_register SET amount = amount - ? WHERE currency_code = ?",
        [amount, currency_code],
        (err) => {
          if (err) {
            console.error("Ошибка изъятия из кассы:", err);
            return res.status(500).json({ error: "Ошибка изъятия из кассы" });
          }

          // Логируем действие
          connection.query(
            `INSERT INTO operations_log (user_id, action_description, operation_type, datetime, ip_address) 
             VALUES ((SELECT id FROM users WHERE login = ?), ?, 'cash', NOW(), ?)`,
            [
              user.login,
              `Изъятие из кассы: -${amount} ${currency_code}`,
              req.ip,
            ],
            (err) => {
              if (err) console.error("Ошибка логирования:", err);
            },
          );

          res.json({
            success: true,
            message: `Из кассы изъято ${amount} ${currency_code}`,
          });
        },
      );
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
          `INSERT INTO operations_log (user_id, action_description, operation_type, datetime) 
   VALUES ((SELECT id FROM users WHERE login = ?), ?, 'reset', NOW())`,
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

// ===== ПОЛНЫЕ ОТЧЁТЫ С ФИЛЬТРАМИ =====
router.get("/reports/full", async (req, res) => {
  const { startDate, endDate, currency } = req.query;

  // Основной запрос с детализацией
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

    // Подсчёт итогов отдельным запросом
    let totalsSql = `
      SELECT 
        COUNT(*) as total_operations,
        COALESCE(SUM(amount), 0) as total_amount_from,
        COALESCE(SUM(result_amount), 0) as total_amount_to
      FROM operations_log
      WHERE action_description LIKE 'Обмен%'
    `;

    const totalsParams = [];

    if (startDate) {
      totalsSql += " AND DATE(datetime) >= ?";
      totalsParams.push(startDate);
    }

    if (endDate) {
      totalsSql += " AND DATE(datetime) <= ?";
      totalsParams.push(endDate);
    }

    if (currency) {
      totalsSql += " AND (from_currency = ? OR to_currency = ?)";
      totalsParams.push(currency, currency);
    }

    connection.query(totalsSql, totalsParams, (totalsError, totalsResults) => {
      if (totalsError) {
        console.error("Ошибка подсчёта итогов:", totalsError);
        return res.status(500).json({ error: "Ошибка подсчёта итогов" });
      }

      const totals = totalsResults[0] || {
        total_operations: 0,
        total_amount_from: 0,
        total_amount_to: 0,
      };

      res.json({
        success: true,
        reports: results,
        totals,
      });
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

// ===== ЖУРНАЛ ДЕЙСТВИЙ =====
router.get("/logs", async (req, res) => {
  const { limit = 50, offset = 0, type } = req.query;

  let sql = `
    SELECT 
      ol.id,
      ol.user_id,
      u.login as user_login,
      ol.action_description,
      ol.operation_type,
      ol.datetime,
      ol.ip_address,
      ol.amount,
      ol.from_currency,
      ol.to_currency,
      ol.result_amount
    FROM operations_log ol
    LEFT JOIN users u ON ol.user_id = u.id
    WHERE 1=1
  `;

  const params = [];

  if (type && type !== "all") {
    sql += " AND ol.operation_type = ?";
    params.push(type);
  }

  sql += ` ORDER BY ol.datetime DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  connection.query(sql, params, (error, results) => {
    if (error) {
      console.error("Ошибка получения логов:", error);
      return res.status(500).json({ error: "Ошибка загрузки логов" });
    }

    // Подсчёт общего количества
    let countSql = `SELECT COUNT(*) as total FROM operations_log WHERE 1=1`;
    const countParams = [];

    if (type && type !== "all") {
      countSql += " AND operation_type = ?";
      countParams.push(type);
    }

    connection.query(countSql, countParams, (countError, countResults) => {
      if (countError) {
        console.error("Ошибка подсчёта логов:", countError);
        return res.status(500).json({ error: "Ошибка подсчёта логов" });
      }

      res.json({
        success: true,
        logs: results,
        total: countResults[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    });
  });
});

// ===== ПОЛУЧИТЬ ОСТАТКИ В КАССЕ =====
router.get("/cash", async (req, res) => {
  connection.query(
    "SELECT * FROM cash_register ORDER BY currency_code",
    (error, results) => {
      if (error) {
        console.error("Ошибка получения кассы:", error);
        return res.status(500).json({ error: "Ошибка загрузки кассы" });
      }
      res.json({ success: true, cash: results });
    },
  );
});

// ===== ПОПОЛНИТЬ КАССУ =====
router.post("/cash/add", async (req, res) => {
  const { currency_code, amount } = req.body;
  const user = req.user;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Сумма должна быть положительной" });
  }

  connection.query(
    "UPDATE cash_register SET amount = amount + ? WHERE currency_code = ?",
    [amount, currency_code],
    (error, result) => {
      if (error) {
        console.error("Ошибка пополнения кассы:", error);
        return res.status(500).json({ error: "Ошибка пополнения кассы" });
      }

      // Логируем действие
      connection.query(
        `INSERT INTO operations_log (user_id, action_description, operation_type, datetime, ip_address) 
         VALUES ((SELECT id FROM users WHERE login = ?), ?, 'cash', NOW(), ?)`,
        [
          user.login,
          `Пополнение кассы: +${amount} ${currency_code}`,
          req.ip || req.socket.remoteAddress,
        ],
        (err) => {
          if (err) console.error("Ошибка логирования:", err);
        },
      );

      res.json({
        success: true,
        message: `Касса пополнена на ${amount} ${currency_code}`,
      });
    },
  );
});

// ===== ИЗЪЯТЬ ИЗ КАССЫ =====
router.post("/cash/remove", async (req, res) => {
  const { currency_code, amount } = req.body;
  const user = req.user;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Сумма должна быть положительной" });
  }

  // Сначала проверяем, хватает ли денег
  connection.query(
    "SELECT amount FROM cash_register WHERE currency_code = ?",
    [currency_code],
    (error, results) => {
      if (error || results.length === 0) {
        return res.status(500).json({ error: "Ошибка проверки кассы" });
      }

      if (results[0].amount < amount) {
        return res.status(400).json({
          error: `Недостаточно средств. Доступно: ${results[0].amount} ${currency_code}`,
        });
      }

      connection.query(
        "UPDATE cash_register SET amount = amount - ? WHERE currency_code = ?",
        [amount, currency_code],
        (err) => {
          if (err) {
            console.error("Ошибка изъятия из кассы:", err);
            return res.status(500).json({ error: "Ошибка изъятия из кассы" });
          }

          // Логируем действие
          connection.query(
            `INSERT INTO operations_log (user_id, action_description, operation_type, datetime, ip_address) 
             VALUES ((SELECT id FROM users WHERE login = ?), ?, 'cash', NOW(), ?)`,
            [
              user.login,
              `Изъятие из кассы: -${amount} ${currency_code}`,
              req.ip || req.socket.remoteAddress,
            ],
            (err) => {
              if (err) console.error("Ошибка логирования:", err);
            },
          );

          res.json({
            success: true,
            message: `Из кассы изъято ${amount} ${currency_code}`,
          });
        },
      );
    },
  );
});

module.exports = router;
