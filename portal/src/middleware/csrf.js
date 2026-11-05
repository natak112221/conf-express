// Защита от подделки запросов: токен лежит в сессии и в скрытом поле каждой формы
const crypto = require('crypto');

function sameToken(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function csrf(req, res, next) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  res.locals.csrfToken = req.session.csrf;
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (!req.body || !sameToken(req.body._csrf || '', req.session.csrf)) {
    return res.status(403).render('error', { code: 403, message: 'Форма устарела или подделана. Откройте страницу заново.' });
  }
  next();
}

module.exports = csrf;
