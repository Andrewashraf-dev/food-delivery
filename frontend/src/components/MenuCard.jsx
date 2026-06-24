import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

import api from '../hooks/useApi';
import { useCart } from '../context/CartContext';
import { getLocalized, getAddOnsText } from '../utils/localized';
import { findGroupedItemByMenuId } from '../utils/menuGroup';

const FALLBACK_IMAGES = {
  Pasta: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80',
  Appetizers: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&q=80',
  Sandwiches: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  Meals: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80',
  Drinks: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&q=80',
};

const COMBO_DEF = [
  { id: 'pepsi', price: 20 },
  { id: 'cheese_combo', price: 40 },
  { id: 'regular_combo', price: 40 },
];

function itemImageSrc(menuItem) {
  const im = menuItem?.image;
  if (im && im.includes('fresco/')) return `/${im}`;
  return im || FALLBACK_IMAGES[menuItem?.category] || FALLBACK_IMAGES.Sandwiches;
}

export default function MenuCard({ item, index = 0 }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const { addToCart } = useCart();

  const menuCacheRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  const [added, setAdded] = useState(false);
  const [isSpicy, setIsSpicy] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [comboId, setComboId] = useState('');
  const [itemNote, setItemNote] = useState('');
  const [related, setRelated] = useState([]);

  const effectiveItem = modalItem || item;

  const gridVariants = item.all_variants || [{ id: item.id, size: item.size, price: item.price, add_ons: item.add_ons }];
  const variants = effectiveItem.all_variants || [
    { id: effectiveItem.id, size: effectiveItem.size, price: effectiveItem.price, add_ons: effectiveItem.add_ons },
  ];

  const [selectedVariant, setSelectedVariant] = useState(variants[0]);

  const effectiveKey = `${effectiveItem?.name?.en ?? effectiveItem?.id}-${(effectiveItem.all_variants || [])
    .map((v) => v.id)
    .join(',')}`;

  useEffect(() => {
    const v = variants[0];
    if (v) setSelectedVariant(v);
    setComboId('');
    setSelectedAddons([]);
    setItemNote('');
    setIsSpicy(false);
  }, [effectiveKey]);

  const itemGridKey = item?.name?.en ?? item?.id;
  useEffect(() => {
    setModalItem(null);
  }, [itemGridKey]);

  const itemTitle = getLocalized(effectiveItem.name, lang);
  const itemDesc = getLocalized(effectiveItem.description, lang);

  const availableAddons = useMemo(() => {
    const raw = getAddOnsText(selectedVariant?.add_ons ?? effectiveItem.add_ons, lang);
    if (!raw) return [];
    return raw
      .split(/,|\./)
      .map((str) => str.trim())
      .filter(Boolean)
      .map((str) => {
        const match = str.match(/(.+)\+(\d+)\s*EGP/i);
        return match ? { name: match[1].trim(), price: Number(match[2]) } : null;
      })
      .filter(Boolean);
  }, [selectedVariant?.add_ons, effectiveItem.add_ons, lang]);

  const comboExtra = useMemo(() => {
    const c = COMBO_DEF.find((x) => x.id === comboId);
    return c ? c.price : 0;
  }, [comboId]);

  const totalPrice =
    Number(selectedVariant.price) +
    selectedAddons.reduce((sum, a) => sum + Number(a.price), 0) +
    comboExtra;

  useEffect(() => {
    if (!isOpen || !selectedVariant?.id) return;
    api
      .get(`/menu/${selectedVariant.id}/related`, { params: { limit: 4 } })
      .then((res) => setRelated(res.data.data || []))
      .catch(() => setRelated([]));
  }, [isOpen, selectedVariant?.id, lang]);

  useEffect(() => {
    if (!isOpen) return;
    if (!menuCacheRef.current) {
      api.get('/menu').then((res) => {
        menuCacheRef.current = res.data.data || [];
      });
    }
  }, [isOpen]);

  const openRelatedItem = useCallback(
    async (e, relatedRow) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        if (!menuCacheRef.current) {
          const res = await api.get('/menu');
          menuCacheRef.current = res.data.data || [];
        }
        const grouped = findGroupedItemByMenuId(menuCacheRef.current, relatedRow.id);
        if (grouped) setModalItem(grouped);
      } catch {
        /* ignore */
      }
    },
    []
  );

  const closeModal = () => {
    setIsOpen(false);
    setModalItem(null);
  };

  const handleAddToCart = () => {
    const spicySuffix = isSpicy ? ` — ${t('menu.spicy')}` : '';
    const cartItem = {
      ...effectiveItem,
      id: `${selectedVariant.id}-${isSpicy}-${comboId}-${selectedAddons.map((a) => a.name).join('-')}-${itemNote}`,
      menuItem: Number(selectedVariant.id),
      size: selectedVariant.size,
      price: totalPrice,
      isSpicy,
      selectedAddons,
      comboId: effectiveItem.category === 'Sandwiches' ? comboId || null : null,
      itemNote: itemNote.trim() || '',
      name: effectiveItem.name,
      displayName: `${itemTitle} (${selectedVariant.size})${spicySuffix}`,
      displayNameAr: `${getLocalized(effectiveItem.name, 'ar')} (${selectedVariant.size})${isSpicy ? ` — ${t('menu.spicy')}` : ''}`,
      displayNameEn: `${getLocalized(effectiveItem.name, 'en')} (${selectedVariant.size})${isSpicy ? ` — ${t('menu.spicy')}` : ''}`,
    };

    addToCart(cartItem);
    setAdded(true);
    closeModal();
    setTimeout(() => setAdded(false), 2000);
  };

  const toggleAddon = (addon) => {
    setSelectedAddons((prev) =>
      prev.find((a) => a.name === addon.name)
        ? prev.filter((a) => a.name !== addon.name)
        : [...prev, addon]
    );
  };

  const gridImgSrc = itemImageSrc(item);
  const modalImgSrc = itemImageSrc(effectiveItem);

  const gridTitle = getLocalized(item.name, lang);
  const gridDesc = getLocalized(item.description, lang);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        whileHover={{ y: -5 }}
        onClick={() => setIsOpen(true)}
        className="cursor-pointer group bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-brand-red/50 transition-all duration-500"
      >
        <div className="relative h-56 overflow-hidden">
          <img
            src={gridImgSrc}
            alt={gridTitle}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

          <div className="absolute bottom-4 left-4">
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">
              {t('menu.startingFrom')}
            </p>
            <p className="text-white font-black text-xl">
              {t('common.egp')} {Number(gridVariants[0].price).toFixed(0)}
            </p>
          </div>

          <div className="absolute top-4 right-4 w-10 h-10 bg-brand-red rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xl">
            <FiPlus size={20} />
          </div>
        </div>

        <div className="p-5">
          <h3 className="font-display text-lg font-bold text-white group-hover:text-brand-gold transition-colors uppercase tracking-tight">
            {gridTitle}
          </h3>
          <p className="text-white/40 text-xs mt-1 line-clamp-1 italic">{gridDesc}</p>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 16 }}
              className="relative bg-[#0a0a0a] w-full max-w-4xl rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            >
              <button
                type="button"
                onClick={closeModal}
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-black/50 hover:bg-brand-red text-white rounded-full flex items-center justify-center transition-all"
              >
                <FiX size={20} />
              </button>

              <div className="md:w-1/2 h-64 md:h-auto relative min-h-[16rem]">
                <img src={modalImgSrc} className="w-full h-full object-cover" alt={itemTitle} />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent md:block hidden" />
              </div>

              <div className="md:w-1/2 p-8 md:p-10 overflow-y-auto custom-scrollbar">
                <span className="text-brand-gold font-bold text-[10px] uppercase tracking-[0.3em] mb-2 block">
                  Fresco
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-white uppercase mb-4 leading-none">
                  {itemTitle}
                </h2>
                <p className="text-white/40 text-sm leading-relaxed mb-6">{itemDesc}</p>

                {variants.length > 1 && (
                  <div className="mb-6">
                    <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-brand-red rounded-full" />
                      {t('menu.chooseSize')}
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {variants.map((v) => (
                        <button
                          type="button"
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`py-3 px-2 rounded-xl font-bold text-[10px] transition-all border ${
                            selectedVariant.size === v.size
                              ? 'bg-brand-red border-brand-red text-white'
                              : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'
                          }`}
                        >
                          {v.size.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {effectiveItem.has_spicy && (
                  <div className="mb-6">
                    <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-brand-red rounded-full" />
                      {t('menu.heat')}
                    </h4>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsSpicy(false)}
                        className={`flex-1 py-3 rounded-xl font-bold text-[10px] border transition-all ${
                          !isSpicy
                            ? 'bg-white/10 border-white/30 text-white'
                            : 'bg-transparent border-white/5 text-white/20'
                        }`}
                      >
                        {t('menu.regular')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSpicy(true)}
                        className={`flex-1 py-3 rounded-xl font-bold text-[10px] border transition-all ${
                          isSpicy
                            ? 'bg-orange-600 border-orange-400 text-white shadow-lg shadow-orange-600/20'
                            : 'bg-transparent border-white/5 text-white/20'
                        }`}
                      >
                        🔥 {t('menu.spicy')}
                      </button>
                    </div>
                  </div>
                )}

                {effectiveItem.category === 'Sandwiches' && (
                  <div className="mb-6">
                    <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-brand-red rounded-full" />
                      {t('menu.comboTitle')}
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 text-sm text-white/70">
                        <input
                          type="radio"
                          name={`combo-${effectiveItem.id}`}
                          checked={comboId === ''}
                          onChange={() => setComboId('')}
                        />
                        {t('menu.comboNone')}
                      </label>
                      {COMBO_DEF.map((c) => (
                        <label key={c.id} className="flex items-center gap-3 text-sm text-white/80">
                          <input
                            type="radio"
                            name={`combo-${effectiveItem.id}`}
                            checked={comboId === c.id}
                            onChange={() => setComboId(c.id)}
                          />
                          {t(`sandwichCombo.${c.id}`)}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {availableAddons.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-brand-red rounded-full" />
                      {t('menu.extras')}
                    </h4>
                    <div className="space-y-2">
                      {availableAddons.map((addon) => (
                        <button
                          type="button"
                          key={addon.name}
                          onClick={() => toggleAddon(addon)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                            selectedAddons.find((a) => a.name === addon.name)
                              ? 'bg-brand-red/10 border-brand-red text-white'
                              : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-xs font-medium">{addon.name}</span>
                          <span className="text-[10px] font-bold text-brand-gold">
                            +{Number(addon.price).toFixed(0)} {t('common.egp')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <label className="text-white font-bold text-sm mb-2 block">{t('menu.itemNote')}</label>
                  <textarea
                    value={itemNote}
                    onChange={(e) => setItemNote(e.target.value)}
                    placeholder={t('menu.itemNotePlaceholder')}
                    className="input-field min-h-[80px] text-sm"
                  />
                </div>

                {related.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-white font-bold text-sm mb-3">{t('menu.youMayAlsoLike')}</h4>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {related.map((r) => (
                        <button
                          type="button"
                          key={r.id}
                          onClick={(e) => openRelatedItem(e, r)}
                          className="min-w-[140px] glass rounded-xl p-3 border border-white/10 text-start cursor-pointer hover:border-brand-gold/50 transition-colors"
                        >
                          <img
                            src={itemImageSrc(r)}
                            alt={getLocalized(r.name, lang)}
                            className="w-full h-20 object-cover rounded-lg mb-2"
                          />
                          <p className="text-[10px] font-bold text-white line-clamp-2">
                            {getLocalized(r.name, lang)}
                          </p>
                          <p className="text-[10px] text-brand-gold font-black mt-1">
                            {t('common.egp')} {Number(r.price).toFixed(0)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full bg-brand-red hover:bg-red-600 text-white py-5 rounded-2xl font-black text-sm flex items-center justify-between px-8 transition-all shadow-2xl shadow-brand-red/20 active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2 uppercase tracking-widest">
                    <FiPlus /> {added ? '✓' : t('menu.addToCart')}
                  </span>
                  <span className="text-lg">
                    {t('common.egp')} {totalPrice.toFixed(0)}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
