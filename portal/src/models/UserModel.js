// Работа с таблицей users
const bcrypt = require('bcryptjs');

const ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;
class UserModel {
  constructor(db) {
    this.db = db;
  }

  findByLogin(login) {
    return this.db.prepare('SELECT * FROM users WHERE login = ?').get(login);
  }

  checkPassword(user, password) {
    return bcrypt.compareSync(String(password || ''), user.password);
  }

  findById(id) {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  create({ login, password, email, phone, role = 'participant' }) {
    const r = this.db
      .prepare('INSERT INTO users (login, password, email, phone, role) VALUES (?, ?, ?, ?, ?)')
      .run(login, bcrypt.hashSync(password, ROUNDS), email, phone, role);
    return this.findById(r.lastInsertRowid);
  }
}

module.exports = UserModel;
