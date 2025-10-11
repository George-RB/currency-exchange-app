import React, { useState, useEffect } from 'react';
import STYLES from '../styles/OperatorPanel.module.css';

const OperatorPanel = () => {
  const [formData, setFormData] = useState({
    fromCurrency: 'USD',
    toCurrency: 'BYN',
    amount: '',
  });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Загружаем историю операций
  const loadHistory = async () => {
    const user = JSON.parse(localStorage.getItem('user'));

    try {
      const response = await fetch(
        'http://localhost:3000/api/operator/exchange',
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
    setError('');
    setResult(null);
    setLoading(true);

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
      } else {
        setError(data.error || 'Произошла ошибка при обмене');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={STYLES.operatorContainer}>
      <h1 className={STYLES.title}>Панель оператора</h1>

      {/* Форма обмена */}
      <div className={STYLES.exchangeForm}>
        <h3 className={STYLES.formTitle}>Обмен валют</h3>

        {error && <div className={STYLES.errorMessage}>⚠️ {error}</div>}

        <form onSubmit={handleExchange}>
          <div className={STYLES.formGroup}>
            <label className={STYLES.label}>Сумма:</label>
            <input
              type="number"
              placeholder="Введите сумму"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
              min="0.01"
              step="0.01"
              className={STYLES.input}
            />
          </div>

          <div className={STYLES.currencyRow}>
            <div className={STYLES.currencyGroup}>
              <label className={STYLES.label}>Из:</label>
              <select
                value={formData.fromCurrency}
                onChange={(e) =>
                  setFormData({ ...formData, fromCurrency: e.target.value })
                }
                className={STYLES.select}
              >
                <option value="USD">USD - Доллар США</option>
                <option value="EUR">EUR - Евро</option>
                <option value="BYN">BYN - Белорусский рубль</option>
              </select>
            </div>

            <div className={STYLES.arrow}>→</div>

            <div className={STYLES.currencyGroup}>
              <label className={STYLES.label}>В:</label>
              <select
                value={formData.toCurrency}
                onChange={(e) =>
                  setFormData({ ...formData, toCurrency: e.target.value })
                }
                className={STYLES.select}
              >
                <option value="BYN">BYN - Белорусский рубль</option>
                <option value="USD">USD - Доллар США</option>
                <option value="EUR">EUR - Евро</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={STYLES.submitButton}
          >
            {loading ? 'Обмен...' : 'Обменять'}
          </button>
        </form>
      </div>

      {/* Результат */}
      {result && (
        <div className={STYLES.successMessage}>
          <h3 className={STYLES.successTitle}>✅ Успешно!</h3>
          <p className={STYLES.resultText}>
            <strong>Результат:</strong> {result.result} {formData.toCurrency}
          </p>
          <p className={STYLES.rateText}>
            <strong>Курс:</strong> {result.rate}
          </p>
        </div>
      )}

      {/* История операций */}
      <div className={STYLES.historySection}>
        <h3 className={STYLES.historyTitle}>История операций (за сегодня)</h3>

        {history.length === 0 ? (
          <p className={STYLES.emptyHistory}>Операций пока нет</p>
        ) : (
          <div className={STYLES.historyList}>
            {history.map((item, index) => (
              <div key={index} className={STYLES.historyItem}>
                <div className={STYLES.historyDescription}>
                  {item.action_description}
                </div>
                <div className={STYLES.historyTime}>
                  {new Date(item.datetime).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorPanel;
