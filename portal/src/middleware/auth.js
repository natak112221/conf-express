// Подставляет текущего пользователя и ограничивает доступ по ролям
function loadUser(users) {
  return (req, res, next) => {
    const id = req.session.userId;
    req.user = id ? users.findById(id) : null;
    res.locals.user = req.user;
    res.locals.flash = req.session.flash || null;
    delete req.session.flash;
    next();
  };
}

function requireLogin(req, res, next) {
  if (!req.user) {
    req.session.flash = 'Сначала войдите в аккаунт';
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.redirect('/login');
  if (req.user.role !== 'admin') return res.status(403).render('error', { code: 403, message: 'Доступ только для администратора' });
  next();
}

module.exports = { loadUser, requireLogin, requireAdmin };
