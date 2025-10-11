import React, { useState } from 'react';
import STYLES from '../styles/AdminPanel.module.css';

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
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="BYN">BYN</option>
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

          <button type="submit" className={STYLES.submitButton}>
            Установить курс
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminPanel;
