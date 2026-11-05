// Практика 12: статусы и отзывы переезжают в свои таблицы.
// SQLite не умеет менять столбец на месте, поэтому таблица заявок создаётся заново, данные переносятся.
exports.up = (db) => {
  db.exec(`
    CREATE TABLE statuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
    INSERT INTO statuses (name) VALUES ('новая'), ('назначено'), ('завершено');

    CREATE TABLE applications_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      event_id INTEGER NOT NULL REFERENCES events(id),
      room TEXT NOT NULL,
      payment TEXT NOT NULL,
      status_id INTEGER NOT NULL DEFAULT 1 REFERENCES statuses(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE (user_id, event_id)
    );

    CREATE TABLE reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL UNIQUE REFERENCES applications_new(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      created_at TEXT NOT NULL
    );
  `);

  // статус ищем в новой таблице по названию
  db.exec(`
    INSERT INTO applications_new (id, user_id, event_id, room, payment, status_id, created_at)
    SELECT a.id, a.user_id, a.event_id, a.room, a.payment, s.id, a.created_at
    FROM applications a JOIN statuses s ON s.name = a.status;

    INSERT INTO reviews (application_id, text, rating, created_at)
    SELECT id, review_text, review_rating, COALESCE(reviewed_at, created_at)
    FROM applications WHERE review_text IS NOT NULL;
  `);

  const before = db.prepare('SELECT COUNT(*) FROM applications').pluck().get();
  const after = db.prepare('SELECT COUNT(*) FROM applications_new').pluck().get();
  if (before !== after) throw new Error(`Перенесено ${after} заявок из ${before}`);

  db.exec('DROP TABLE applications; ALTER TABLE applications_new RENAME TO applications;');

  // проверка целостности связей: нарушений быть не должно
  const broken = db.prepare('PRAGMA foreign_key_check').all();
  if (broken.length) throw new Error('Нарушены внешние ключи: ' + JSON.stringify(broken));
};
