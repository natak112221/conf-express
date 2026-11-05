// Помощники для тестов: приложение на базе в памяти и маленький клиент с cookie
process.env.BCRYPT_ROUNDS = '4';
const { openDb } = require('../src/db');
const createApp = require('../src/app');
const UserModel = require('../src/models/UserModel');

async function startApp() {
  const db = openDb(':memory:');
  const app = createApp(db);
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const users = new UserModel(db);
  return { db, base, users, close: () => server.close() };
}

class Client {
  constructor(base) {
    this.base = base;
    this.cookies = {};
  }

  save(res) {
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(';');
      const i = pair.indexOf('=');
      this.cookies[pair.slice(0, i)] = pair.slice(i + 1);
    }
  }

  get cookie() {
    return Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join('; ');
  }

  async get(url) {
    const res = await fetch(this.base + url, { redirect: 'manual', headers: { Cookie: this.cookie } });
    this.save(res);
    return res;
  }

  async post(url, data) {
    const res = await fetch(this.base + url, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: this.cookie },
      body: new URLSearchParams(data),
    });
    this.save(res);
    return res;
  }

  // берёт токен формы со страницы и отправляет форму вместе с ним
  async submit(pageUrl, postUrl, data) {
    const html = await (await this.get(pageUrl)).text();
    const token = (/name="_csrf" value="([^"]+)"/.exec(html) || [])[1] || '';
    return this.post(postUrl, { ...data, _csrf: token });
  }
}

module.exports = { startApp, Client };
