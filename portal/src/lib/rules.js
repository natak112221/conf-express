const { nowString } = require('./clock');

// Мероприятие уже прошло?
function isPast(event) {
  return event.starts_at <= nowString();
}

// Отзыв можно оставить, когда заявка завершена, мероприятие прошло и отзыва ещё нет
function canReview(app) {
  return app.status === 'завершено' && app.starts_at <= nowString() && !app.review_text;
}

module.exports = { isPast, canReview };
