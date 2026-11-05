const bcrypt = require('bcryptjs');
const { validateRegistration } = require('../lib/validate');

// проверка пароля у несуществующего логина занимает столько же времени, сколько у настоящего
const DUMMY_HASH = bcrypt.hashSync('dummy', Number(process.env.BCRYPT_ROUNDS) || 10);

class AuthController {
  constructor({ users, attempts }) {
    this.users = users;
    this.attempts = attempts;
  }

  // после входа и регистрации выдаём новый идентификатор сессии
  startSession(req, user, next) {
    const csrf = req.session.csrf;
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.userId = user.id;
      req.session.csrf = csrf;
      next();
    });
  }

  registerForm = (req, res) => {
    res.render('register', { errors: {}, values: {} });
  };

  register = (req, res, next) => {
    const { errors, values } = validateRegistration(req.body, this.users);
    if (Object.keys(errors).length) return res.status(422).render('register', { errors, values });
    let user;
    try {
      user = this.users.create({ ...values, password: req.body.password });
    } catch (e) {
      // логин заняли между проверкой и записью: база не даст создать дубль
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(422).render('register', { errors: { login: 'Такой логин уже занят' }, values });
      }
      return next(e);
    }
    this.startSession(req, user, (err) => {
      if (err) return next(err);
      req.session.flash = 'Вы зарегистрированы';
      res.redirect('/');
    });
  };

  loginForm = (req, res) => {
    res.render('login', { error: null, login: '' });
  };

  login = (req, res, next) => {
    const login = String(req.body.login || '').trim();
    if (this.attempts.isBlocked(login)) {
      return res.status(429).render('login', { error: 'Слишком много неверных попыток. Подождите 10 минут.', login });
    }
    const user = this.users.findByLogin(login);
    const ok = user ? this.users.checkPassword(user, req.body.password) : (bcrypt.compareSync('x', DUMMY_HASH), false);
    if (!ok) {
      this.attempts.fail(login, req.ip);
      return res.status(401).render('login', { error: 'Неверный логин или пароль', login });
    }
    this.attempts.clear(login);
    this.startSession(req, user, (err) => {
      if (err) return next(err);
      res.redirect(user.role === 'admin' ? '/admin' : '/applications');
    });
  };

  logout = (req, res) => {
    req.session.destroy(() => {
      res.clearCookie('sid');
      res.redirect('/');
    });
  };
}

module.exports = AuthController;
