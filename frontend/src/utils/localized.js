/** @param {{ en?: string, ar?: string } | string | null | undefined} field */
export function getLocalized(field, lang) {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  const l = lang === 'ar' ? 'ar' : 'en';
  const v = field[l] ?? field.en ?? field.ar ?? '';
  return v === null || v === undefined ? '' : String(v);
}

/** Add-ons from API: { en, ar } or legacy string */
export function getAddOnsText(addOns, lang) {
  if (!addOns) return null;
  if (typeof addOns === 'string') return addOns;
  return getLocalized(addOns, lang);
}
