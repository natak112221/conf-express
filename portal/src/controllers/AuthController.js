const { validateRegistration } = require('../lib/validate');

class AuthController {
  constructor({ users }) {
    this.users = users;
  }

  registerForm = (req, res) => {
    res.render('register', { errors: {}, values: {} });
  };

  register = (req, res) => {
    const { errors, values } = validateRegistration(req.body, this.users);
    if (Object.keys(errors).length) return res.status(422).render('register', { errors, values });
    const user = this.users.create({ ...values, password: req.body.password });
    req.session.userId = user.id;
    req.session.flash = 'Вы зарегистрированы';
    res.redirect('/');
  };

  loginForm = (req, res) => {
    res.render('login', { error: null, login: '' });
  };

  login = (req, res) => {
    const login = String(req.body.login || '').trim();
    const user = this.users.findByLogin(login);
    if (!user || user.password !== req.body.password) {
      return res.status(401).render('login', { error: 'Неверный логин или пароль', login });
    }
    req.session.userId = user.id;
    res.redirect(user.role === 'admin' ? '/admin' : '/applications');
  };

  logout = (req, res) => {
    req.session.destroy(() => res.redirect('/'));
  };
}

module.exports = AuthController;
