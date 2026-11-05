// Форматирование дат для шаблонов
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

// '2026-11-19 10:00' -> '19 ноября 2026, 10:00'
function fmtDateTime(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}:\d{2}))?/.exec(s || '');
  if (!m) return s || '';
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` + (m[4] ? `, ${m[4]}` : '');
}

function fmtDate(s) {
  return fmtDateTime(s).split(',')[0];
}

module.exports = { fmtDateTime, fmtDate };
