// Замер запросов панели администратора на большой базе (в памяти).
// Запуск: node tools/bench-queries.js
const { openDb, migrate } = require('../src/db');
const ApplicationModel = require('../src/models/ApplicationModel');

const USERS = 3000;
const EVENTS = 8;
const RUNS = 200;

const db = openDb(':memory:');
migrate(db);

db.transaction(() => {
  const addEvent = db.prepare("INSERT INTO events (title, starts_at, place, description) VALUES (?, '2026-12-01 10:00', 'Москва', 'Описание')");
  for (let i = 1; i <= EVENTS; i++) addEvent.run('Мероприятие ' + i);
  const addUser = db.prepare('INSERT INTO users (login, password, email, phone) VALUES (?, ?, ?, ?)');
  const addApp = db.prepare('INSERT INTO applications (user_id, event_id, room, payment, status_id) VALUES (?, ?, ?, ?, ?)');
  for (let u = 1; u <= USERS; u++) {
    addUser.run('user' + u, 'x', `user${u}@t.test`, '+79000000000');
    for (let e = 1; e <= EVENTS; e++) if ((u + e) % 4) addApp.run(u, e, 'Малый зал', 'Картой онлайн', 1 + ((u * e) % 3));
  }
})();

const total = db.prepare('SELECT COUNT(*) FROM applications').pluck().get();
console.log(`В базе ${USERS} пользователей, ${EVENTS} мероприятий, ${total} заявок\n`);

const plan = (sql, ...p) => db.prepare('EXPLAIN QUERY PLAN ' + sql).all(...p).map((r) => '  ' + r.detail).join('\n');
const FILTER_STATUS = "SELECT a.id FROM applications a JOIN statuses s ON s.id = a.status_id WHERE s.name = ? ORDER BY a.id DESC";
const FILTER_EVENT = 'SELECT a.id FROM applications a WHERE a.event_id = ? ORDER BY a.id DESC';
console.log('План: фильтр по статусу\n' + plan(FILTER_STATUS, 'новая'));
console.log('План: фильтр по мероприятию\n' + plan(FILTER_EVENT, 3) + '\n');

const model = new ApplicationModel(db);
function time(name, fn) {
  fn(); // прогрев
  const t = process.hrtime.bigint();
  for (let i = 0; i < RUNS; i++) fn();
  const ms = Number(process.hrtime.bigint() - t) / 1e6 / RUNS;
  console.log(`${name}: ${ms.toFixed(2)} мс на запрос`);
}
time('Панель, все заявки сразу       ', () => model.all());
time('Панель, одна страница (20)     ', () => model.all({ limit: 20 }));
time('Панель, подсчёт заявок         ', () => model.count());
time('Панель, статус «назначено»     ', () => model.all({ status: 'назначено', limit: 20 }));
time('Панель, одно мероприятие       ', () => model.all({ eventId: 3, limit: 20 }));
time('Мои заявки одного пользователя ', () => model.byUser(1500));
