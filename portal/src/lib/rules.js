const { nowString } = require('./clock');

// Мероприятие уже прошло?
function isPast(event) {
  return event.starts_at <= nowString();
}

// Отзыв можно оставить, когда заявка завершена, мероприятие прошло и отзыва ещё нет
function canReview(app) {
  return app.status === 'завершено' && app.starts_at <= nowString() && !app.review_text;
}

const ORDER = ['новая', 'назначено', 'завершено'];

// Статусы, которые можно выбрать для заявки: текущий и следующий по порядку.
// Завершить заявку можно только когда мероприятие прошло.
function allowedStatuses(app) {
  const i = ORDER.indexOf(app.status);
  const next = ORDER[i + 1];
  const list = [app.status];
  if (next && (next !== 'завершено' || app.starts_at <= nowString())) list.push(next);
  return list;
}

module.exports = { isPast, canReview, allowedStatuses };
