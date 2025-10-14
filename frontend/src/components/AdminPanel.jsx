import React, { useState, useEffect } from 'react';
import STYLES from '../styles/AdminPanel.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AdminPanel = () => {
  const [rateForm, setRateForm] = useState({
    currency: 'USD',
    rate: '',
  });
  const [currentRates, setCurrentRates] = useState({});
  const [loading, setLoading] = useState(false);

  // Загружаем текущие курсы при монтировании
  useEffect(() => {
    loadCurrentRates();
    loadReports();
  }, []);

  const loadCurrentRates = async () => {
    try {
      console.log('🟡 Начинаем загрузку курсов...');
      const response = await fetch(`${API_URL}/api/rates`);

      console.log('📡 Статус ответа:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Полученные данные:', data);

      const rates = {};
      data.forEach((rate) => {
        rates[rate.currency_code] = rate.rate;
      });

      console.log('🟢 Преобразованные курсы:', rates);
      setCurrentRates(rates);
    } catch (error) {
      console.error('🔴 Ошибка загрузки курсов:', error);
      // Можно добавить уведомление для пользователя
    }
  };
  const handleSetRate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const user = JSON.parse(localStorage.getItem('user'));

    try {
      const response = await fetch(`${API_URL}/api/admin/rates`, {
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
        loadCurrentRates(); // Обновляем список курсов
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка установки курса');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRates = async () => {
    if (
      !window.confirm(
        'Вы уверены, что хотите сбросить все курсы к начальным значениям?'
      )
    ) {
      return;
    }

    setLoading(true);
    const user = JSON.parse(localStorage.getItem('user'));

    try {
      const response = await fetch(`${API_URL}/api/admin/reset-rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-login': user.login,
          'x-user-role': user.role,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        loadCurrentRates(); // Обновляем список курсов
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка сброса курсов');
    } finally {
      setLoading(false);
    }
  };

  const [reports, setReports] = useState([]);

  const loadReports = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await fetch(`${API_URL}/api/admin/reports`, {
      headers: { 'x-user-login': user.login, 'x-user-role': user.role },
    });
    const data = await response.json();
    if (data.success) setReports(data.reports);
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

          <button
            type="submit"
            disabled={loading}
            className={STYLES.submitButton}
          >
            {loading ? 'Сохранение...' : 'Установить курс'}
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
          {loading ? 'Сброс...' : 'Сбросить все курсы'}
        </button>

        {/* Текущие курсы */}
        <div className={STYLES.currentRates}>
          <h4 className={STYLES.ratesTitle}>Текущие курсы:</h4>
          <div className={STYLES.rateItem}>
            <span>USD:</span>
            <span>{currentRates.USD || 'не установлен'}</span>
          </div>
          <div className={STYLES.rateItem}>
            <span>EUR:</span>
            <span>{currentRates.EUR || 'не установлен'}</span>
          </div>
          <div className={STYLES.rateItem}>
            <span>BYN:</span>
            <span>{currentRates.BYN || 'не установлен'}</span>
          </div>
        </div>

        <div className={STYLES.reportsSection}>
          <h3>Отчеты по обменам</h3>
          {reports.map((report) => (
            <div key={report.date}>
              {report.date}: {report.operations_count} операций
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
