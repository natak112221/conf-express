const { STATUSES } = require('../lib/constants');

class AdminController {
  constructor({ applications, events }) {
    this.applications = applications;
    this.events = events;
  }

  list = (req, res) => {
    const status = STATUSES.includes(req.query.status) ? req.query.status : '';
    const eventId = Number(req.query.event) || '';
    const items = this.applications.all({ status, eventId });
    res.render('admin', { items, statuses: STATUSES, events: this.events.titles(), filter: { status, eventId }, query: { ...(status && { status }), ...(eventId && { event: eventId }) } });
  };

  setStatus = (req, res) => {
    const app = this.applications.find(req.params.id);
    if (!app) return res.status(404).render('error', { code: 404, message: 'Заявка не найдена' });
    if (!STATUSES.includes(req.body.status)) return res.status(400).render('error', { code: 400, message: 'Неизвестный статус' });
    this.applications.setStatus(app.id, req.body.status);
    req.session.flash = `Заявка №${app.id}: статус «${req.body.status}»`;
    // после смены статуса возвращаемся к тому же фильтру, но только внутри панели
    const back = String(req.body.back || '');
    res.redirect(back.startsWith('/admin') ? back : '/admin');
  };
}

module.exports = AdminController;
