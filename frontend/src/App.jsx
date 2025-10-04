import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import OperatorPanel from './components/OperatorPanel';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Проверяем, есть ли сохраненный пользователь
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div>
      <header style={{ padding: '10px', background: '#f5f5f5' }}>
        <span>
          Пользователь: {user.login} ({user.role})
        </span>
        <button onClick={handleLogout} style={{ marginLeft: '20px' }}>
          Выйти
        </button>
      </header>

      {user.role === 'admin' && <AdminPanel />}
      {user.role === 'operator' && <OperatorPanel />}
    </div>
  );
}

export default App;
