const express = require("express");
const { verifyToken } = require("../middleware/jwtAuth");
const connection = require("../config/database");
const router = express.Router();

// Все роуты требуют токен
router.use(verifyToken);
router.use((req, res, next) => {
  if (req.user.role !== "operator") {
    return res.status(403).json({ error: "Недостаточно прав" });
  }
  next();
});

// ===== ОБМЕН ВАЛЮТ =====
router.post("/exchange", async (req, res) => {
  const { fromCurrency, toCurrency, amount } = req.body;
  const user = req.user;

  try {
    // Валидация
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Сумма должна быть положительной" });
    }
    if (fromCurrency === toCurrency) {
      return res.status(400).json({ error: "Валюты должны быть разными" });
    }

    // Получаем курсы
    const fromRate = await getCurrentRate(fromCurrency);
    const toRate = await getCurrentRate(toCurrency);

    if (!fromRate || !toRate) {
      return res.status(400).json({ error: "Курсы для валют не найдены" });
    }

    // Расчёт
    const result = (amount * fromRate) / toRate;

    // Проверка кассы (если таблица существует)
    try {
      const [cashResult] = await connection
        .promise()
        .query("SELECT amount FROM cash_register WHERE currency_code = ?", [
          toCurrency,
        ]);

      if (cashResult.length > 0 && cashResult[0].amount < result) {
        return res.status(400).json({
          error: `Недостаточно средств в кассе. Доступно: ${cashResult[0].amount} ${toCurrency}`,
        });
      }

      // Обновляем кассу
      if (cashResult.length > 0) {
        await connection
          .promise()
          .query(
            "UPDATE cash_register SET amount = amount - ? WHERE currency_code = ?",
            [result, toCurrency],
          );
        await connection
          .promise()
          .query(
            "UPDATE cash_register SET amount = amount + ? WHERE currency_code = ?",
            [amount, fromCurrency],
          );
      }
    } catch (cashError) {
      console.log("Касса не настроена, пропускаем проверку");
    }

    // Сохраняем операцию
    connection.query(
      `INSERT INTO operations_log 
       (user_id, action_description, operation_type, datetime, amount, from_currency, to_currency, result_amount) 
       VALUES (?, ?, 'exchange', NOW(), ?, ?, ?, ?)`,
      [
        user.id,
        `Обмен ${amount} ${fromCurrency} -> ${result.toFixed(2)} ${toCurrency}`,
        amount,
        fromCurrency,
        toCurrency,
        result,
      ],
      (error) => {
        if (error) {
          console.error("❌ Ошибка сохранения:", error);
          return res.status(500).json({ error: "Ошибка сохранения операции" });
        }

        res.json({
          success: true,
          result: result.toFixed(2),
          rate: (fromRate / toRate).toFixed(4),
        });
      },
    );
  } catch (error) {
    console.error("💥 Ошибка при обмене:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// ===== ИСТОРИЯ ОПЕРАЦИЙ =====
router.get("/history", (req, res) => {
  const user = req.user;

  connection.query(
    `SELECT action_description, datetime, amount, from_currency, to_currency, result_amount
     FROM operations_log 
     WHERE user_id = (SELECT id FROM users WHERE login = ?) 
     AND DATE(datetime) = CURDATE()
     ORDER BY datetime DESC`,
    [user.login],
    (error, results) => {
      if (error) {
        console.error("Ошибка загрузки истории:", error);
        return res.status(500).json({ error: "Ошибка загрузки истории" });
      }

      res.json({
        success: true,
        history: results,
      });
    },
  );
});

// ===== ИСТОРИЯ КУРСОВ =====
router.get("/rates-history", (req, res) => {
  const { currency, startDate, endDate } = req.query;

  let sql = `
    SELECT currency_code, rate, DATE_FORMAT(date, '%d.%m.%Y') as date
    FROM currency_rates 
    WHERE 1=1
  `;
  const params = [];

  if (currency) {
    sql += " AND currency_code = ?";
    params.push(currency);
  }

  if (startDate) {
    sql += " AND date >= ?";
    params.push(startDate);
  }

  if (endDate) {
    sql += " AND date <= ?";
    params.push(endDate);
  }

  sql += " ORDER BY date DESC, currency_code";

  connection.query(sql, params, (error, results) => {
    if (error) {
      console.error("Ошибка загрузки истории курсов:", error);
      return res.status(500).json({ error: "Ошибка загрузки истории" });
    }
    res.json({ success: true, history: results });
  });
});

// ===== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ =====
const getCurrentRate = async (currencyCode) => {
  return new Promise((resolve, reject) => {
    connection.query(
      "SELECT rate FROM currency_rates WHERE currency_code = ? ORDER BY date DESC LIMIT 1",
      [currencyCode],
      (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results[0] ? results[0].rate : null);
      },
    );
  });
};

module.exports = router;
