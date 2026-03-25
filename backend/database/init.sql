-- =====================================================
-- Файл инициализации базы данных для проекта "Обменник"
-- Запуск: mysql -u root -p < database/init.sql
-- =====================================================

-- Создаем базу данных если её нет
CREATE DATABASE IF NOT EXISTS currency_exchange;
USE currency_exchange;

-- =====================================================
-- Таблица пользователей
-- =====================================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    login VARCHAR(50) UNIQUE NOT NULL COMMENT 'Логин пользователя',
    password VARCHAR(255) NOT NULL COMMENT 'Пароль (в разработке без хеширования)',
    role ENUM('admin', 'operator') NOT NULL COMMENT 'Роль пользователя',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Дата создания',
    INDEX idx_login (login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Пользователи системы';

-- =====================================================
-- Таблица курсов валют
-- =====================================================
DROP TABLE IF EXISTS currency_rates;
CREATE TABLE currency_rates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    currency_code VARCHAR(3) NOT NULL COMMENT 'Код валюты (USD, EUR, BYN)',
    rate DECIMAL(10, 4) NOT NULL COMMENT 'Курс к базовой валюте',
    date DATE NOT NULL COMMENT 'Дата курса',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_currency_date (currency_code, date),
    INDEX idx_date (date),
    UNIQUE KEY unique_currency_date (currency_code, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Курсы валют по датам';

-- =====================================================
-- Таблица логов операций
-- =====================================================
DROP TABLE IF EXISTS operations_log;
CREATE TABLE operations_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT 'ID пользователя',
    action_description TEXT NOT NULL COMMENT 'Описание действия',
    datetime DATETIME NOT NULL COMMENT 'Дата и время',
    amount DECIMAL(10, 2) DEFAULT NULL COMMENT 'Сумма обмена',
    from_currency VARCHAR(3) DEFAULT NULL COMMENT 'Из какой валюты',
    to_currency VARCHAR(3) DEFAULT NULL COMMENT 'В какую валюту',
    result_amount DECIMAL(10, 2) DEFAULT NULL COMMENT 'Результат обмена',
    session_id VARCHAR(100) DEFAULT NULL COMMENT 'ID сессии',
    ip_address VARCHAR(45) DEFAULT NULL COMMENT 'IP адрес',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_datetime (datetime),
    INDEX idx_user_date (user_id, datetime),
    INDEX idx_session (session_id),
    INDEX idx_currencies (from_currency, to_currency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Лог действий пользователей';

-- =====================================================
-- Дополнительные индексы для ускорения отчетов 
-- =====================================================
CREATE INDEX idx_reports_date ON operations_log (datetime);
CREATE INDEX idx_reports_currencies ON operations_log (from_currency, to_currency);

-- =====================================================
-- Таблица для хранения сессий
-- =====================================================
DROP TABLE IF EXISTS sessions;
CREATE TABLE sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    login_time DATETIME NOT NULL,
    logout_time DATETIME DEFAULT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_user_sessions (user_id, login_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Сессии пользователей';

-- =====================================================
-- Добавление начальных данных
-- =====================================================

-- Добавляем пользователей 
INSERT INTO users (login, password, role) VALUES
('admin', '$2b$10$ExqHiKCoGzXVHY23zBAtOOCBmKBQgua5Vzg0qmjYhAyPwQWY/plB2', 'admin'),
('operator', '$2b$10$HvpNAi9l26R8eiFQGiwubOt/w.1XL1/DMT0jfn7Z3lwfiSrhJwfBu', 'operator');

-- Добавляем начальные курсы валют
INSERT INTO currency_rates (currency_code, rate, date) VALUES
('USD', 2.5000, CURDATE()),
('EUR', 3.0000, CURDATE()),
('BYN', 1.0000, CURDATE()),
('RUB', 0.0333, CURDATE()),
('PLN', 0.6000, CURDATE());

-- Добавляем исторические курсы для теста
INSERT INTO currency_rates (currency_code, rate, date) VALUES
('USD', 2.4800, DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
('EUR', 2.9500, DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
('USD', 2.4600, DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
('EUR', 2.9200, DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
('USD', 2.4400, DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
('EUR', 2.9000, DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
('USD', 2.4200, DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
('EUR', 2.8800, DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
('USD', 2.4000, DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
('EUR', 2.8600, DATE_SUB(CURDATE(), INTERVAL 5 DAY));

-- Добавляем тестовые операции
INSERT INTO operations_log (user_id, action_description, datetime, amount, from_currency, to_currency, result_amount, session_id, ip_address)
VALUES
(2, 'Обмен 100 USD -> 250.00 BYN', NOW() - INTERVAL 1 HOUR, 100, 'USD', 'BYN', 250.00, 'test_session_1', '127.0.0.1'),
(2, 'Обмен 50 EUR -> 150.00 BYN', NOW() - INTERVAL 2 HOUR, 50, 'EUR', 'BYN', 150.00, 'test_session_1', '127.0.0.1'),
(2, 'Обмен 1000 RUB -> 33.30 BYN', NOW() - INTERVAL 1 DAY, 1000, 'RUB', 'BYN', 33.30, 'test_session_2', '127.0.0.1'),
(2, 'Обмен 200 USD -> 496.00 BYN', NOW() - INTERVAL 2 DAY, 200, 'USD', 'BYN', 496.00, 'test_session_3', '127.0.0.1'),
(1, 'Установлен курс USD = 2.5000', NOW() - INTERVAL 1 DAY, NULL, NULL, NULL, NULL, NULL, '127.0.0.1'),
(1, 'Сброс всех курсов к начальным значениям', NOW() - INTERVAL 3 DAY, NULL, NULL, NULL, NULL, NULL, '127.0.0.1');

-- Дополнительные тестовые операции для разных валютных пар 
INSERT INTO operations_log (user_id, action_description, datetime, amount, from_currency, to_currency, result_amount, session_id, ip_address)
VALUES
(2, 'Обмен 500 USD -> 450.00 EUR', NOW() - INTERVAL 3 DAY, 500, 'USD', 'EUR', 450.00, 'test_session_4', '127.0.0.1'),
(2, 'Обмен 200 USD -> 180.00 EUR', NOW() - INTERVAL 4 DAY, 200, 'USD', 'EUR', 180.00, 'test_session_4', '127.0.0.1'),
(2, 'Обмен 300 EUR -> 330.00 USD', NOW() - INTERVAL 5 DAY, 300, 'EUR', 'USD', 330.00, 'test_session_5', '127.0.0.1'),
(2, 'Обмен 1000 PLN -> 600.00 BYN', NOW() - INTERVAL 2 DAY, 1000, 'PLN', 'BYN', 600.00, 'test_session_6', '127.0.0.1'),
(2, 'Обмен 500 PLN -> 300.00 BYN', NOW() - INTERVAL 3 DAY, 500, 'PLN', 'BYN', 300.00, 'test_session_6', '127.0.0.1'),
(2, 'Обмен 5000 RUB -> 166.50 BYN', NOW() - INTERVAL 1 DAY, 5000, 'RUB', 'BYN', 166.50, 'test_session_7', '127.0.0.1');

-- =====================================================
-- Создание представлений (VIEW) для удобства
-- =====================================================

-- Представление для оператора
CREATE OR REPLACE VIEW v_operator_history AS
SELECT 
    ol.datetime,
    u.login as operator,
    ol.action_description,
    ol.amount,
    ol.from_currency,
    ol.to_currency,
    ol.result_amount,
    ol.session_id
FROM operations_log ol
JOIN users u ON ol.user_id = u.id
WHERE ol.action_description LIKE 'Обмен%'
ORDER BY ol.datetime DESC;

-- Представление для админа 
CREATE OR REPLACE VIEW v_admin_report AS
SELECT 
    DATE(ol.datetime) as operation_date,
    ol.from_currency,
    ol.to_currency,
    COUNT(*) as operations_count,
    SUM(ol.amount) as total_amount_from,
    SUM(ol.result_amount) as total_amount_to,
    AVG(ol.result_amount / ol.amount) as avg_rate
FROM operations_log ol
WHERE ol.action_description LIKE 'Обмен%'
GROUP BY DATE(ol.datetime), ol.from_currency, ol.to_currency;

-- =====================================================
-- Создание триггеров 
-- =====================================================

DELIMITER //
CREATE TRIGGER after_currency_rate_insert
AFTER INSERT ON currency_rates
FOR EACH ROW
BEGIN
    INSERT INTO operations_log (user_id, action_description, datetime, ip_address)
    VALUES (1, CONCAT('Автоматическое обновление курса ', NEW.currency_code, ' = ', NEW.rate, ' на ', NEW.date), NOW(), 'system');
END//
DELIMITER ;

-- =====================================================
-- Проверка структуры для отчетов 
-- =====================================================
SELECT 'Проверка структуры для отчетов:' as 'Check';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'operations_log' 
AND COLUMN_NAME IN ('amount', 'from_currency', 'to_currency', 'result_amount', 'datetime');

-- =====================================================
-- Информация о БД
-- =====================================================
SELECT 'База данных успешно инициализирована!' as 'Status';
SELECT CONCAT('Пользователей: ', COUNT(*)) as 'Info' FROM users;
SELECT CONCAT('Курсов валют: ', COUNT(*)) as 'Info' FROM currency_rates;
SELECT CONCAT('Операций: ', COUNT(*)) as 'Info' FROM operations_log;