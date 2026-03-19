import React, { useState, useEffect } from "react";
import STYLES from "../styles/AdminPanel.module.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const AdminPanel = () => {
  const [rateForm, setRateForm] = useState({
    currency: "USD",
    rate: "",
  });
  const [currentRates, setCurrentRates] = useState({});
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);

  // Загружаем текущие курсы при монтировании
  useEffect(() => {
    loadCurrentRates();
    loadReports();
  }, []);

  // ===== ЗАГРУЗКА ТЕКУЩИХ КУРСОВ =====
  const loadCurrentRates = async () => {
    try {
      console.log("🟡 Начинаем загрузку курсов...");
      const response = await fetch(`${API_URL}/api/rates`, {
        credentials: "include", // 👈 добавил
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📡 Статус ответа:", response.status);
      console.log("📡 Response ok:", response.ok);

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 Полученные данные:", data);

      const rates = {};
      data.forEach((rate) => {
        rates[rate.currency_code] = rate.rate;
      });

      console.log("🟢 Преобразованные курсы:", rates);
      setCurrentRates(rates);
    } catch (error) {
      console.error("🔴 Ошибка загрузки курсов:", error);
    }
  };

  // ===== ЗАГРУЗКА ОТЧЁТОВ =====
  const loadReports = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/reports`, {
        credentials: "include", // 👈 добавил
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.success) setReports(data.reports);
    } catch (error) {
      console.error("Ошибка загрузки отчётов:", error);
    }
  };

  // ===== УСТАНОВКА КУРСА =====
  const handleSetRate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/rates`, {
        method: "POST",
        credentials: "include", // 👈 добавил
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rateForm),
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setRateForm({ ...rateForm, rate: "" });
        loadCurrentRates(); // Обновляем список курсов
        loadReports(); // Обновляем отчёты
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Ошибка установки курса");
    } finally {
      setLoading(false);
    }
  };

  // ===== СБРОС КУРСОВ =====
  const handleResetRates = async () => {
    if (
      !window.confirm(
        "Вы уверены, что хотите сбросить все курсы к начальным значениям?",
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/reset-rates`, {
        method: "POST",
        credentials: "include", // 👈 добавил
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        loadCurrentRates(); // Обновляем список курсов
        loadReports(); // Обновляем отчёты
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Ошибка сброса курсов");
    } finally {
      setLoading(false);
    }
  };

  const getOperationWord = (count) => {
    const num = Math.abs(count) % 100;
    const num1 = num % 10;

    if (num > 10 && num < 20) {
      return `${count} операций`;
    }
    if (num1 > 1 && num1 < 5) {
      return `${count} операции`;
    }
    if (num1 === 1) {
      return `${count} операция`;
    }
    return `${count} операций`;
  };

  const currencies = ["USD", "EUR", "BYN", "RUB", "PLN"];

  return (
    <div className={STYLES.adminContainer}>
      <h1 className={STYLES.title}>Панель администратора</h1>

      <form onSubmit={handleSetRate} className={STYLES.rateForm}>
        <h3 className={STYLES.formTitle}>Установить курс валюты</h3>
        <div className={STYLES.formRow}>
          <div className={STYLES.formGroup}>
            <label className={STYLES.label}>Валюта:</label>
            <select
              value={rateForm.currency}
              onChange={(e) =>
                setRateForm({ ...rateForm, currency: e.target.value })
              }
              className={STYLES.select}
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className={STYLES.formGroup}>
            <label className={STYLES.label}>Курс:</label>
            <input
              type="number"
              step="0.0001"
              placeholder="Курс"
              value={rateForm.rate}
              onChange={(e) =>
                setRateForm({ ...rateForm, rate: e.target.value })
              }
              required
              className={STYLES.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={STYLES.submitButton}
          >
            {loading ? "Сохранение..." : "Установить курс"}
          </button>
        </div>
      </form>

      {/* Секция сброса курсов */}
      <div className={STYLES.resetSection}>
        <h3 className={STYLES.resetTitle}>Сброс курсов валют</h3>
        <p>Вернуть все курсы к начальным значениям:</p>
        <button
          onClick={handleResetRates}
          disabled={loading}
          className={STYLES.resetButton}
        >
          {loading ? "Сброс..." : "Сбросить все курсы"}
        </button>

        {/* Текущие курсы */}
        <div className={STYLES.currentRates}>
          <h4 className={STYLES.ratesTitle}>Текущие курсы:</h4>
          {currencies.map((currency) => (
            <div key={currency} className={STYLES.rateItem}>
              <span>{currency}:</span>
              <span>{currentRates[currency] || "не установлен"}</span>
            </div>
          ))}
        </div>

        {/* Отчёты */}
        <div className={STYLES.reportsSection}>
          <h3>Отчеты по обменам</h3>
          {reports.length === 0 ? (
            <p>Нет данных</p>
          ) : (
            reports.map((report) => (
              <div key={report.date} className={STYLES.reportItem}>
                {report.date}: {getOperationWord(report.operations_count)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
