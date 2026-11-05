// Проверка данных форм. Возвращает объект ошибок по полям (пустой, если всё верно)
const { ROOMS, PAYMENTS } = require('./constants');

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
  return { errors, values: { login, email: String(data.email || '').trim(), phone: phone || String(data.phone || '').trim() } };
}

function validateApplication(data) {
  const errors = {};
  if (!ROOMS.includes(data.room)) errors.room = 'Выберите помещение из списка';
  if (!PAYMENTS.includes(data.payment)) errors.payment = 'Выберите способ оплаты из списка';
  return errors;
}

function validateReview(data) {
  const errors = {};
  const rating = Number(data.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = 'Поставьте оценку от 1 до 5';
  const text = String(data.text || '').trim();
  if (text.length < 5) errors.text = 'Напишите отзыв не короче 5 символов';
  else if (text.length > 1000) errors.text = 'Отзыв не длиннее 1000 символов';
  return { errors, values: { rating, text } };
}

module.exports = { validateRegistration, validateApplication, validateReview, normalizePhone };
