const assert = require('assert');
const { getComboById } = require('../constants/sandwichCombos');
const { sumValidatedAddons } = require('../helpers/addons');

const fakeMenu = {
  add_ons: 'Mushroom +20 EGP, Fries +25 EGP',
};

assert.strictEqual(getComboById('pepsi').priceAdd, 20);
assert.strictEqual(getComboById('cheese_combo').priceAdd, 40);
assert.strictEqual(sumValidatedAddons(fakeMenu, ['Mushroom']), 20);
assert.strictEqual(sumValidatedAddons(fakeMenu, ['Mushroom', 'Fries']), 45);

console.log('✅ backend sanity checks passed');
