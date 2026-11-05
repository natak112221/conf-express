// Мероприятия
class EventModel {
  constructor(db) {
    this.db = db;
  }

  all() {
    return this.db.prepare('SELECT * FROM events ORDER BY starts_at').all();
  }

  titles() {
    return this.db.prepare('SELECT id, title FROM events ORDER BY starts_at').all();
  }

  find(id) {
    return this.db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  }
}

module.exports = EventModel;
