export const MIN_PASSWORD_LENGTH = 8;

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function isValidEmail(value) {
  const email = String(value || '');
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isStrongPassword(value) {
  const password = String(value || '');
  if (password.length < MIN_PASSWORD_LENGTH) return false;
  return /[A-Za-z]/.test(password) && /\d/.test(password);
}

export function normalizeDigits(value, maxLength = Infinity) {
  const digits = String(value || '').replace(/\D/g, '');
  return Number.isFinite(maxLength) ? digits.slice(0, maxLength) : digits;
}

export function isValidRa(value) {
  const ra = normalizeDigits(value, 20);
  return ra.length >= 4;
}

export function maxFileSizeValidator(file, maxBytes) {
  if (!file) return false;
  return file.size <= maxBytes;
}
