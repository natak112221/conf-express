const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');

const { migrate } = require('./db');
const format = require('./lib/format');
const { STATUS_CLASS } = require('./lib/constants');
const { isPast } = require('./lib/rules');
const { loadUser } = require('./middleware/auth');
const csrf = require('./middleware/csrf');
const SqliteStore = require('./lib/sqliteStore');
const buildRouter = require('./routes');
const UserModel = require('./models/UserModel');
const EventModel = require('./models/EventModel');
const ApplicationModel = require('./models/ApplicationModel');
const LoginAttemptModel = require('./models/LoginAttemptModel');

function createApp(db) {
  migrate(db);
  const models = { users: new UserModel(db), events: new EventModel(db), applications: new ApplicationModel(db), attempts: new LoginAttemptModel(db) };

  const app = express();
  // заголовки безопасности (CSP, nosniff и другие), заголовок X-Powered-By убирается
  app.use(helmet({ contentSecurityPolicy: { directives: { 'upgrade-insecure-requests': null } } }));
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));
  app.locals.fmt = format;
  app.locals.statusClass = STATUS_CLASS;
  app.locals.isPast = isPast;

  app.use(compression()); // сжатие ответов gzip
  // картинки и шрифты не меняются: браузер хранит их неделю
  app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: '7d' }));
  app.use(express.urlencoded({ extended: false }));
  const store = new SqliteStore(db);
  app.locals.sessionStore = store;
  app.use(
    session({
      name: 'sid',
      secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
      store,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true, // скрипты на странице не видят cookie
        sameSite: 'lax', // cookie не уходит с чужих сайтов при POST
        secure: process.env.COOKIE_SECURE === '1', // на https включить
        maxAge: 2 * 60 * 60 * 1000,
      },
    })
  );
  app.use(loadUser(models.users));
  app.use(csrf);
  app.use(buildRouter(models));

  app.use((req, res) => res.status(404).render('error', { code: 404, message: 'Страница не найдена' }));
  app.use((err, req, res, _next) => {
    // ошибки клиента (слишком большое тело, неверный запрос) показываем со своим кодом, а не как 500
    const code = err.status >= 400 && err.status < 500 ? err.status : 500;
    if (code === 500) console.error(err);
    const messages = { 400: 'Некорректный запрос', 413: 'Слишком большой запрос' };
    res.status(code).render('error', { code, message: messages[code] || (code === 500 ? 'Ошибка сервера' : 'Запрос не выполнен') });
  });
  return app;
}

module.exports = createApp;
