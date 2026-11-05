const { isPast } = require('../lib/rules');

class EventController {
  constructor({ events, applications }) {
    this.events = events;
    this.applications = applications;
  }

  home = (req, res) => {
    const all = this.events.all();
    res.render('home', { upcoming: all.filter((e) => !isPast(e)), past: all.filter(isPast).reverse() });
  };

  show = (req, res) => {
    const event = this.events.find(req.params.id);
    if (!event) return res.status(404).render('error', { code: 404, message: 'Мероприятие не найдено' });
    const mine = req.user ? this.applications.findByUserAndEvent(req.user.id, event.id) : null;
    res.render('event', { event, mine, past: isPast(event) });
  };
}

module.exports = EventController;
