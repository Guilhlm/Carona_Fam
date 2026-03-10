export function formatDate(value, options = {}) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const { withTime = true, locale = 'pt-BR' } = options;

  if (withTime) {
    return date.toLocaleString(locale);
  }

  return date.toLocaleDateString(locale);
}

export function formatDateTime(value, locale = 'pt-BR') {
  return formatDate(value, { withTime: true, locale });
}