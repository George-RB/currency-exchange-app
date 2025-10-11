import React, { useState } from 'react';
import STYLES from '../styles/Login.module.css';

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

      if (response.ok && data.success) {
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
    <div className={STYLES.loginContainer}>
      <h2 className={STYLES.loginTitle}>Вход в систему</h2>
      <form onSubmit={handleSubmit} className={STYLES.loginForm}>
        <div className={STYLES.formGroup}>
          <input
            type="text"
            name="login"
            placeholder="Логин"
            value={formData.login}
            onChange={handleChange}
            className={STYLES.formInput}
            required
          />
        </div>
        <div className={STYLES.formGroup}>
          <input
            type="password"
            name="password"
            placeholder="Пароль"
            value={formData.password}
            onChange={handleChange}
            className={STYLES.formInput}
            required
          />
        </div>
        <button type="submit" className={STYLES.submitButton}>
          Войти
        </button>
      </form>
      <div className={STYLES.testUsers}>
        <p className={STYLES.testUsersTitle}>
          <strong>Тестовые пользователи:</strong>
        </p>
        <p className={STYLES.testUser}>
          Админ: login: admin, password: admin123
        </p>
        <p className={STYLES.testUser}>
          Оператор: login: operator, password: operator123
        </p>
      </div>
    </div>
  );
};

export default Login;
