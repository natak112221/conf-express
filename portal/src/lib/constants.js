const STATUSES = ['новая', 'назначено', 'завершено'];
const ROOMS = ['Большой зал', 'Малый зал', 'Переговорная'];
const PAYMENTS = ['Картой онлайн', 'Наличными на входе', 'Счёт для организации'];

const STATUS_CLASS = { 'новая': 'new', 'назначено': 'assigned', 'завершено': 'done' };

module.exports = { STATUSES, ROOMS, PAYMENTS, STATUS_CLASS };
