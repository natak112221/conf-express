const { validateApplication, validateReview } = require('../lib/validate');
const { canReview, isPast } = require('../lib/rules');
const { ROOMS, PAYMENTS } = require('../lib/constants');

class ApplicationController {
  constructor({ events, applications }) {
    this.events = events;
    this.applications = applications;
  }

  // мероприятие уже прошло: заявки не принимаются
  closed(res) {
    return res.status(422).render('error', { code: 422, message: 'Мероприятие уже прошло, заявки не принимаются' });
  }

  form = (req, res) => {
    const event = this.events.find(req.query.event);
    if (!event) return res.status(404).render('error', { code: 404, message: 'Мероприятие не найдено' });
    if (isPast(event)) return this.closed(res);
    res.render('application-form', { event, errors: {}, values: {}, rooms: ROOMS, payments: PAYMENTS });
  };

  create = (req, res) => {
    const event = this.events.find(req.body.event_id);
    if (!event) return res.status(404).render('error', { code: 404, message: 'Мероприятие не найдено' });
    if (isPast(event)) return this.closed(res);
    const errors = validateApplication(req.body);
    if (this.applications.findByUserAndEvent(req.user.id, event.id)) errors.event = 'Вы уже подали заявку на это мероприятие';
    if (Object.keys(errors).length) {
      return res.status(422).render('application-form', { event, errors, values: req.body, rooms: ROOMS, payments: PAYMENTS });
    }
    this.applications.create({ userId: req.user.id, eventId: event.id, room: req.body.room, payment: req.body.payment });
    req.session.flash = 'Заявка отправлена';
    res.redirect('/applications');
  };

  // заявки пользователя с признаком «можно оставить отзыв»
  itemsFor(userId) {
    return this.applications.byUser(userId).map((a) => ({ ...a, can_review: canReview(a) }));
  }

  mine = (req, res) => {
    res.render('my-applications', { items: this.itemsFor(req.user.id), errors: {}, values: {}, openId: null });
  };

  review = (req, res) => {
    const app = this.applications.find(req.params.id);
    // чужие заявки не показываем: для пользователя их как будто нет
    if (!app || app.user_id !== req.user.id) return res.status(404).render('error', { code: 404, message: 'Заявка не найдена' });
    if (!canReview(app)) {
      return res.status(403).render('error', { code: 403, message: 'Отзыв можно оставить только после завершения мероприятия и один раз' });
    }
    const { errors, values } = validateReview(req.body);
    if (Object.keys(errors).length) {
      return res.status(422).render('my-applications', { items: this.itemsFor(req.user.id), errors, values, openId: app.id });
    }
    this.applications.addReview(app.id, values.text, values.rating);
    req.session.flash = 'Спасибо за отзыв';
    res.redirect('/applications');
  };
}

module.exports = ApplicationController;
