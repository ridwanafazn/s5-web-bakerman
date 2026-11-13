// Asia/Jakarta is UTC+7 all year (no daylight saving).
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfWeekJakarta(date = new Date()) {
  const local = new Date(date.getTime() + JAKARTA_OFFSET_MS);
  const dayOfWeek = local.getUTCDay(); // 0 = Sunday
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const startUtcMs =
    Date.UTC(
      local.getUTCFullYear(),
      local.getUTCMonth(),
      local.getUTCDate() - daysSinceMonday
    ) - JAKARTA_OFFSET_MS;

  return new Date(startUtcMs);
}

function endOfWeekJakarta(weekStart) {
  return new Date(weekStart.getTime() + 7 * DAY_MS - 1);
}

function isoDateJakarta(date = new Date()) {
  const local = new Date(date.getTime() + JAKARTA_OFFSET_MS);
  return local.toISOString().slice(0, 10);
}

function addDaysIso(isoDate, days) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const base = Date.UTC(year, month - 1, day);
  return new Date(base + days * DAY_MS).toISOString().slice(0, 10);
}

function nextWeekStartJakarta(date = new Date()) {
  return new Date(startOfWeekJakarta(date).getTime() + 7 * DAY_MS);
}

module.exports = {
  JAKARTA_OFFSET_MS,
  DAY_MS,
  startOfWeekJakarta,
  endOfWeekJakarta,
  isoDateJakarta,
  addDaysIso,
  nextWeekStartJakarta,
};
