/**
 * Arabic labels for menu seed — keyed by English product name / composite keys.
 * Call createMenuAugment(SANDWICH_ADDONS, STRIPS_ADDONS, MASAHAB_ADDONS) from seed.js.
 */

const SANDWICH_ADDONS_AR =
  'إضافات: مشروم +٢٠ ج، جبنة مقلية +٣٠ ج، فاهيتا +٢٥ ج، هالبينو +١٥ ج، أصابع موتزاريلا (٢) +٢٥ ج، لحم بقري مدخن +١٥ ج، ديك رومي مدخن +١٥ ج، حلقات بصل +٢٠ ج، خبز +١٥ ج، دوريتوس +١٠ ج، ستربس دجاج (١) +٤٠ ج، بايتس دجاج (١) +٣٥ ج، صوص موتزاريلا +٣٠ ج. ترقيات: كول سلو كبير +٢٠ ج، بطاطس كبيرة +٢٥ ج. جانبي: أرز صغير +٢٠ ج، أرز كبير +٣٠ ج، كول سلو صغير +٢٠ ج، كول سلو كبير +٣٥ ج، صوص شيدر صغير +٢٥ ج، صوص شيدر كبير +٤٠ ج، بطاطس صغيرة +٢٥ ج، بطاطس كبيرة +٤٠ ج.';

const STRIPS_ADDONS_AR =
  'اختر أرز أو بطاطس. كومبو: كومبو صغير +٣٠ ج، كومبو كبير مع بيبسي ١ لتر +٨٠ ج.';

const MASAHAB_ADDONS_AR = 'كومبو: أضف كومبو صغير +٣٠ ج، أو كومبو كبير مع بيبسي ١ لتر +٨٠ ج.';

const NAME_AR = {
  'Chicken Pasta': 'باستا دجاج',
  'Turkin Pasta': 'باستا تركين',
  'Chicken Mozzarella': 'باستا دجاج موتزاريلا',
  'Mozzarella Sticks with BBQ Sauce': 'أصابع موتزاريلا مع صوص باربيكيو',
  'Mozzarella Roll': 'رول موتزاريلا',
  'fresco Roll': 'رول فريسكو',
  'Bacon Fries': 'بطاطس بيكون',
  Rizo: 'ريزو',
  'Onion Rings': 'حلقات بصل',
  'Cheesy Fries with Jalapeno': 'بطاطس بالجبنة والهالبينو',
  Rice: 'أرز',
  Coleslaw: 'كول سلو',
  Fries: 'بطاطس',
  'Chicken Fries with Cheddar Sauce': 'بطاطس دجاج بصوص الشيدر',
  'Cheddar Sauce': 'صوص شيدر',
  'Big fresco': 'بيج فريسكو',
  'Fresco Patty': 'فريسكو باتي',
  'Fresco Cheesy': 'فريسكو تشيزي',
  'Massive Fresco': 'ماسيف فريسكو',
  'Fresco Rings': 'فريسكو رينجز',
  'Fresco Mexi': 'فريسكو مكسي',
  'Classic Fresco': 'كلاسيك فريسكو',
  'Fresco Fajita': 'فريسكو فاهيتا',
  'Hero Pizza': 'هيرو بيتزا',
  'Lava Pizza': 'لافا بيتزا',
  'Mix Chesse': 'ميكس تشيز',
  'Chesse Boom': 'تشيز بوم',
  'Chesse Hot Dog': 'تشيز هوت دوغ',
  'Chicken Ranch': 'تشيكن رانش',
  'Strips Meal': 'وجبة ستربس',
  'Kids Meal': 'وجبة أطفال',
  'Masahab Meal': 'وجبة مسحب',
  'Pepsi Can': 'بيبسي علبة',
  'Pepsi Litre': 'بيبسي لتر',
  Juice: 'عصير',
};

