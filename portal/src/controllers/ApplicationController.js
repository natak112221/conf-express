const { validateApplication } = require('../lib/validate');

class ApplicationController {
  constructor({ events, applications }) {
    this.events = events;
    this.applications = applications;
  }

  form = (req, res) => {
    const event = this.events.find(req.query.event);
    if (!event) return res.status(404).render('error', { code: 404, message: 'Мероприятие не найдено' });
    res.render('application-form', { event, errors: {}, values: {} });
  };

  create = (req, res) => {
    const event = this.events.find(req.body.event_id);
    if (!event) return res.status(404).render('error', { code: 404, message: 'Мероприятие не найдено' });
    const errors = validateApplication(req.body);
    if (this.applications.findByUserAndEvent(req.user.id, event.id)) errors.event = 'Вы уже подали заявку на это мероприятие';
    if (Object.keys(errors).length) return res.status(422).render('application-form', { event, errors, values: req.body });
    this.applications.create({ userId: req.user.id, eventId: event.id, room: req.body.room, payment: req.body.payment });
    req.session.flash = 'Заявка отправлена';
    res.redirect('/applications');
  };

  mine = (req, res) => {
    res.render('my-applications', { items: this.applications.byUser(req.user.id) });
  };
}

module.exports = ApplicationController;
