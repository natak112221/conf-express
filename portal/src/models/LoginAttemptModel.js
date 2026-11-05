// Неудачные попытки входа: после 5 неверных паролей за 10 минут вход по этому логину закрывается
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

class LoginAttemptModel {
  constructor(db) {
    this.db = db;
  }

  fail(login, ip) {
    this.db.prepare('INSERT INTO login_attempts (login, ip, at) VALUES (?, ?, ?)').run(login.toLowerCase(), ip, Date.now());
  }

  isBlocked(login) {
    const n = this.db
      .prepare('SELECT COUNT(*) FROM login_attempts WHERE login = ? AND at > ?')
      .pluck()
      .get(login.toLowerCase(), Date.now() - WINDOW_MS);
    return n >= MAX_ATTEMPTS;
  }

  clear(login) {
    this.db.prepare('DELETE FROM login_attempts WHERE login = ?').run(login.toLowerCase());
  }
}

module.exports = LoginAttemptModel;
