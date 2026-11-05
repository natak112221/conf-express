-- Практика 16: логин уникален без учёта регистра (ivan_k и Ivan_K это один логин)
CREATE UNIQUE INDEX idx_users_login_nocase ON users(login COLLATE NOCASE);
