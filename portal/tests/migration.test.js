const test = require('node:test');
const assert = require('node:assert');
const { openDb, migrate } = require('../src/db');

test('миграция 005 переносит статусы и отзывы без потери данных', () => {
  const db = openDb(':memory:');
  migrate(db, '004_event_photos.sql'); // база в состоянии до практики 12
  db.exec(`
    INSERT INTO users (login, password, email, phone) VALUES ('u1', 'x', 'u1@t.test', '+79000000001'), ('u2', 'x', 'u2@t.test', '+79000000002');
    INSERT INTO events (title, starts_at, place, description) VALUES ('Событие', '2026-10-01 10:00', 'Москва', 'Описание');
    INSERT INTO applications (user_id, event_id, room, payment, status, review_text, review_rating, reviewed_at)
      VALUES (1, 1, 'Малый зал', 'Картой онлайн', 'завершено', 'Хороший отзыв', 5, '2026-10-02 09:00');
    INSERT INTO applications (user_id, event_id, room, payment, status) VALUES (2, 1, 'Большой зал', 'Картой онлайн', 'назначено');
  `);

  assert.deepStrictEqual(migrate(db), ['005_statuses_reviews.js', '006_login_nocase.sql']);

  const rows = db.prepare('SELECT a.id, s.name AS status FROM applications a JOIN statuses s ON s.id = a.status_id ORDER BY a.id').all();
  assert.deepStrictEqual(rows.map((r) => r.status), ['завершено', 'назначено']);
  const review = db.prepare('SELECT application_id, text, rating FROM reviews').all();
  assert.deepStrictEqual(review, [{ application_id: 1, text: 'Хороший отзыв', rating: 5 }]);
  assert.deepStrictEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.strictEqual(db.prepare('PRAGMA integrity_check').pluck().get(), 'ok');
});

test('оценка вне диапазона 1-5 не попадает в таблицу отзывов', () => {
  const db = openDb(':memory:');
  migrate(db);
  db.exec(`
    INSERT INTO users (login, password, email, phone) VALUES ('u1', 'x', 'u1@t.test', '+79000000001');
    INSERT INTO events (title, starts_at, place, description) VALUES ('Событие', '2026-10-01 10:00', 'Москва', 'Описание');
    INSERT INTO applications (user_id, event_id, room, payment) VALUES (1, 1, 'Малый зал', 'Картой онлайн');
  `);
  assert.throws(() => db.prepare("INSERT INTO reviews (application_id, text, rating, created_at) VALUES (1, 'text', 9, 'now')").run(), /CHECK constraint failed/);
});
