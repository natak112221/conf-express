const path = require('path');
const express = require('express');
const session = require('express-session');

const { migrate } = require('./db');
const format = require('./lib/format');
const { loadUser } = require('./middleware/auth');
const buildRouter = require('./routes');
const UserModel = require('./models/UserModel');
const EventModel = require('./models/EventModel');
const ApplicationModel = require('./models/ApplicationModel');

function createApp(db) {
  migrate(db);
  const models = { users: new UserModel(db), events: new EventModel(db), applications: new ApplicationModel(db) };

  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));
  app.locals.fmt = format;

  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(express.urlencoded({ extended: false }));
  app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
  app.use(loadUser(models.users));
  app.use(buildRouter(models));

  app.use((req, res) => res.status(404).render('error', { code: 404, message: 'Страница не найдена' }));
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).render('error', { code: 500, message: 'Ошибка сервера' });
  });
  return app;
}

module.exports = createApp;
