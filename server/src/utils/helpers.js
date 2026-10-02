function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

function parseSkills(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((s) => String(s).trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function pagination(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 12));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

module.exports = { sanitizeUser, parseSkills, pagination };
