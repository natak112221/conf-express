const express = require('express');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const AuthController = require('../controllers/AuthController');
const EventController = require('../controllers/EventController');
const ApplicationController = require('../controllers/ApplicationController');
const AdminController = require('../controllers/AdminController');

function buildRouter(models) {
  const r = express.Router();
  const auth = new AuthController(models);
  const ev = new EventController(models);
  const ap = new ApplicationController(models);
  const ad = new AdminController(models);

  r.get('/', ev.home);
  r.get('/events/:id', ev.show);

  r.get('/register', auth.registerForm);
  r.post('/register', auth.register);
  r.get('/login', auth.loginForm);
  r.post('/login', auth.login);
  r.post('/logout', auth.logout);

  r.get('/applications', requireLogin, ap.mine);
  r.get('/applications/new', requireLogin, ap.form);
  r.post('/applications', requireLogin, ap.create);

  r.get('/admin', requireAdmin, ad.list);
  r.post('/admin/applications/:id/status', requireAdmin, ad.setStatus);
  return r;
}

module.exports = buildRouter;
