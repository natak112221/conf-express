const { STATUSES } = require('../lib/constants');

class AdminController {
  constructor({ applications }) {
    this.applications = applications;
  }

  list = (req, res) => {
    res.render('admin', { items: this.applications.all(), statuses: STATUSES });
  };

  setStatus = (req, res) => {
    const app = this.applications.find(req.params.id);
    if (!app) return res.status(404).render('error', { code: 404, message: 'Заявка не найдена' });
    if (!STATUSES.includes(req.body.status)) return res.status(400).render('error', { code: 400, message: 'Неизвестный статус' });
    this.applications.setStatus(app.id, req.body.status);
    req.session.flash = `Заявка №${app.id}: статус «${req.body.status}»`;
    res.redirect('/admin');
  };
}

module.exports = AdminController;
