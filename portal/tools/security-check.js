// Проверка подсистемы безопасности на запущенном портале.
// Запуск: node tools/security-check.js [адрес] [файл базы]
const path = require('path');
const Database = require('better-sqlite3');

const BASE = process.argv[2] || 'http://127.0.0.1:8102';
const DB_FILE = process.argv[3] || path.join(__dirname, '..', 'data', 'portal.sqlite');

let failed = 0;
function check(ok, text) {
  console.log((ok ? 'OK   ' : 'НЕТ  ') + text);
  if (!ok) failed++;
}

async function post(url, body, cookie = '') {
  return fetch(BASE + url, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookie },
    body: new URLSearchParams(body),
  });
}

const cookieOf = (res) => res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');

// достаёт скрытое поле _csrf со страницы, если оно есть
async function csrfFrom(url, cookie) {
  const res = await fetch(BASE + url, { headers: { Cookie: cookie } });
  const html = await res.text();
  const m = /name="_csrf" value="([^"]+)"/.exec(html);
  return { token: m ? m[1] : '', cookie: cookie || cookieOf(res) };
}

async function login(user, pass) {
  const page = await csrfFrom('/login', '');
  const res = await post('/login', { login: user, password: pass, _csrf: page.token }, page.cookie);
  return { res, cookie: cookieOf(res) || page.cookie, page };
}

async function main() {
  // 1. пароли в базе
  const db = new Database(DB_FILE, { readonly: true });
  const pass = db.prepare("SELECT password FROM users WHERE login = 'ivan_k'").pluck().get();
  check(/^\$2[aby]\$/.test(pass), 'пароль в базе хранится хешем bcrypt');
  db.close();

  // 2. заголовки
  const home = await fetch(BASE + '/');
  check(!home.headers.get('x-powered-by'), 'заголовка X-Powered-By нет');
  check(!!home.headers.get('content-security-policy'), 'есть Content-Security-Policy');
  check(home.headers.get('x-content-type-options') === 'nosniff', 'есть X-Content-Type-Options: nosniff');

  // 3. cookie сессии
  const admin = await login('admin', 'Admin2026');
  const setCookie = admin.res.headers.getSetCookie().join('\n');
  check(/httponly/i.test(setCookie), 'cookie сессии с флагом HttpOnly');
  check(/samesite=(lax|strict)/i.test(setCookie), 'cookie сессии с флагом SameSite');
  check(admin.res.status === 302, 'вход администратора проходит (код 302)');

  // 4. подделка запроса: смена статуса без токена
  const noToken = await post('/admin/applications/2/status', { status: 'назначено' }, admin.cookie);
  check(noToken.status === 403, `смена статуса без токена отклоняется (код ${noToken.status})`);

  // 5. SQL-инъекция
  const inj = await login("' OR '1'='1' --", 'x');
  check(inj.res.status !== 302, `инъекция в логине не пускает (код ${inj.res.status})`);

  // 6. права участника
  const user = await login('ivan_k', 'Password123');
  const adm = await fetch(BASE + '/admin', { headers: { Cookie: user.cookie }, redirect: 'manual' });
  check(adm.status === 403, `участник не открывает /admin (код ${adm.status})`);
  const guest = await fetch(BASE + '/applications', { redirect: 'manual' });
  check(guest.status === 302, `гость с /applications уходит на вход (код ${guest.status})`);

  // 7. блокировка перебора пароля
  let last = 0;
  for (let i = 0; i < 7; i++) last = (await login('maria_s', 'неверный-пароль')).res.status;
  check(last === 429, `после нескольких неверных паролей вход блокируется (код ${last})`);

  console.log(failed ? `\nНе прошло проверок: ${failed}` : '\nВсе проверки прошли');
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
