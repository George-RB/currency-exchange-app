const cron = require("node-cron");
const nbrbApi = require("./nbrbApi");
const connection = require("../config/database");

class RateScheduler {
  constructor() {
    // Запускаем каждый день в 14:30
    this.schedule = "30 14 * * *";
  }

  start() {
    console.log("🕒 Планировщик курсов запущен. Обновление в 14:30 ежедневно");

    cron.schedule(this.schedule, async () => {
      console.log("⏰ Запуск автоматического обновления курсов...");
      await this.updateRates();
    });
  }

  async updateRates() {
    try {
      // Получаем курсы из Нацбанка
      const rates = await nbrbApi.getConvertedRates();

      if (!rates || rates.length === 0) {
        console.log("❌ Нет данных от Нацбанка");
        return false;
      }

      const today = new Date().toISOString().split("T")[0];
      let updated = 0;

      for (const rate of rates) {
        // Проверяем, есть ли уже курс на сегодня
        const [existing] = await connection
          .promise()
          .query(
            "SELECT id FROM currency_rates WHERE currency_code = ? AND date = ?",
            [rate.currency_code, today],
          );

        if (existing.length > 0) {
          // Обновляем существующий курс
          await connection
            .promise()
            .query(
              "UPDATE currency_rates SET rate = ? WHERE currency_code = ? AND date = ?",
              [rate.rate, rate.currency_code, today],
            );
          console.log(`🔄 Обновлён курс ${rate.currency_code} = ${rate.rate}`);
        } else {
          // Вставляем новый курс
          await connection
            .promise()
            .query(
              "INSERT INTO currency_rates (currency_code, rate, date) VALUES (?, ?, ?)",
              [rate.currency_code, rate.rate, today],
            );
          console.log(`✅ Добавлен курс ${rate.currency_code} = ${rate.rate}`);
        }
        updated++;
      }

      // Добавляем BYN как базовую валюту (курс 1.0)
      const [bynExists] = await connection
        .promise()
        .query(
          "SELECT id FROM currency_rates WHERE currency_code = ? AND date = ?",
          ["BYN", today],
        );

      if (!bynExists.length) {
        await connection
          .promise()
          .query(
            "INSERT INTO currency_rates (currency_code, rate, date) VALUES (?, ?, ?)",
            ["BYN", 1.0, today],
          );
        console.log("✅ Добавлен курс BYN = 1.0");
      }

      console.log(
        `✅ Автоматическое обновление завершено. Обновлено ${updated} курсов`,
      );

      // Логируем действие
      await connection
        .promise()
        .query(
          "INSERT INTO operations_log (user_id, action_description, datetime) VALUES (?, ?, NOW())",
          [
            1,
            `Автоматическое обновление курсов из Нацбанка (${updated} валют)`,
          ],
        );

      return true;
    } catch (error) {
      console.error("❌ Ошибка при обновлении курсов:", error);
      return false;
    }
  }

  // Ручное обновление
  async manualUpdate() {
    return await this.updateRates();
  }
}

module.exports = new RateScheduler();
