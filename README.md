# Обменник валют

Веб-приложение для обмена валют с ролями администратора и оператора.  
Проект выполнен в рамках тестового задания для отдела ИТ ОАО «Мозырский НПЗ».

## Стек технологий

| Компонент      | Технология                                       |
| -------------- | ------------------------------------------------ |
| Фронтенд       | React + Vite                                     |
| Бэкенд         | Node.js + Express                                |
| База данных    | MySQL                                            |
| Аутентификация | JWT + HTTP-Only Cookies                          |
| Безопасность   | bcrypt, параметризованные запросы, rate limiting |
| Внешний API    | Нацбанк РБ                                       |

---

## Требования

- Node.js 16+
- MySQL 5.7+
- npm

---

## Установка и запуск

### 1. Клонировать репозиторий

```bash
git clone <url-репозитория>
cd currency-exchange-app
```

---

### 2. Настроить базу данных

```bash
# Войти в MySQL
mysql -u root -p

# Создать базу данных
CREATE DATABASE currency_exchange;
USE currency_exchange;

# Импортировать структуру (файл есть в проекте)
SOURCE backend/database/init.sql;
```

В файле `backend/database/init.sql` уже есть:

- создание таблиц (`users`, `currency_rates`, `operations_log`, `sessions`)
- добавление индексов
- тестовые пользователи (admin / operator)
- начальные курсы валют

---

### 3. Настроить переменные окружения

Создать файл `backend/.env`:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=ваш_пароль
DB_NAME=currency_exchange
DB_PORT=3306
JWT_SECRET=любой_случайный_ключ
```

Создать файл `frontend/.env`:

```
VITE_API_URL=http://localhost:3000
```

---

### 4. Установить зависимости и запустить

**Бэкенд (терминал 1):**

```bash
cd backend
npm install
npm run dev
```

Сервер запустится на `http://localhost:3000`

**Фронтенд (терминал 2):**

```bash
cd frontend
npm install
npm run dev
```

Приложение откроется на `http://localhost:5173`

---

## Вход в систему

| Роль          | Логин    | Пароль      |
| ------------- | -------- | ----------- |
| Администратор | admin    | admin123    |
| Оператор      | operator | operator123 |

---

## Возможности

### Оператор

- Просмотр текущих курсов
- История курсов на любую дату
- Обмен валют с автоматическим расчётом
- История своих операций за сегодня и за сессию

### Администратор

- Установка и сброс курсов
- Простые отчёты (операции по дням)
- Полные отчёты с фильтрами по датам и валютам
- Синхронизация с API Нацбанка РБ (ручная и автоматическая ежедневно в 14:30)

---

## Безопасность

- JWT токены в HTTP-Only Cookies (защита от XSS)
- Параметризованные SQL-запросы (защита от инъекций)
- bcrypt для хеширования паролей
- Rate limiting (5 попыток входа / 15 мин, 100 запросов / 15 мин к API)
- SameSite cookies (защита от CSRF)

---

## Структура проекта

```
currency-exchange-app/
├── backend/
│   ├── config/           # подключение к БД
│   ├── middleware/       # JWT, roleAuth, rateLimiter
│   ├── routes/           # auth, operator, admin
│   ├── services/         # nbrbApi, rateScheduler
│   ├── database/         # init.sql
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/   # Login, OperatorPanel, AdminPanel
│   │   └── styles/       # CSS модули
│   └── index.html
└── README.md
```

---

## Контакты

Разработчик: Картавенко Георгий  
Email: g.kartavenko@inbox.ru  
GitHub: github.com/George-RB
