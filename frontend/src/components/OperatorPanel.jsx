import React, { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function OperatorPanel() {
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("BYN");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Для истории курсов
  const [rateHistory, setRateHistory] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Загрузка истории операций при монтировании
  useEffect(() => {
    loadHistory();
  }, []);

  // Загрузка истории курсов при изменении фильтров
  useEffect(() => {
    loadRateHistory();
  }, [selectedCurrency, startDate, endDate]);

  // ===== ИСТОРИЯ ОПЕРАЦИЙ =====
  const loadHistory = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/operator/history`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Статус ответа:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP ошибка: ${response.status}`);
      }

      const data = await response.json();
      console.log("Данные истории:", data);

      if (data.success) {
        setHistory(data.history || []);
        setError("");
      } else {
        setError(data.error || "Ошибка загрузки истории");
      }
    } catch (error) {
      console.error("Ошибка загрузки истории:", error);
      setError("Не удалось загрузить историю: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== ОБМЕН ВАЛЮТ =====
  const handleExchange = async (e) => {
    e.preventDefault();
    setResult(null);
    setError("");

    try {
      setLoading(true);

      console.log("Отправка запроса на обмен:", {
        fromCurrency,
        toCurrency,
        amount: parseFloat(amount),
      });

      const response = await fetch(`${API_URL}/api/operator/exchange`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromCurrency,
          toCurrency,
          amount: parseFloat(amount),
        }),
      });

      console.log("Статус ответа:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ошибка: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Результат обмена:", data);

      if (data.success) {
        setResult(data.result);
        setAmount("");
        loadHistory();
        setError("");
      } else {
        setError(data.error || "Ошибка обмена");
      }
    } catch (error) {
      console.error("Ошибка обмена:", error);
      setError("Ошибка: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== ИСТОРИЯ КУРСОВ =====
  const loadRateHistory = async () => {
    try {
      let url = `${API_URL}/api/operator/rates-history?currency=${selectedCurrency}`;

      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const response = await fetch(url, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        setRateHistory(data.history);
      }
    } catch (error) {
      console.error("Ошибка загрузки истории курсов:", error);
    }
  };

  const currencies = ["USD", "EUR", "BYN", "RUB", "PLN"];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Панель оператора</h2>

      {error && (
        <div
          style={{
            color: "red",
            marginBottom: "10px",
            padding: "10px",
            border: "1px solid red",
            borderRadius: "4px",
            background: "#ffeeee",
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* ===== ОБМЕН ВАЛЮТ ===== */}
      <div style={{ marginBottom: "30px" }}>
        <h3>Обмен валют</h3>
        <form onSubmit={handleExchange}>
          <div style={{ marginBottom: "10px" }}>
            <label>Из валюты: </label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              style={{ marginLeft: "10px", padding: "5px" }}
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>В валюту: </label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              style={{ marginLeft: "10px", padding: "5px" }}
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>Сумма: </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              required
              style={{ marginLeft: "10px", padding: "5px" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 20px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Обмен..." : "Обменять"}
          </button>
        </form>

        {result && (
          <div
            style={{
              marginTop: "20px",
              padding: "10px",
              background: "#e0ffe0",
              border: "1px solid #00aa00",
              borderRadius: "4px",
            }}
          >
            <strong>Результат:</strong> {result} {toCurrency}
          </div>
        )}
      </div>

      {/* ===== ИСТОРИЯ ОПЕРАЦИЙ ===== */}
      <div style={{ marginBottom: "40px" }}>
        <h3>История операций за сегодня</h3>
        {loading && <p>Загрузка...</p>}

        {!loading && history.length === 0 && <p>Нет операций за сегодня</p>}

        <ul style={{ listStyle: "none", padding: 0 }}>
          {history.map((item, index) => (
            <li
              key={index}
              style={{
                marginBottom: "10px",
                padding: "10px",
                background: "#f0f0f0",
                borderRadius: "5px",
              }}
            >
              <div>
                <strong>{item.datetime}</strong>
              </div>
              <div>{item.action_description}</div>
            </li>
          ))}
        </ul>

        <button
          onClick={loadHistory}
          style={{
            padding: "5px 15px",
            background: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Обновить историю
        </button>
      </div>

      {/* ===== ИСТОРИЯ КУРСОВ ===== */}
      <div
        style={{
          marginTop: "40px",
          borderTop: "2px solid #ddd",
          paddingTop: "20px",
        }}
      >
        <h3>📊 История курсов валют</h3>

        <div
          style={{
            marginBottom: "15px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            style={{ padding: "5px" }}
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Начало"
            style={{ padding: "5px" }}
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Конец"
            style={{ padding: "5px" }}
          />

          <button
            onClick={loadRateHistory}
            style={{
              padding: "5px 15px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Обновить
          </button>
        </div>

        {rateHistory.length === 0 ? (
          <p>Нет данных за выбранный период</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                boxShadow: "0 0 10px rgba(0,0,0,0.1)",
              }}
            >
              <thead>
                <tr style={{ background: "#007bff", color: "white" }}>
                  <th style={{ padding: "10px", textAlign: "left" }}>Дата</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Валюта</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Курс</th>
                </tr>
              </thead>
              <tbody>
                {rateHistory.map((item, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid #ddd",
                      background: idx % 2 === 0 ? "#f9f9f9" : "white",
                    }}
                  >
                    <td style={{ padding: "8px" }}>{item.date}</td>
                    <td style={{ padding: "8px" }}>{item.currency_code}</td>
                    <td style={{ padding: "8px", fontWeight: "bold" }}>
                      {Number(item.rate).toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default OperatorPanel;
