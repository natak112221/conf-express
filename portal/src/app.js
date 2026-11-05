const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');

const { migrate } = require('./db');
const format = require('./lib/format');
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

  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(express.urlencoded({ extended: false }));
  app.use(
    session({
      name: 'sid',
      secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
      store: new SqliteStore(db),
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
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).render('error', { code: 500, message: 'Ошибка сервера' });
  });
  return app;
}

module.exports = createApp;
