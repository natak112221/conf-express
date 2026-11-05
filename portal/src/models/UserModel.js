// Работа с таблицей users
class UserModel {
  constructor(db) {
    this.db = db;
  }

  findByLogin(login) {
    return this.db.prepare('SELECT * FROM users WHERE login = ?').get(login);
  }

  findById(id) {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  create({ login, password, email, phone, role = 'participant' }) {
    const r = this.db
      .prepare('INSERT INTO users (login, password, email, phone, role) VALUES (?, ?, ?, ?, ?)')
      .run(login, password, email, phone, role);
    return this.findById(r.lastInsertRowid);
  }
}

module.exports = UserModel;
