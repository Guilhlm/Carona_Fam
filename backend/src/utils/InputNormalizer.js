const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

class InputNormalizer {
  static MIN_PASSWORD_LENGTH = MIN_PASSWORD_LENGTH;

  static normalizeString(rawValue) {
    if (typeof rawValue !== 'string') return rawValue;
    const trimmedValue = rawValue.trim();
    return trimmedValue.length > 0 ? trimmedValue : '';
  }

  static normalizeOptionalString(rawValue) {
    const normalizedValue = InputNormalizer.normalizeString(rawValue);
    return normalizedValue || null;
  }

  static normalizeEmail(rawValue) {
    const normalizedValue = InputNormalizer.normalizeString(rawValue);
    return normalizedValue ? normalizedValue.toLowerCase() : '';
  }

  static normalizeDigits(rawValue, maxLength = Infinity) {
    const onlyDigits = String(rawValue || '').replace(/\D/g, '');
    return Number.isFinite(maxLength) ? onlyDigits.slice(0, maxLength) : onlyDigits;
  }

  static isValidEmail(rawValue) {
    return EMAIL_REGEX.test(String(rawValue || ''));
  }

  static isStrongPassword(rawValue) {
    const passwordValue = String(rawValue || '');
    if (passwordValue.length < MIN_PASSWORD_LENGTH) return false;
    const hasLetter = /[A-Za-z]/.test(passwordValue);
    const hasNumber = /\d/.test(passwordValue);
    return hasLetter && hasNumber;
  }
}

module.exports = InputNormalizer;
