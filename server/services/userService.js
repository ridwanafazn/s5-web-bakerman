const User = require('../models/User');
const env = require('../config/env');
const { BUDGET_PRESETS, budgetForPreset } = require('../utils/sugar');
const { httpError } = require('../utils/httpError');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function roleForEmail(email) {
  const normalized = normalizeEmail(email);
  if (env.adminEmails.includes(normalized)) return 'admin';
  if (env.staffEmails.includes(normalized)) return 'staff';
  return 'member';
}

async function upsertUserFromAuth(auth) {
  const email = normalizeEmail(auth.email);
  if (!email) {
    throw httpError(400, 'Token tidak memiliki email', 'EMAIL_REQUIRED');
  }

  const role = roleForEmail(email);
  let user = await User.findOne({ firebaseUid: auth.uid });

  if (!user) {
    user = await User.findOne({ email });

    if (user) {
      user.firebaseUid = auth.uid;
      user.role = role;
      if (auth.name && !user.name) user.name = auth.name;
      await user.save();
    } else {
      user = await User.create({
        firebaseUid: auth.uid,
        email,
        name: auth.name || '',
        role,
        budgetPreset: 'seimbang',
        weeklyBudgetGrams: BUDGET_PRESETS.seimbang,
        budgetMode: 'guide',
      });
    }
  } else {
    let changed = false;
    if (user.email !== email) {
      user.email = email;
      changed = true;
    }
    if (user.role !== role) {
      user.role = role;
      changed = true;
    }
    if (auth.name && !user.name) {
      user.name = auth.name;
      changed = true;
    }
    if (changed) await user.save();
  }

  return user;
}

function publicUser(user) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    budgetPreset: user.budgetPreset,
    weeklyBudgetGrams: user.weeklyBudgetGrams,
    budgetMode: user.budgetMode,
    stravaConnected: Boolean(user.strava && user.strava.athleteId),
    createdAt: user.createdAt,
  };
}

async function updateProfile(user, payload) {
  if (payload.name !== undefined) {
    const name = String(payload.name).trim();
    if (name.length > 80) {
      throw httpError(400, 'Nama maksimal 80 karakter', 'INVALID_NAME');
    }
    user.name = name;
  }

  if (payload.budgetPreset !== undefined) {
    if (!Object.prototype.hasOwnProperty.call(BUDGET_PRESETS, payload.budgetPreset)) {
      throw httpError(400, 'Preset budget tidak valid', 'INVALID_BUDGET_PRESET');
    }
    user.budgetPreset = payload.budgetPreset;
    user.weeklyBudgetGrams = budgetForPreset(payload.budgetPreset);
  }

  if (payload.budgetMode !== undefined) {
    if (!['guide', 'strict'].includes(payload.budgetMode)) {
      throw httpError(400, 'Mode budget tidak valid', 'INVALID_BUDGET_MODE');
    }
    user.budgetMode = payload.budgetMode;
  }

  await user.save();
  return user;
}

module.exports = {
  normalizeEmail,
  roleForEmail,
  upsertUserFromAuth,
  publicUser,
  updateProfile,
};
