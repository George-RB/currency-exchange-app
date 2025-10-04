import React, { useState } from 'react';

const AdminPanel = () => {
  const [rateForm, setRateForm] = useState({
    currency: 'USD',
    rate: '',
  });

  const handleSetRate = async (e) => {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem('user'));

    try {
      const response = await fetch('http://localhost:3000/api/admin/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-login': user.login,
          'x-user-role': user.role,
        },
        body: JSON.stringify(rateForm),
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setRateForm({ ...rateForm, rate: '' });
      }
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Панель администратора</h1>

      <form onSubmit={handleSetRate} style={{ marginBottom: '20px' }}>
        <h3>Установить курс валюты</h3>
        <div>
          <select
            value={rateForm.currency}
            onChange={(e) =>
              setRateForm({ ...rateForm, currency: e.target.value })
            }
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="BYN">BYN</option>
          </select>
          <input
            type="number"
            step="0.0001"
            placeholder="Курс"
            value={rateForm.rate}
            onChange={(e) => setRateForm({ ...rateForm, rate: e.target.value })}
            required
          />
        </div>
        <button type="submit">Установить курс</button>
      </form>
    </div>
  );
};

export default AdminPanel;
