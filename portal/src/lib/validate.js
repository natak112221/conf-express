// Проверка данных форм. Возвращает объект ошибок по полям (пустой, если всё верно)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// телефон приводим к виду +7XXXXXXXXXX
function normalizePhone(raw) {
  const s = String(raw || '').replace(/[\s()-]/g, '');
  if (/^8\d{10}$/.test(s)) return '+7' + s.slice(1);
  if (/^\+7\d{10}$/.test(s)) return s;
  return null;
}

function validateRegistration(data, users) {
  const errors = {};
  const login = String(data.login || '').trim();
  if (!/^[A-Za-z0-9_]{3,20}$/.test(login)) errors.login = 'Логин: 3-20 символов, латиница, цифры и _';
  else if (users.findByLogin(login)) errors.login = 'Такой логин уже занят';

  if (String(data.password || '').length < 8) errors.password = 'Пароль должен быть не короче 8 символов';
  if (!EMAIL_RE.test(String(data.email || '').trim())) errors.email = 'Введите почту в формате name@site.ru';
  const phone = normalizePhone(data.phone);
  if (!phone) errors.phone = 'Телефон в формате +7 900 123-45-67 или 8 900 123-45-67';
  return { errors, values: { login, email: String(data.email || '').trim(), phone } };
}

function validateApplication(data) {
  const errors = {};
  if (!data.room || !String(data.room).trim()) errors.room = 'Укажите помещение';
  if (!data.payment || !String(data.payment).trim()) errors.payment = 'Укажите способ оплаты';
  return errors;
}

module.exports = { validateRegistration, validateApplication, normalizePhone };
