const { STATUSES } = require('../lib/constants');

const PAGE_SIZE = 20;

class AdminController {
  constructor({ applications, events }) {
    this.applications = applications;
    this.events = events;
  }

  list = (req, res) => {
    const status = STATUSES.includes(req.query.status) ? req.query.status : '';
    const eventId = Number(req.query.event) || '';
    const total = this.applications.count({ status, eventId });
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(Math.max(1, Number(req.query.page) || 1), pages);
    const items = this.applications.all({ status, eventId, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
    const query = { ...(status && { status }), ...(eventId && { event: eventId }) };
    res.render('admin', { items, total, page, pages, statuses: STATUSES, events: this.events.titles(), filter: { status, eventId }, query });
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
