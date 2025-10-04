import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    login: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        alert(data.error || 'Ошибка входа');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка соединения');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div style={{ maxWidth: '300px', margin: '50px auto' }}>
      <h2>Вход в систему</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            name="login"
            placeholder="Логин"
            value={formData.login}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <input
            type="password"
            name="password"
            placeholder="Пароль"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Войти</button>
      </form>
      <div style={{ marginTop: '20px', fontSize: '12px' }}>
        <p>
          <strong>Тестовые пользователи:</strong>
        </p>
        <p>Админ: login: admin, password: admin123</p>
        <p>Оператор: login: operator, password: operator123</p>
      </div>
    </div>
  );
};

export default Login;
