import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import AdminPanel from "./components/AdminPanel";
import OperatorPanel from "./components/OperatorPanel";
import STYLES from "./styles/App.module.css";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Проверяем, есть ли сохраненный пользователь
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const handleLogout = async () => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    localStorage.removeItem("user");
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className={STYLES.appContainer}>
      <header className={STYLES.appHeader}>
        <span className={STYLES.userInfo}>
          Пользователь: {user.login} ({user.role})
        </span>
        <button className={STYLES.logoutButton} onClick={handleLogout}>
          Выйти
        </button>
      </header>

      {user.role === "admin" && <AdminPanel />}
      {user.role === "operator" && <OperatorPanel />}
    </div>
  );
}

export default App;
