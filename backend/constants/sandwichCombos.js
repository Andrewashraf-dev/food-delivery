/**
 * Sandwich combo add-ons (server-validated). Client sends comboId; price applied only for Sandwiches.
 */
const SANDWICH_COMBOS = [
  { id: 'pepsi', priceAdd: 20, labelEn: 'Pepsi', labelAr: 'بيبسي' },
  { id: 'cheese_combo', priceAdd: 40, labelEn: 'Cheese Combo (Pepsi + Cheese)', labelAr: 'تشيز كومبو (بيبسي + جبن)' },
  { id: 'regular_combo', priceAdd: 40, labelEn: 'Regular Combo (Fries + Pepsi)', labelAr: 'ريجولار كومبو (بطاطس + بيبسي)' },
];

function getComboById(id) {
  if (!id) return null;
  return SANDWICH_COMBOS.find((c) => c.id === id) || null;
}

module.exports = { SANDWICH_COMBOS, getComboById };
