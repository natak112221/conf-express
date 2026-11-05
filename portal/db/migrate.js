// Запускает по порядку файлы из db/migrations, которые ещё не применялись
const { openDb, migrate } = require('../src/db');

const db = openDb();
const done = migrate(db);
console.log(done.length ? 'Применены миграции: ' + done.join(', ') : 'Новых миграций нет');
db.close();
