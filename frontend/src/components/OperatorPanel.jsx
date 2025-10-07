import React, { useState, useEffect } from 'react';

const OperatorPanel = () => {
  const [formData, setFormData] = useState({
    fromCurrency: 'USD',
    toCurrency: 'BYN',
    amount: '',
  });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  // Загружаем историю операций
  const loadHistory = async () => {
    const user = JSON.parse(localStorage.getItem('user'));

    try {
      // Временная заглушка - потом сделаем отдельный роут
      const response = await fetch(
        'http://localhost:3000/api/operator/history',
        {
          headers: {
            'x-user-login': user.login,
            'x-user-role': user.role,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleExchange = async (e) => {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem('user'));

    try {
      const response = await fetch(
        'http://localhost:3000/api/operator/exchange',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-login': user.login,
            'x-user-role': user.role,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      if (data.success) {
        setResult(data);
        setFormData({ ...formData, amount: '' });
        loadHistory(); // Обновляем историю после операции
      }
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Панель оператора</h1>

      {/* Форма обмена */}
      <form
        onSubmit={handleExchange}
        style={{
          marginBottom: '30px',
          padding: '20px',
          border: '1px solid #ccc',
        }}
      >
        <h3>Обмен валют</h3>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="number"
            placeholder="Сумма"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            required
            style={{ marginRight: '10px', padding: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <select
            value={formData.fromCurrency}
            onChange={(e) =>
              setFormData({ ...formData, fromCurrency: e.target.value })
            }
            style={{ marginRight: '10px', padding: '5px' }}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="BYN">BYN</option>
          </select>
          →
          <select
            value={formData.toCurrency}
            onChange={(e) =>
              setFormData({ ...formData, toCurrency: e.target.value })
            }
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value="BYN">BYN</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <button type="submit" style={{ padding: '5px 15px' }}>
          Обменять
        </button>
      </form>

      {/* Результат */}
      {result && (
        <div
          style={{
            marginBottom: '20px',
            padding: '10px',
            background: '#f0f8f0',
          }}
        >
          <h3>Успешно!</h3>
          <p>
            Результат: {result.result} {formData.toCurrency}
          </p>
          <p>Курс: {result.rate}</p>
        </div>
      )}

      {/* История операций */}
      <div style={{ marginTop: '30px' }}>
        <h3>История операций (за сегодня)</h3>
        {history.length === 0 ? (
          <p>Операций пока нет</p>
        ) : (
          <ul>
            {history.map((item, index) => (
              <li key={index}>
                {item.action_description} -{' '}
                {new Date(item.datetime).toLocaleTimeString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default OperatorPanel;
