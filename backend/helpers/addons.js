/**
 * Parse add-on lines like "Mushroom +20 EGP" from menu_items.add_ons text.
 */
function parseAddonsFromDb(addOnsStr) {
  if (!addOnsStr || typeof addOnsStr !== 'string') return [];
  return addOnsStr
    .split(/,|\./)
    .map((str) => str.trim())
    .filter(Boolean)
    .map((str) => {
      const match = str.match(/(.+)\+(\d+)\s*EGP/i);
      return match ? { name: match[1].trim(), price: Number(match[2]) } : null;
    })
    .filter(Boolean);
}

/**
 * Sum prices for selected add-on names; throws if any name is not available on the item.
 */
function sumValidatedAddons(menuItem, selectedNames) {
  if (!selectedNames || !selectedNames.length) return 0;
  const available = parseAddonsFromDb(menuItem.add_ons);
  let sum = 0;
  for (const name of selectedNames) {
    const found = available.find((a) => a.name === name);
    if (!found) {
      const err = new Error(`Invalid add-on for this item: ${name}`);
      err.statusCode = 400;
      throw err;
    }
    sum += found.price;
  }
  return sum;
}

module.exports = { parseAddonsFromDb, sumValidatedAddons };
