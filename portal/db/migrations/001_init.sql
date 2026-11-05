-- Первая версия базы (практика 3)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'participant',
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  place TEXT NOT NULL,
  description TEXT NOT NULL,
  photo TEXT
);

CREATE TABLE applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  event_id INTEGER NOT NULL REFERENCES events(id),
  room TEXT NOT NULL,
  payment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'новая',
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
