// Практика 4: пароли в хеши, таблицы для сессий и для блокировки перебора пароля
const bcrypt = require('bcryptjs');

exports.up = (db) => {
  const users = db.prepare('SELECT id, password FROM users').all();
  const update = db.prepare('UPDATE users SET password = ? WHERE id = ?');
  for (const u of users) {
    if (!u.password.startsWith('$2')) update.run(bcrypt.hashSync(u.password, 10), u.id);
  }

  db.exec(`
    CREATE TABLE sessions (
      sid TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      expires INTEGER NOT NULL
    );
    CREATE TABLE login_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login TEXT NOT NULL,
      ip TEXT NOT NULL,
      at INTEGER NOT NULL
    );
    CREATE INDEX idx_login_attempts_login ON login_attempts(login, at);
  `);
};
