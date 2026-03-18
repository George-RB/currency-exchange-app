import React, { useState, useEffect } from 'react';

function OperatorPanel() {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('BYN');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Загрузка истории при монтировании
  useEffect(() => {
    loadHistory();
  }, []);



  const loadHistory = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token'); // 👈 берём токен

    console.log('Загрузка истории с токеном:', token);

    const response = await fetch('http://localhost:3000/api/operator/history', {
      headers: {
        'Authorization': `Bearer ${token}`, // 👈 отправляем токен
      },
    });

    console.log('Статус ответа:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ошибка: ${response.status}`);
    }

    const data = await response.json();
    console.log('Данные истории:', data);

    if (data.success) {
      setHistory(data.history || []);
      setError('');
    } else {
      setError(data.error || 'Ошибка загрузки истории');
    }
  } catch (error) {
    console.error('Ошибка загрузки истории:', error);
    setError('Не удалось загрузить историю: ' + error.message);
  } finally {
    setLoading(false);
  }
};

  const handleExchange = async (e) => {
    e.preventDefault();
    setResult(null);
    setError('');
    
    try {
      setLoading(true);
      
      console.log('Отправка запроса на обмен:', {
        fromCurrency,
        toCurrency,
        amount: parseFloat(amount)
      });
      
      

const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/operator/exchange', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,   // 👈 вот так
  },
  body: JSON.stringify({ fromCurrency, toCurrency, amount }),
});
      
      console.log('Статус ответа:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ошибка: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Результат обмена:', data);
      
      if (data.success) {
        setResult(data.result);
        setAmount('');
        loadHistory(); // Обновляем историю после успешного обмена
        setError('');
      } else {
        setError(data.error || 'Ошибка обмена');
      }
    } catch (error) {
      console.error('Ошибка обмена:', error);
      setError('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const currencies = ['USD', 'EUR', 'BYN', 'RUB', 'PLN'];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Панель оператора</h2>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '10px', padding: '10px', border: '1px solid red' }}>
          ❌ {error}
        </div>
      )}
      
      <div style={{ marginBottom: '30px' }}>
        <h3>Обмен валют</h3>
        <form onSubmit={handleExchange}>
          <div style={{ marginBottom: '10px' }}>
            <label>Из валюты: </label>
            <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)}>
              {currencies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label>В валюту: </label>
            <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)}>
              {currencies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label>Сумма: </label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              required
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Обмен...' : 'Обменять'}
          </button>
        </form>
        
        {result && (
          <div style={{ marginTop: '20px', padding: '10px', background: '#e0ffe0' }}>
            <strong>Результат:</strong> {result} {toCurrency}
          </div>
        )}
      </div>
      
      <div>
        <h3>История операций за сегодня</h3>
        {loading && <p>Загрузка...</p>}
        
        {!loading && history.length === 0 && (
          <p>Нет операций за сегодня</p>
        )}
        
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {history.map((item, index) => (
            <li key={index} style={{ 
              marginBottom: '10px', 
              padding: '10px', 
              background: '#f0f0f0',
              borderRadius: '5px'
            }}>
              <div><strong>{item.datetime}</strong></div>
              <div>{item.action_description}</div>
            </li>
          ))}
        </ul>
        
        <button onClick={loadHistory} style={{ marginTop: '10px' }}>
          Обновить историю
        </button>
      </div>
    </div>
  );
}

export default OperatorPanel;