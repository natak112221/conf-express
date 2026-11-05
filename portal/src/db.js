const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DEFAULT_FILE = path.join(__dirname, '..', 'data', 'portal.sqlite');
const MIGRATIONS = path.join(__dirname, '..', 'db', 'migrations');

function openDb(file = process.env.DB_FILE || DEFAULT_FILE) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('foreign_keys = ON');
  return db;
}

// Применяет новые миграции, возвращает список применённых (upTo: остановиться на файле с таким именем, нужно для тестов)
function migrate(db, upTo = 'zzz') {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
  const applied = new Set(db.prepare('SELECT name FROM schema_migrations').pluck().all());
  const files = fs.readdirSync(MIGRATIONS).filter((f) => /\.(sql|js)$/.test(f) && f <= upTo).sort();
  const done = [];
  for (const f of files) {
    if (applied.has(f)) continue;
    // внешние ключи на время миграции выключаем, чтобы можно было пересоздать таблицу
    db.pragma('foreign_keys = OFF');
    db.exec('BEGIN');
    try {
      if (f.endsWith('.sql')) db.exec(fs.readFileSync(path.join(MIGRATIONS, f), 'utf8'));
      else require(path.join(MIGRATIONS, f)).up(db);
      db.prepare("INSERT INTO schema_migrations VALUES (?, datetime('now', 'localtime'))").run(f);
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    } finally {
      db.pragma('foreign_keys = ON');
    }
    done.push(f);
  }
  return done;
}

module.exports = { openDb, migrate };