const DESC_AR_BY_NAME = {
  'Chicken Pasta': 'بيني، صوص أبيض، صدور دجاج مقرمشة وجبنة موتزاريلا',
  'Turkin Pasta': 'بيني بصوص أبيض، صدر دجاج مقرمش، موتزاريلا، ديك رومي مدخن وبيكون بقري',
  'Chicken Mozzarella': 'صدر دجاج مقرمش وجبنة موتزاريلا',
  'Mozzarella Sticks with BBQ Sauce': 'أصابع موتزاريلا مع صوص باربيكيو',
  'Mozzarella Roll': 'رول موتزاريلا',
  'fresco Roll': 'رول فريسكو',
  'Bacon Fries': 'بطاطس مع بيكون',
  Rizo: 'ريزو',
  'Onion Rings': '٣ حلقات بصل مع صوص باربيكيو',
  'Cheesy Fries with Jalapeno': 'بطاطس بالجبنة والهالبينو',
  Rice: 'أرز',
  Coleslaw: 'كول سلو',
  Fries: 'بطاطس',
  'Chicken Fries with Cheddar Sauce': 'بطاطس دجاج مع صوص الشيدر',
  'Cheddar Sauce': 'صوص شيدر',
  'Big fresco':
    'صدور دجاج مقرمشة، خس، صوص شيدر، مايونيز، باربيكيو، شريحة بيكون بقري وشريحة ديك رومي مدخن',
  'Fresco Patty':
    'صدور دجاج مقرمشة، خس، صوص شيدر، مايونيز، باربيكيو، جبنة مقلية وشريحة بيكون بقري',
  'Fresco Cheesy':
    'صدور دجاج مقرمشة، خس، صوص موتزاريلا، مايونيز، باربيكيو وأصابع موتزاريلا',
  'Massive Fresco':
    'صدور دجاج مقرمشة، خس، صوص شيدر، مايونيز، باربيكيو، بيكون، ديك رومي، صوص مشروم، هالبينو وصوص نار',
  'Fresco Rings':
    'صدور دجاج مقرمشة، خس، صوص شيدر، مايونيز، باربيكيو، بيكون وحلقة بصل',
  'Fresco Mexi': 'صدور دجاج مقرمشة، خس، صوص شيدر، مايونيز، باربيكيو ودوريتوس',
  'Classic Fresco': 'صدور دجاج مقرمشة، خس، صوص شيدر، مايونيز وباربيكيو',
  'Fresco Fajita': 'صدور دجاج مقرمشة، خس، صوص شيدر، مايونيز، باربيكيو وفاهيتا',
  'Hero Pizza':
    'صدور دجاج مقرمشة، خس، صوص شيدر، مايونيز، باربيكيو، بيكون، ديك رومي وبيتزا بالموتزاريلا',
  'Lava Pizza':
    'صدور دجاج مقرمشة، خس، صوص شيدر، مايونيز، باربيكيو، فاهيتا وطبقة بيتزا بالموتزاريلا',
  'Mix Chesse':
    'صدر دجاج مقرمش + خس + صوص شيدر + مايونيز + باربيكيو + طبقة صوص موتزاريلا',
  'Chesse Boom':
    'صدر دجاج مقرمش + خس + صوص شيدر + مايونيز + باربيكيو + باتي محشو جبنة شيدر',
  'Chesse Hot Dog':
    'صدر دجاج مقرمش + خس + صوص شيدر + مايونيز + باربيكيو + قطع هوت دوغ مقلية',
  'Chicken Ranch':
    'صدر دجاج مقرمش + خس + صوص شيدر + مايونيز + باربيكيو + صوص رانش + بطاطس صغيرة وكول سلو صغير',
  'Kids Meal': '٢ ستربس دجاج مع خبز وبطاطس وعصير',
  'Masahab Meal': 'قطع مسحب مع بطاطس وكول سلو وخبز (جميع الوجبات تُقدَّم مع بطاطس وكول سلو وخبز)',
  'Pepsi Can': 'بيبسي علبة',
  'Pepsi Litre': 'بيبسي لتر',
  Juice: 'عصير',
};

const STRIPS_DESC_AR = {
  '3 Pieces':
    '٣ قطع ستربس مع خبز وكول سلو (تُقدَّم مع أرز أو بطاطس وخبز)',
  '5 Pieces':
    '٥ قطع ستربس مع خبز وكول سلو (تُقدَّم مع أرز أو بطاطس وخبز)',
  '8 Pieces':
    '٨ قطع ستربس مع خبز وكول سلو (تُقدَّم مع أرز أو بطاطس وخبز)',
  '12 Pieces':
    '١٢ قطعة ستربس مع خبز وكول سلو (تُقدَّم مع أرز أو بطاطس وخبز)',
};

const SMALL_CHEDDAR_DESC = 'صوص شيدر صغير';
const LARGE_CHEDDAR_DESC = 'صوص شيدر كبير';

function createMenuAugment(SANDWICH_ADDONS, STRIPS_ADDONS, MASAHAB_ADDONS) {
  function augmentMenuItem(item) {
    const name_ar = NAME_AR[item.name] || item.name;
    let description_ar = DESC_AR_BY_NAME[item.name];
    if (item.name === 'Strips Meal' && STRIPS_DESC_AR[item.size]) {
      description_ar = STRIPS_DESC_AR[item.size];
    }
    if (item.name === 'Cheddar Sauce') {
      description_ar = item.description.includes('Small') ? SMALL_CHEDDAR_DESC : LARGE_CHEDDAR_DESC;
    }
    if (item.name === 'Mozzarella Sticks with BBQ Sauce') {
      description_ar = item.size.includes('6')
        ? '٦ أصابع موتزاريلا مع صوص باربيكيو'
        : '٣ أصابع موتزاريلا مع صوص باربيكيو';
    }
    if (!description_ar) description_ar = item.description;

    let add_ons_ar = null;
    if (item.add_ons === SANDWICH_ADDONS) add_ons_ar = SANDWICH_ADDONS_AR;
    else if (item.add_ons === STRIPS_ADDONS) add_ons_ar = STRIPS_ADDONS_AR;
    else if (item.add_ons === MASAHAB_ADDONS) add_ons_ar = MASAHAB_ADDONS_AR;

    return {
      ...item,
      name_ar,
      description_ar,
      add_ons_ar,
    };
  }

  function augmentMenuItems(menuItems) {
    return menuItems.map(augmentMenuItem);
  }

  return { augmentMenuItems };
}

module.exports = { createMenuAugment };
