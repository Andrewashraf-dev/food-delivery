/** Group flat menu API rows by product name (same as Menu.jsx). */
export function groupMenuItemsByName(items) {
  if (!items?.length) return [];
  const groupKey = (item) => {
    if (item.name && typeof item.name === 'object' && item.name.en) return item.name.en;
    if (typeof item.name === 'string') return item.name;
    return `id-${item.id}`;
  };

  const grouped = items.reduce((acc, item) => {
    const key = groupKey(item);
    if (!acc[key]) {
      acc[key] = {
        ...item,
        all_variants: [],
      };
    }
    acc[key].all_variants.push({
      id: item.id,
      size: item.size,
      price: item.price,
      add_ons: item.add_ons,
    });
    return acc;
  }, {});

  return Object.values(grouped);
}

/** Find the grouped card object that contains the given menu_item id. */
export function findGroupedItemByMenuId(menuItems, menuItemId) {
  const id = Number(menuItemId);
  const grouped = groupMenuItemsByName(menuItems);
  return grouped.find((g) => g.all_variants?.some((v) => Number(v.id) === id)) || null;
}
