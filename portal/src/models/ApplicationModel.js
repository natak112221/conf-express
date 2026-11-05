// Заявки на участие
class ApplicationModel {
  constructor(db) {
    this.db = db;
  }

  create({ userId, eventId, room, payment }) {
    const r = this.db
      .prepare('INSERT INTO applications (user_id, event_id, room, payment) VALUES (?, ?, ?, ?)')
      .run(userId, eventId, room, payment);
    return r.lastInsertRowid;
  }

  find(id) {
    return this.db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  }

  findByUserAndEvent(userId, eventId) {
    return this.db.prepare('SELECT * FROM applications WHERE user_id = ? AND event_id = ?').get(userId, eventId);
  }

  byUser(userId) {
    return this.db
      .prepare(
        `SELECT a.*, e.title, e.starts_at, e.place
         FROM applications a JOIN events e ON e.id = a.event_id
         WHERE a.user_id = ? ORDER BY a.id DESC`
      )
      .all(userId);
  }

  all() {
    return this.db
      .prepare(
        `SELECT a.*, e.title, e.starts_at, u.login, u.email, u.phone
         FROM applications a
         JOIN events e ON e.id = a.event_id
         JOIN users u ON u.id = a.user_id
         ORDER BY a.id DESC`
      )
      .all();
  }

  setStatus(id, status) {
    this.db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, id);
  }
}

module.exports = ApplicationModel;
