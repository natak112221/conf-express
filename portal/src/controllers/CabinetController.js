// Личный кабинет: данные пользователя и сводка по заявкам
class CabinetController {
  constructor({ applications }) {
    this.applications = applications;
  }

  show = (req, res) => {
    const items = this.applications.byUser(req.user.id);
    const stats = {
      total: items.length,
      done: items.filter((a) => a.status === 'завершено').length,
      reviews: items.filter((a) => a.review_text).length,
    };
    res.render('cabinet', { stats, last: items[0] || null });
  };
}

module.exports = CabinetController;
