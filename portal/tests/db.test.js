const test = require('node:test');
const assert = require('node:assert');
const { startApp } = require('./helpers');

test('база не даёт создать двух пользователей с одним логином (код SQLITE_CONSTRAINT_UNIQUE)', async () => {
  const ctx = await startApp();
  const u = { login: 'ivan_k', password: 'Password123', email: 'i@t.test', phone: '+79161234567' };
  ctx.users.create(u);
  assert.throws(() => ctx.users.create(u), (e) => e.code === 'SQLITE_CONSTRAINT_UNIQUE');
  ctx.close();
});

test('база не даёт создать заявку на несуществующее мероприятие (внешний ключ)', async () => {
  const ctx = await startApp();
  const user = ctx.users.create({ login: 'ivan_k', password: 'Password123', email: 'i@t.test', phone: '+79161234567' });
  const add = () => ctx.db.prepare('INSERT INTO applications (user_id, event_id, room, payment) VALUES (?, 999, ?, ?)').run(user.id, 'Hall', 'Card');
  assert.throws(add, (e) => e.code === 'SQLITE_CONSTRAINT_FOREIGNKEY');
  ctx.close();
});
