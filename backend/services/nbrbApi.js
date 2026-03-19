const axios = require("axios");

class NbrbApiService {
  constructor() {
    this.baseUrl = "https://api.nbrb.by/exrates";
    // Только те валюты, что используются в проекте
    this.allowedCurrencies = ["USD", "EUR", "RUB", "PLN"];
  }

  /**
   * Получить курсы на сегодня
   */
  async getRates() {
    try {
      const response = await axios.get(`${this.baseUrl}/rates?periodicity=0`);

      // Фильтруем только нужные валюты
      const filteredRates = response.data.filter((rate) =>
        this.allowedCurrencies.includes(rate.Cur_Abbreviation),
      );

      return filteredRates;
    } catch (error) {
      console.error("Ошибка получения курсов из Нацбанка:", error.message);
      return null;
    }
  }

  /**
   * Получить курс конкретной валюты
   * @param {string} currencyCode - USD, EUR, RUB, PLN
   */
  async getRate(currencyCode) {
    if (!this.allowedCurrencies.includes(currencyCode)) {
      console.log(`Валюта ${currencyCode} не поддерживается`);
      return null;
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/rates/${currencyCode}?parammode=2`,
      );
      return response.data;
    } catch (error) {
      console.error(`Ошибка получения курса ${currencyCode}:`, error.message);
      return null;
    }
  }

  /**
   * Конвертировать курс Нацбанка в наш формат
   */
  convertRate(nbrbRate) {
    // BYN не нужно получать из API (это базовая валюта)
    return {
      currency_code: nbrbRate.Cur_Abbreviation,
      // Учитываем масштаб (например, 100 RUB)
      rate: nbrbRate.Cur_OfficialRate / nbrbRate.Cur_Scale,
      date: new Date().toISOString().split("T")[0],
    };
  }

  /**
   * Получить все нужные курсы в нашем формате
   */
  async getConvertedRates() {
    const rates = await this.getRates();
    if (!rates) return null;

    return rates.map((rate) => this.convertRate(rate));
  }
}

module.exports = new NbrbApiService();
