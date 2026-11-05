const test = require('node:test');
const assert = require('node:assert');
const { startApp, Client } = require('./helpers');

let ctx;
let past; // мероприятие в прошлом
let future; // мероприятие в будущем

test.before(async () => {
  process.env.PORTAL_NOW = '2026-11-05 12:00';
  ctx = await startApp();
  ctx.users.create({ login: 'admin', password: 'Admin2026', email: 'a@t.test', phone: '+79000000001', role: 'admin' });
  ctx.users.create({ login: 'ivan_k', password: 'Password123', email: 'i@t.test', phone: '+79161234567' });
  ctx.users.create({ login: 'maria_s', password: 'Password123', email: 'm@t.test', phone: '+79267654321' });
  const add = ctx.db.prepare('INSERT INTO events (title, starts_at, place, description) VALUES (?, ?, ?, ?)');
  past = add.run('Прошедшее', '2026-10-10 10:00', 'Москва', 'Описание').lastInsertRowid;
  future = add.run('Будущее', '2026-12-10 10:00', 'Москва', 'Описание').lastInsertRowid;
});
test.after(() => {
  delete process.env.PORTAL_NOW;
  ctx.close();
});

async function loginAs(login, password = 'Password123') {
  const c = new Client(ctx.base);
  await c.submit('/login', '/login', { login, password });
  return c;
}

const apply = (c, eventId, room = 'Малый зал', payment = 'Картой онлайн') =>
  c.submit(`/applications/new?event=${eventId}`, '/applications', { event_id: eventId, room, payment });

test('заявку можно подать, повторная заявка на то же мероприятие отклоняется', async () => {
  const c = await loginAs('ivan_k');
  assert.strictEqual((await apply(c, future)).status, 302);
  assert.strictEqual((await apply(c, future)).status, 422);
});

test('помещение и оплата принимаются только из списка', async () => {
  const c = await loginAs('maria_s');
  assert.strictEqual((await apply(c, future, 'Подвал', 'Картой онлайн')).status, 422);
  assert.strictEqual((await apply(c, future, 'Малый зал', 'Биткоины')).status, 422);
});

test('отзыв: пока заявка не завершена, отправить нельзя', async () => {
  const c = await loginAs('ivan_k');
  const id = ctx.db.prepare('SELECT id FROM applications WHERE event_id = ?').pluck().get(future);
  const res = await c.submit('/applications', `/applications/${id}/review`, { rating: '5', text: 'Отличная встреча' });
  assert.strictEqual(res.status, 403);
});

test('отзыв: завершённая заявка на прошедшее мероприятие, один раз', async () => {
  const c = await loginAs('maria_s');
  await apply(c, past);
  const id = ctx.db.prepare("SELECT id FROM applications WHERE event_id = ? AND user_id = 3").pluck().get(past);
  ctx.db.prepare("UPDATE applications SET status_id = (SELECT id FROM statuses WHERE name = 'завершено') WHERE id = ?").run(id);
  const bad = await c.submit('/applications', `/applications/${id}/review`, { rating: '7', text: 'коротко' });
  assert.strictEqual(bad.status, 422);
  const ok = await c.submit('/applications', `/applications/${id}/review`, { rating: '5', text: 'Хорошая встреча' });
  assert.strictEqual(ok.status, 302);
  const again = await c.submit('/applications', `/applications/${id}/review`, { rating: '4', text: 'Второй отзыв' });
  assert.strictEqual(again.status, 403);
});

test('чужую заявку оценить нельзя', async () => {
  const c = await loginAs('ivan_k');
  const id = ctx.db.prepare('SELECT id FROM applications WHERE user_id = 3 LIMIT 1').pluck().get();
  const res = await c.submit('/applications', `/applications/${id}/review`, { rating: '5', text: 'Чужой отзыв' });
  assert.strictEqual(res.status, 404);
});

test('панель администратора: фильтр по статусу и по мероприятию', async () => {
  const c = await loginAs('admin', 'Admin2026');
  const all = await (await c.get('/admin')).text();
  const done = await (await c.get('/admin?status=' + encodeURIComponent('завершено'))).text();
  const byEvent = await (await c.get('/admin?event=' + future)).text();
  const count = (html) => Number(/Найдено заявок: <b>(\d+)<\/b>/.exec(html)[1]);
  assert.strictEqual(count(all), 2);
  assert.strictEqual(count(done), 1);
  assert.strictEqual(count(byEvent), 1);
});
