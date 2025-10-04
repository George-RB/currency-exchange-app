import React, { useState } from 'react';

const OperatorPanel = () => {
  const [formData, setFormData] = useState({
    fromCurrency: 'USD',
    toCurrency: 'BYN',
    amount: '',
  });
  const [result, setResult] = useState(null);

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
      }
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Панель оператора</h1>

      <form onSubmit={handleExchange} style={{ marginBottom: '20px' }}>
        <div>
          <input
            type="number"
            placeholder="Сумма"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            required
          />
        </div>
        <div>
          <select
            value={formData.fromCurrency}
            onChange={(e) =>
              setFormData({ ...formData, fromCurrency: e.target.value })
            }
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
          >
            <option value="BYN">BYN</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <button type="submit">Обменять</button>
      </form>

      {result && (
        <div>
          <h3>
            Результат: {result.result} {formData.toCurrency}
          </h3>
          <p>Курс: {result.rate}</p>
        </div>
      )}
    </div>
  );
};

export default OperatorPanel;
