const test = require('node:test');
const assert = require('node:assert');
const { validateRegistration, normalizePhone } = require('../src/lib/validate');

const free = { findByLogin: () => null };
const taken = { findByLogin: () => ({ id: 1 }) };
const good = { login: 'natali_n', password: 'Password123', email: 'n@mail.test', phone: '8 900 111-22-33' };

test('телефон приводится к виду +7XXXXXXXXXX', () => {
  assert.strictEqual(normalizePhone('8 (900) 111-22-33'), '+79001112233');
  assert.strictEqual(normalizePhone('+7 900 111 22 33'), '+79001112233');
  assert.strictEqual(normalizePhone('12345'), null);
});

test('верные данные проходят проверку', () => {
  assert.deepStrictEqual(validateRegistration(good, free).errors, {});
});

test('логин: слишком короткий, русские буквы, занятый', () => {
  assert.ok(validateRegistration({ ...good, login: 'na' }, free).errors.login);
  assert.ok(validateRegistration({ ...good, login: 'наталья' }, free).errors.login);
  assert.ok(validateRegistration(good, taken).errors.login);
});

test('пароль короче 8 символов не проходит, ровно 8 проходит', () => {
  assert.ok(validateRegistration({ ...good, password: '1234567' }, free).errors.password);
  assert.strictEqual(validateRegistration({ ...good, password: '12345678' }, free).errors.password, undefined);
});

test('почта без домена и телефон с буквами не проходят', () => {
  assert.ok(validateRegistration({ ...good, email: 'natali.mail' }, free).errors.email);
  assert.ok(validateRegistration({ ...good, phone: '8900abc2233' }, free).errors.phone);
});
