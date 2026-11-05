// Текущее время в виде 'YYYY-MM-DD HH:MM' (как хранятся даты мероприятий).
// Для проверок можно зафиксировать время: PORTAL_NOW="2026-11-05 12:00"
function nowString() {
  if (process.env.PORTAL_NOW) return process.env.PORTAL_NOW;
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

module.exports = { nowString };
