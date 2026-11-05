class EventController {
  constructor({ events, applications }) {
    this.events = events;
    this.applications = applications;
  }

  home = (req, res) => {
    res.render('home', { events: this.events.all() });
  };

  show = (req, res) => {
    const event = this.events.find(req.params.id);
    if (!event) return res.status(404).render('error', { code: 404, message: 'Мероприятие не найдено' });
    const mine = req.user ? this.applications.findByUserAndEvent(req.user.id, event.id) : null;
    res.render('event', { event, mine });
  };
}

module.exports = EventController;
