const test = require('node:test');
const assert = require('node:assert');
const { startApp, Client } = require('./helpers');

let ctx;
test.before(async () => {
  ctx = await startApp();
  ctx.users.create({ login: 'admin', password: 'Admin2026', email: 'a@t.test', phone: '+79000000001', role: 'admin' });
  ctx.users.create({ login: 'ivan_k', password: 'Password123', email: 'i@t.test', phone: '+79161234567' });
});
test.after(() => ctx.close());

test('пароль в базе хранится хешем', () => {
  const p = ctx.db.prepare("SELECT password FROM users WHERE login = 'ivan_k'").pluck().get();
  assert.match(p, /^\$2[aby]\$/);
});

test('заголовок X-Powered-By не отдаётся, есть CSP', async () => {
  const res = await new Client(ctx.base).get('/');
  assert.strictEqual(res.headers.get('x-powered-by'), null);
  assert.ok(res.headers.get('content-security-policy'));
});

test('POST без токена формы отклоняется', async () => {
  const res = await new Client(ctx.base).post('/login', { login: 'ivan_k', password: 'Password123' });
  assert.strictEqual(res.status, 403);
});

test('вход с токеном проходит, cookie с HttpOnly и SameSite', async () => {
  const c = new Client(ctx.base);
  const res = await c.submit('/login', '/login', { login: 'ivan_k', password: 'Password123' });
  assert.strictEqual(res.status, 302);
  const cookie = res.headers.getSetCookie().join('\n');
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
});

test('участник не открывает панель администратора', async () => {
  const c = new Client(ctx.base);
  await c.submit('/login', '/login', { login: 'ivan_k', password: 'Password123' });
  assert.strictEqual((await c.get('/admin')).status, 403);
});

test('SQL-инъекция в логине не даёт войти', async () => {
  const res = await new Client(ctx.base).submit('/login', '/login', { login: "' OR '1'='1' --", password: 'x' });
  assert.strictEqual(res.status, 401);
});

test('после 5 неверных паролей вход закрыт, даже с верным паролем', async () => {
  const c = new Client(ctx.base);
  for (let i = 0; i < 5; i++) await c.submit('/login', '/login', { login: 'admin', password: 'wrong' + i });
  const res = await c.submit('/login', '/login', { login: 'admin', password: 'Admin2026' });
  assert.strictEqual(res.status, 429);
});

test('страницы вошедшего пользователя не кешируются', async () => {
  const c = new Client(ctx.base);
  await c.submit('/login', '/login', { login: 'ivan_k', password: 'Password123' });
  assert.match((await c.get('/cabinet')).headers.get('cache-control'), /no-store/);
});

test('логин не различает регистр: Ivan_K это тот же логин', async () => {
  const res = await new Client(ctx.base).submit('/register', '/register', { login: 'Ivan_K', password: 'Password123', email: 'x@t.test', phone: '+79001234567' });
  assert.strictEqual(res.status, 422);
});

test('слишком большое тело запроса даёт 413, а не 500', async () => {
  const res = await fetch(ctx.base + '/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'login=' + 'a'.repeat(200000) });
  assert.strictEqual(res.status, 413);
});
