const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEKLY_CHANCES = 3;

// Reset kesempatan user setiap 7 hari sejak reset terakhir.
async function refreshWeeklyChances(user) {
  if (!user) return user;

  const lastReset = user.chancesResetAt || user.createdAt || new Date(0);
  if (Date.now() - new Date(lastReset).getTime() >= WEEK_MS) {
    user.chances = WEEKLY_CHANCES;
    user.chancesResetAt = new Date();
    await user.save();
  }

  return user;
}

module.exports = { refreshWeeklyChances, WEEKLY_CHANCES };
