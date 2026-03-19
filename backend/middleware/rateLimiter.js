const rateLimit = require("express-rate-limit");

// Общий лимит для всех API
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: {
    error: "Слишком много запросов, попробуйте позже",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Строгий лимит для логина (против брутфорса)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // только 5 попыток входа за 15 минут
  message: {
    error: "Слишком много попыток входа. Подождите 15 минут",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Лимит для обмена валют
const exchangeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 10, // 10 обменов в минуту
  message: {
    error: "Слишком много операций обмена. Подождите минуту",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalLimiter,
  authLimiter,
  exchangeLimiter,
};
