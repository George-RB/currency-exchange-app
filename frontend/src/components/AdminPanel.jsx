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

  // СОСТОЯНИЯ ДЛЯ ПОЛНЫХ ОТЧЁТОВ
  const [fullReports, setFullReports] = useState([]);
  const [totals, setTotals] = useState({
    total_operations: 0,
    total_amount_from: 0,
    total_amount_to: 0,
  });
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    currency: "",
  });

  const [syncing, setSyncing] = useState(false);
  // ===== СИНХРОНИЗАЦИЯ С НАЦБАНКОМ =====
  const syncWithNbrb = async () => {
    if (
      !window.confirm(
        "Синхронизировать курсы с Нацбанком? Текущие курсы будут обновлены.",
      )
    ) {
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/sync-nbrb`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (data.success) {
        alert("✅ Курсы успешно синхронизированы с Нацбанком");
        loadCurrentRates(); // Обновляем отображение
      } else {
        alert("❌ " + (data.error || "Ошибка синхронизации"));
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Ошибка соединения с сервером");
    } finally {
      setSyncing(false);
    }
  };

  const currencies = ["USD", "EUR", "BYN", "RUB", "PLN"];

  // ===== ЗАГРУЗКА ПОЛНЫХ ОТЧЁТОВ С ФИЛЬТРАМИ =====
  // 👈 ПЕРЕНЁС ЭТУ ФУНКЦИЮ НАВЕРХ!
  const loadFullReports = async () => {
    try {
      let url = `${API_URL}/api/admin/reports/full?`;
      if (filters.startDate) url += `startDate=${filters.startDate}&`;
      if (filters.endDate) url += `endDate=${filters.endDate}&`;
      if (filters.currency) url += `currency=${filters.currency}`;

      const response = await fetch(url, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (data.success) {
        setFullReports(data.reports || []);
        setTotals(
          data.totals || {
            total_operations: 0,
            total_amount_from: 0,
            total_amount_to: 0,
          },
        );
      }
    } catch (error) {
      console.error("Ошибка загрузки полных отчётов:", error);
    }
  };

  // Загружаем курсы и отчёты при монтировании
  useEffect(() => {
    loadCurrentRates();
    loadReports();
    loadFullReports();
  }, []);

  // Загружаем полные отчёты при изменении фильтров
  useEffect(() => {
    loadFullReports();
  }, [filters]); // 👈 УБРАЛ loadFullReports из зависимостей

  // ===== ЗАГРУЗКА ТЕКУЩИХ КУРСОВ =====
  // ===== ЗАГРУЗКА ТЕКУЩИХ КУРСОВ =====
  const loadCurrentRates = async () => {
    try {
      console.log("🟡 Начинаем загрузку курсов...");
      const response = await fetch(`${API_URL}/api/rates`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 Полученные данные:", data);

      const rates = {};

      // Группируем по валютам и берём самую новую дату
      data.forEach((rate) => {
        const date = new Date(rate.date);
        const existing = rates[rate.currency_code];

        if (!existing || new Date(existing.date) < date) {
          rates[rate.currency_code] = {
            rate: rate.rate,
            date: rate.date,
          };
        }
      });

      // Преобразуем в простой объект { USD: 2.9946, EUR: 3.4556, ... }
      const simpleRates = {};
      Object.keys(rates).forEach((key) => {
        simpleRates[key] = rates[key].rate;
      });

      console.log("🟢 Текущие курсы:", simpleRates);
      setCurrentRates(simpleRates);
    } catch (error) {
      console.error("🔴 Ошибка загрузки курсов:", error);
    }
  };
  // ===== ЗАГРУЗКА ПРОСТЫХ ОТЧЁТОВ =====
  const loadReports = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/reports`, {
        credentials: "include",
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
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rateForm),
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setRateForm({ ...rateForm, rate: "" });
        loadCurrentRates();
        loadReports();
        loadFullReports(); // ОБНОВЛЯЕМ ПОСЛЕ ИЗМЕНЕНИЙ
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
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        loadCurrentRates();
        loadReports();
        loadFullReports(); // ОБНОВЛЯЕМ ПОСЛЕ ИЗМЕНЕНИЙ
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Ошибка сброса курсов");
    } finally {
      setLoading(false);
    }
  };

  // ===== СКЛОНЕНИЕ СЛОВА "ОПЕРАЦИЯ" =====
  const getOperationWord = (count) => {
    const num = Math.abs(count) % 100;
    const num1 = num % 10;

    if (num > 10 && num < 20) return `${count} операций`;
    if (num1 > 1 && num1 < 5) return `${count} операции`;
    if (num1 === 1) return `${count} операция`;
    return `${count} операций`;
  };

  return (
    <div className={STYLES.adminContainer}>
      <h1 className={STYLES.title}>Панель администратора</h1>

      {/* ===== УСТАНОВКА КУРСА ===== */}
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

      {/* ===== СБРОС КУРСОВ ===== */}
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

        {/* ===== ТЕКУЩИЕ КУРСЫ ===== */}
        <div className={STYLES.currentRates}>
          <h4 className={STYLES.ratesTitle}>Текущие курсы:</h4>
          {currencies.map((currency) => (
            <div key={currency} className={STYLES.rateItem}>
              <span>{currency}:</span>
              <span>{currentRates[currency] || "не установлен"}</span>
            </div>
          ))}
        </div>

        <button
          onClick={syncWithNbrb}
          disabled={syncing}
          style={{
            padding: "8px 16px",
            background: "#17a2b8",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginLeft: "10px",
          }}
        >
          {syncing ? "Синхронизация..." : "🇧🇾 Синхронизировать с Нацбанком"}
        </button>

        {/* ===== ПРОСТЫЕ ОТЧЁТЫ ===== */}
        <div className={STYLES.reportsSection}>
          <h3>Отчеты по обменам</h3>
          {reports.length === 0 ? (
            <p>Нет данных</p>
          ) : (
            reports.map((report) => (
              <div key={report.date} className={STYLES.reportItem}>
                {new Date(report.date).toLocaleDateString("ru-RU")}:{" "}
                {getOperationWord(report.operations_count)}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== НОВОЕ: ПОЛНЫЕ ОТЧЁТЫ С ФИЛЬТРАМИ ===== */}
      <div
        style={{
          marginTop: "40px",
          borderTop: "2px solid #007bff",
          paddingTop: "20px",
          background: "#f8f9fa",
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        <h2 style={{ color: "#007bff", marginBottom: "20px" }}>
          📊 Полные отчёты по обменам
        </h2>

        {/* Фильтры */}
        <div
          style={{
            display: "flex",
            gap: "15px",
            marginBottom: "25px",
            flexWrap: "wrap",
            background: "white",
            padding: "15px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ flex: "1", minWidth: "200px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Начало периода:
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
            />
          </div>

          <div style={{ flex: "1", minWidth: "200px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Конец периода:
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
            />
          </div>

          <div style={{ flex: "1", minWidth: "200px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Валюта:
            </label>
            <select
              value={filters.currency}
              onChange={(e) =>
                setFilters({ ...filters, currency: e.target.value })
              }
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
            >
              <option value="">Все валюты</option>
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              onClick={() =>
                setFilters({ startDate: "", endDate: "", currency: "" })
              }
              style={{
                padding: "8px 16px",
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                height: "36px",
              }}
            >
              Сбросить
            </button>
          </div>
        </div>

        {/* Таблица отчётов */}
        {fullReports.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              background: "white",
              borderRadius: "8px",
            }}
          >
            <p style={{ color: "#666", fontSize: "16px" }}>
              Нет данных за выбранный период
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  background: "white",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <thead>
                  <tr style={{ background: "#007bff", color: "white" }}>
                    <th style={{ padding: "12px", textAlign: "left" }}>Дата</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Из</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>В</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>
                      Операций
                    </th>
                    <th style={{ padding: "12px", textAlign: "right" }}>
                      Отдано
                    </th>
                    <th style={{ padding: "12px", textAlign: "right" }}>
                      Получено
                    </th>
                    <th style={{ padding: "12px", textAlign: "right" }}>
                      Ср. курс
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fullReports.map((report, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: "1px solid #dee2e6",
                        background: idx % 2 === 0 ? "#f8f9fa" : "white",
                      }}
                    >
                      <td style={{ padding: "10px" }}>
                        {new Date(report.date).toLocaleDateString("ru-RU")}
                      </td>
                      <td style={{ padding: "10px", fontWeight: "bold" }}>
                        {report.from_currency}
                      </td>
                      <td style={{ padding: "10px", fontWeight: "bold" }}>
                        {report.to_currency}
                      </td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        {getOperationWord(report.operations_count)}
                      </td>
                      <td style={{ padding: "10px", textAlign: "right" }}>
                        {Number(report.total_amount_from).toFixed(2)}{" "}
                        {report.from_currency}
                      </td>
                      <td style={{ padding: "10px", textAlign: "right" }}>
                        {Number(report.total_amount_to).toFixed(2)}{" "}
                        {report.to_currency}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          fontWeight: "bold",
                        }}
                      >
                        {Number(report.avg_rate).toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Итоги */}
            <div
              style={{
                marginTop: "20px",
                padding: "15px 20px",
                background: "#e8f4ff",
                borderRadius: "8px",
                border: "1px solid #007bff",
              }}
            >
              <h4 style={{ margin: "0 0 10px 0", color: "#007bff" }}>
                📈 Итоги за период:
              </h4>
              <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
                <div>
                  <strong>Всего операций:</strong>{" "}
                  {getOperationWord(totals.total_operations)}
                </div>
                <div>
                  <strong>Всего отдано:</strong>{" "}
                  {Number(totals.total_amount_from).toFixed(2)}
                </div>
                <div>
                  <strong>Всего получено:</strong>{" "}
                  {Number(totals.total_amount_to).toFixed(2)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
