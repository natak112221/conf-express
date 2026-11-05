// Заявки на участие. Статус лежит в таблице statuses, отзыв в таблице reviews
const BASE = `
  SELECT a.id, a.user_id, a.event_id, a.room, a.payment, a.created_at,
         s.name AS status,
         e.title, e.starts_at, e.place,
         r.text AS review_text, r.rating AS review_rating
  FROM applications a
  JOIN statuses s ON s.id = a.status_id
  JOIN events e ON e.id = a.event_id
  LEFT JOIN reviews r ON r.application_id = a.id`;

class ApplicationModel {
  constructor(db) {
    this.db = db;
  }

  create({ userId, eventId, room, payment }) {
    const r = this.db
      .prepare("INSERT INTO applications (user_id, event_id, room, payment, status_id) VALUES (?, ?, ?, ?, (SELECT id FROM statuses WHERE name = 'новая'))")
      .run(userId, eventId, room, payment);
    return r.lastInsertRowid;
  }

  find(id) {
    return this.db.prepare(BASE + ' WHERE a.id = ?').get(id);
  }

  findByUserAndEvent(userId, eventId) {
    return this.db.prepare(BASE + ' WHERE a.user_id = ? AND a.event_id = ?').get(userId, eventId);
  }

  byUser(userId) {
    return this.db.prepare(BASE + ' WHERE a.user_id = ? ORDER BY a.id DESC').all(userId);
  }

  // условия отбора: { status, eventId }, пустые пропускаются
  where({ status, eventId }) {
    const where = [];
    const params = [];
    if (status) {
      where.push('s.name = ?');
      params.push(status);
    }
    if (eventId) {
      where.push('a.event_id = ?');
      params.push(eventId);
    }
    return { sql: where.length ? 'WHERE ' + where.join(' AND ') : '', params };
  }

  count(filter = {}) {
    const { sql, params } = this.where(filter);
    return this.db
      .prepare(`SELECT COUNT(*) FROM applications a JOIN statuses s ON s.id = a.status_id ${sql}`)
      .pluck()
      .get(...params);
  }

  // limit и offset нужны для постраничного вывода
  all({ status, eventId, limit = -1, offset = 0 } = {}) {
    const { sql, params } = this.where({ status, eventId });
    return this.db
      .prepare(
        `SELECT a.id, a.user_id, a.event_id, a.room, a.payment, a.created_at, s.name AS status,
                e.title, e.starts_at, u.login, u.email, u.phone,
                r.text AS review_text, r.rating AS review_rating
         FROM applications a
         JOIN statuses s ON s.id = a.status_id
         JOIN events e ON e.id = a.event_id
         JOIN users u ON u.id = a.user_id
         LEFT JOIN reviews r ON r.application_id = a.id
         ${sql}
         ORDER BY a.id DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);
  }

  setStatus(id, status) {
    this.db.prepare('UPDATE applications SET status_id = (SELECT id FROM statuses WHERE name = ?) WHERE id = ?').run(status, id);
  }

  addReview(id, text, rating) {
    this.db
      .prepare("INSERT INTO reviews (application_id, text, rating, created_at) VALUES (?, ?, ?, datetime('now', 'localtime'))")
      .run(id, text, rating);
  }
}

module.exports = ApplicationModel;
