// import React, { useState, useEffect } from 'react';
// import STYLES from '../styles/OperatorPanel.module.css';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// const OperatorPanel = () => {
//   const [formData, setFormData] = useState({
//     fromCurrency: 'USD',
//     toCurrency: 'BYN',
//     amount: '',
//   });
//   const [result, setResult] = useState(null);
//   const [history, setHistory] = useState([]);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   // Загружаем историю операций
//   const loadHistory = async () => {
//     const user = JSON.parse(localStorage.getItem('user'));

//     try {
//       // 👇 Создаем отдельный GET запрос для истории
//       const response = await fetch(`${API_URL}/api/operator/history`, {
//         method: 'GET',
//         headers: {
//           'x-user-login': user.login,
//           'x-user-role': user.role,
//         },
//       });

//       const data = await response.json();
//       if (data.success) {
//         setHistory(data.history);
//       } else {
//         console.error('Ошибка загрузки истории:', data.error);
//       }
//     } catch (error) {
//       console.error('Ошибка загрузки истории:', error);
//     }
//   };

//   useEffect(() => {
//     loadHistory();
//   }, []);

//   const handleExchange = async (e) => {
//     e.preventDefault();
//     setError('');
//     setResult(null);
//     setLoading(true);

//     const user = JSON.parse(localStorage.getItem('user'));

//     try {
//       const response = await fetch(`${API_URL}/api/operator/exchange`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'x-user-login': user.login,
//           'x-user-role': user.role,
//         },
//         body: JSON.stringify(formData),
//       });

//       const data = await response.json();

//       if (data.success) {
//         setResult(data);
//         setFormData({ ...formData, amount: '' });
//         loadHistory(); // Обновляем историю после операции
//       } else {
//         setError(data.error || 'Произошла ошибка при обмене');
//       }
//     } catch (error) {
//       console.error('Ошибка:', error);
//       setError('Ошибка соединения с сервером');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className={STYLES.operatorContainer}>
//       <h1 className={STYLES.title}>Панель оператора</h1>

//       {/* Форма обмена */}
//       <div className={STYLES.exchangeForm}>
//         <h3 className={STYLES.formTitle}>Обмен валют</h3>

//         {error && <div className={STYLES.errorMessage}>⚠️ {error}</div>}

//         <form onSubmit={handleExchange}>
//           <div className={STYLES.formGroup}>
//             <label className={STYLES.label}>Сумма:</label>
//             <input
//               type="number"
//               placeholder="Введите сумму"
//               value={formData.amount}
//               onChange={(e) =>
//                 setFormData({ ...formData, amount: e.target.value })
//               }
//               required
//               min="0.01"
//               step="0.01"
//               className={STYLES.input}
//             />
//           </div>

//           <div className={STYLES.currencyRow}>
//             <div className={STYLES.currencyGroup}>
//               <label className={STYLES.label}>Из:</label>
//               <select
//                 value={formData.fromCurrency}
//                 onChange={(e) =>
//                   setFormData({ ...formData, fromCurrency: e.target.value })
//                 }
//                 className={STYLES.select}
//               >
//                 <option value="USD">USD - Доллар США</option>
//                 <option value="EUR">EUR - Евро</option>
//                 <option value="BYN">BYN - Белорусский рубль</option>
//               </select>
//             </div>

//             <div className={STYLES.arrow}>→</div>

//             <div className={STYLES.currencyGroup}>
//               <label className={STYLES.label}>В:</label>
//               <select
//                 value={formData.toCurrency}
//                 onChange={(e) =>
//                   setFormData({ ...formData, toCurrency: e.target.value })
//                 }
//                 className={STYLES.select}
//               >
//                 <option value="BYN">BYN - Белорусский рубль</option>
//                 <option value="USD">USD - Доллар США</option>
//                 <option value="EUR">EUR - Евро</option>
//               </select>
//             </div>
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className={STYLES.submitButton}
//           >
//             {loading ? 'Обмен...' : 'Обменять'}
//           </button>
//         </form>
//       </div>

//       {/* Результат */}
//       {result && (
//         <div className={STYLES.successMessage}>
//           <h3 className={STYLES.successTitle}>✅ Успешно!</h3>
//           <p className={STYLES.resultText}>
//             <strong>Результат:</strong> {result.result} {formData.toCurrency}
//           </p>
//           <p className={STYLES.rateText}>
//             <strong>Курс:</strong> {result.rate}
//           </p>
//         </div>
//       )}

//       {/* История операций */}
//       <div className={STYLES.historySection}>
//         <h3 className={STYLES.historyTitle}>История операций (за сегодня)</h3>

//         {history.length === 0 ? (
//           <p className={STYLES.emptyHistory}>Операций пока нет</p>
//         ) : (
//           <div className={STYLES.historyList}>
//             {history.map((item, index) => (
//               <div key={index} className={STYLES.historyItem}>
//                 <div className={STYLES.historyDescription}>
//                   {item.action_description}
//                 </div>
//                 <div className={STYLES.historyTime}>
//                   {new Date(item.datetime).toLocaleTimeString()}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default OperatorPanel;
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
      const user = JSON.parse(localStorage.getItem('user'));
      
      console.log('Загрузка истории для пользователя:', user);
      
      const response = await fetch('http://localhost:3000/api/operator/history', {
        headers: {
          'x-user-login': user.login,
          'x-user-role': user.role
        }
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
      const user = JSON.parse(localStorage.getItem('user'));
      
      console.log('Отправка запроса на обмен:', {
        fromCurrency,
        toCurrency,
        amount: parseFloat(amount)
      });
      
      const response = await fetch('http://localhost:3000/api/operator/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-login': user.login,
          'x-user-role': user.role
        },
        body: JSON.stringify({
          fromCurrency,
          toCurrency,
          amount: parseFloat(amount)
        })
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