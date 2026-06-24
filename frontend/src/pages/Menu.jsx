import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import api from '../hooks/useApi';
import MenuCard from '../components/MenuCard';
import { getLocalized } from '../utils/localized';

const ICONS = {
  All: '🍽️',
  Pasta: '🍝',
  Appetizers: '🍟',
  Sandwiches: '🍔',
  Meals: '🍗',
  Drinks: '🥤',
  default: '✨',
};

export default function Menu() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';

  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const activeCategory = searchParams.get('category') || 'All';

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get('/menu')
      .then((res) => {
        const data = res.data.data || [];
        if (import.meta.env.DEV && data[0]) {
          console.debug('[i18n] Menu page', { lang, localized: data[0].name?.[lang] ?? data[0].name });
        }
        setItems(data);
      })
      .catch((err) => setError(err.response?.data?.message || t('menu.loadError')))
      .finally(() => setLoading(false));
  }, [lang, t]);

  const setCategory = (cat) => {
    if (cat === 'All') {
      setSearchParams({}); 
    } else {
      setSearchParams({ category: cat });
    }
  };

  // 1. Get Categories for Tabs (Memoized for performance)
  const dynamicCategories = useMemo(() => {
    return ['All', ...new Set(items.map(item => item.category))];
  }, [items]);

  // 2. 🔥 THE BRAIN: Filter and Group items
  // This combines Single/Double/Triple variants into one card object
  const finalItems = useMemo(() => {
    // First, filter by Category and Search text
    const filteredRaw = items.filter((item) => {
      const matchesCat = activeCategory === 'All' || item.category === activeCategory;
      const label = getLocalized(item.name, lang).toLowerCase();
      const matchesSearch = !search || label.includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });

    const groupKey = (item) => item.name?.en ?? `id-${item.id}`;

    const grouped = filteredRaw.reduce((acc, item) => {
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
  }, [items, activeCategory, search, lang]);

  if (error)
    return (
      <div className="min-h-screen pt-28 flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="font-display text-3xl font-black text-white mb-3">{t('menu.loadError')}</h2>
        <p className="text-white/50 max-w-md mb-6">{error}</p>
        <button type="button" onClick={() => window.location.reload()} className="btn-primary">
          {t('common.tryAgain')}
        </button>
      </div>
    );

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Header Section */}
      <div className="relative py-16 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-red/10 to-transparent" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <p className="section-subtitle mb-3">fresco</p>
          <h1 className="section-title text-5xl md:text-6xl mb-4">{t('menu.title')}</h1>
          <p className="text-white/50 max-w-md mx-auto">{t('menu.subtitle')}</p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder={t('menu.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field max-w-md mx-auto block"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 mb-10 justify-start md:justify-center">
          {dynamicCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                activeCategory === cat
                  ? 'bg-brand-red text-white shadow-lg shadow-brand-red/30 scale-105'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <span>{ICONS[cat] || ICONS.default}</span> {t(`categories.${cat}`, cat)}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <div key={i} className="card h-72 animate-pulse bg-white/5" />)}
          </div>
        ) : finalItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-white/60 text-xl font-display uppercase tracking-widest">{t('menu.noItems')}</p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategory('All');
              }}
              className="mt-4 text-brand-gold text-sm hover:underline"
            >
              {t('menu.clearFilters')}
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {finalItems.map((item, i) => (
                <MenuCard key={item.name?.en ?? item.id} item={item} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}