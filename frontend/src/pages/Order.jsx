import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiMinus,
  FiPlus,
  FiTrash2,
  FiArrowRight,
  FiCheck,
  FiTruck,
  FiShoppingBag,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import api from '../hooks/useApi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LocationMap from '../components/LocationMap';
import MenuCard from '../components/MenuCard';
import { getLocalized } from '../utils/localized';
import { groupMenuItemsByName } from '../utils/menuGroup';

export default function Order() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';

  const cartLineLabel = (i) => {
    const namePart = getLocalized(i.name, lang);
    if (typeof i.name === 'object' && i.name && (i.name.en || i.name.ar)) {
      const spicy = i.isSpicy ? ` — ${t('menu.spicy')}` : '';
      return `${namePart} (${i.size})${spicy}`;
    }
    return i.displayName || namePart || String(i.name || '');
  };

  const { items, updateQuantity, removeFromCart, clearCart, subtotal } = useCart();
  const { user, login, register, loading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [orderType, setOrderType] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [pendingInstapay, setPendingInstapay] = useState(null);

  const [regions, setRegions] = useState([]);
  const [regionId, setRegionId] = useState('');
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(17);
  const [pin, setPin] = useState(null);
  /** Street + city geocode succeeded (apt/unit not used in search). */
  const [addressGeocoded, setAddressGeocoded] = useState(false);
  const [addressLookupStatus, setAddressLookupStatus] = useState('idle');
  /** User confirmed delivery pin position (independent of zone choice). */
  const [pinLocationConfirmed, setPinLocationConfirmed] = useState(false);
  const findAddressSeqRef = useRef(0);
  const lastGeocodedAddressRef = useRef('');

  const [publicConfig, setPublicConfig] = useState({ instapayPhone: '', mapDefaultLat: 30.059, mapDefaultLng: 31.239 });
  const [alsoBought, setAlsoBought] = useState([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    addressStreet: '',
    addressLine2: '',
    city: '',
    notes: '',
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ identifier: '', password: '', name: '', phone: '', email: '' });

  const [instapayFile, setInstapayFile] = useState(null);
  const [instapayNote, setInstapayNote] = useState('');

  useEffect(() => {
    api
      .get('/delivery-regions')
      .then((r) => setRegions(r.data.data || []))
      .catch(() => {});
    api
      .get('/config/public')
      .then((r) => {
        const d = r.data.data || {};
        setPublicConfig({
          instapayPhone: d.instapayPhone || '01229207370',
          mapDefaultLat: d.mapDefaultLat,
          mapDefaultLng: d.mapDefaultLng,
        });
        setMapCenter({ lat: d.mapDefaultLat, lng: d.mapDefaultLng });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (step !== 1) return;
    api
      .get('/menu')
      .then((r) => {
        const data = r.data.data || [];
        const grouped = groupMenuItemsByName(data);
        const inCart = (g) =>
          items.some((c) => g.all_variants?.some((v) => Number(v.id) === Number(c.menuItem)));
        const featuredPool = grouped.filter((g) => g.is_featured && !inCart(g));
        const fallbackPool = grouped.filter((g) => !inCart(g));
        const pool = (featuredPool.length ? featuredPool : fallbackPool).slice(0, 4);
        setAlsoBought(pool);
      })
      .catch(() => setAlsoBought([]));
  }, [step, items]);

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      name: user.name || f.name,
      phone: user.phone || f.phone,
      email: user.email || f.email,
      addressStreet: f.addressStreet || user.address?.street || '',
      addressLine2: f.addressLine2 || '',
      city: f.city || user.address?.city || '',
    }));
  }, [user]);

  const selectedRegion = useMemo(
    () => regions.find((r) => String(r.id) === String(regionId)),
    [regions, regionId]
  );

  const streetLine = useMemo(() => {
    const s = form.addressStreet?.trim();
    const u = form.addressLine2?.trim();
    if (s && u) return `${s}, ${u}`;
    return s || u || '';
  }, [form.addressStreet, form.addressLine2]);

  /** Search query for Nominatim: street + city + Egypt only (no apartment/unit/floor). */
  const geocodeSearchString = useMemo(() => {
    const st = form.addressStreet?.trim();
    const city = form.city?.trim();
    const parts = [];
    if (st) parts.push(st);
    if (city) parts.push(city);
    parts.push('Egypt');
    return parts.join(', ');
  }, [form.addressStreet, form.city]);

  const minDeliveryFee = useMemo(() => {
    if (!regions.length) return null;
    const nums = regions.map((r) => Number(r.delivery_fee)).filter((n) => Number.isFinite(n));
    if (!nums.length) return null;
    return Math.min(...nums);
  }, [regions]);

  const deliveryFee = useMemo(() => {
    if (orderType === 'pickup') return 0;
    if (!selectedRegion) return 0;
    return Number(selectedRegion.delivery_fee) || 0;
  }, [orderType, selectedRegion]);

  const appliedDeliveryFee =
    orderType === 'pickup' ? 0 : orderType === 'delivery' && selectedRegion ? deliveryFee : 0;

  const total = subtotal + appliedDeliveryFee;

  useEffect(() => {
    if (orderType !== 'pickup') return;
    setRegionId('');
    setPin(null);
    setAddressGeocoded(false);
    setPinLocationConfirmed(false);
    setAddressLookupStatus('idle');
    lastGeocodedAddressRef.current = '';
  }, [orderType]);

  useEffect(() => {
    if (orderType !== 'delivery' || !addressGeocoded || !lastGeocodedAddressRef.current) return;
    const t = window.setTimeout(() => {
      if (geocodeSearchString !== lastGeocodedAddressRef.current) {
        setAddressGeocoded(false);
        setPinLocationConfirmed(false);
        setPin(null);
        lastGeocodedAddressRef.current = '';
      }
    }, 500);
    return () => window.clearTimeout(t);
  }, [geocodeSearchString, orderType, addressGeocoded]);

  const handleFindAddressOnMap = async () => {
    if (!form.addressStreet?.trim()) {
      toast.error(t('checkout.validationStreetAddress'));
      return;
    }
    if (!form.city?.trim()) {
      toast.error(t('checkout.validationCity'));
      return;
    }
    findAddressSeqRef.current += 1;
    const seq = findAddressSeqRef.current;
    setAddressLookupStatus('loading');
    setPinLocationConfirmed(false);
    const q = geocodeSearchString;
    try {
      const res = await api.get('/geocode', { params: { q } });
      if (seq !== findAddressSeqRef.current) return;
      const data = res.data?.data;
      if (!data || !Number.isFinite(data.lat) || !Number.isFinite(data.lng)) {
        setAddressLookupStatus('error');
        setAddressGeocoded(false);
        setPin(null);
        toast.error(t('checkout.addressNotFound'));
        return;
      }
      setMapCenter({ lat: data.lat, lng: data.lng });
      setMapZoom(17);
      setPin({ lat: data.lat, lng: data.lng });
      setAddressGeocoded(true);
      lastGeocodedAddressRef.current = q;
      setAddressLookupStatus('ok');
    } catch {
      if (seq !== findAddressSeqRef.current) return;
      setAddressLookupStatus('error');
      setAddressGeocoded(false);
      setPin(null);
      toast.error(t('checkout.addressLookupFailed'));
    }
  };

  const handleDeliveryPinChange = (p) => {
    setPin(p);
    if (pinLocationConfirmed) setPinLocationConfirmed(false);
  };

  const handleConfirmPinLocation = () => {
    if (!pin) {
      toast.error(t('checkout.validationMapPin'));
      return;
    }
    setPinLocationConfirmed(true);
    setMapCenter({ lat: pin.lat, lng: pin.lng });
    setMapZoom(17);
    toast.success(t('checkout.pinLocationSaved'));
  };

  const handleFormChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleAuthChange = (e) => setAuthForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'login') {
        await login(authForm.identifier, authForm.password);
        toast.success(t('checkout.signInToOrder'));
      } else {
        await register({
          name: authForm.name,
          phone: authForm.phone,
          password: authForm.password,
          email: authForm.email || undefined,
        });
        toast.success(t('checkout.registerToOrder'));
      }
      setShowAuthModal(false);
      setAuthForm({ identifier: '', password: '', name: '', phone: '', email: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Auth failed');
    } finally {
      setLoading(false);
    }
  };

  const emailTrimmed = (form.email && String(form.email).trim()) || '';

  const validateDetailsForReview = () => {
    const errs = [];
    if (!form.name?.trim()) errs.push(t('checkout.validationName'));
    if (!form.phone?.trim()) errs.push(t('checkout.validationPhone'));
    if (emailTrimmed) {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
      if (!ok) errs.push(t('checkout.validationEmail'));
    }
    if (orderType === 'delivery') {
      if (!form.addressStreet?.trim()) errs.push(t('checkout.validationStreetAddress'));
      if (!form.city?.trim()) errs.push(t('checkout.validationCity'));
      if (!addressGeocoded) errs.push(t('checkout.validationFindOnMap'));
      if (!pin) errs.push(t('checkout.validationMapPin'));
      if (!pinLocationConfirmed) errs.push(t('checkout.validationConfirmPinLocation'));
      if (!regionId) errs.push(t('checkout.selectRegion'));
    }
    if (errs.length) {
      errs.forEach((m) => toast.error(m));
      return false;
    }
    return true;
  };

  const validateBeforeSubmit = () => {
    if (!form.name?.trim() || !form.phone?.trim()) {
      toast.error(t('checkout.validationName'));
      return false;
    }
    if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      toast.error(t('checkout.validationEmail'));
      return false;
    }
    if (orderType === 'delivery') {
      if (!form.addressStreet?.trim()) {
        toast.error(t('checkout.validationStreetAddress'));
        return false;
      }
      if (!form.city?.trim()) {
        toast.error(t('checkout.validationCity'));
        return false;
      }
      if (!addressGeocoded) {
        toast.error(t('checkout.validationFindOnMap'));
        return false;
      }
      if (!pin) {
        toast.error(t('checkout.validationMapPin'));
        return false;
      }
      if (!pinLocationConfirmed) {
        toast.error(t('checkout.validationConfirmPinLocation'));
        return false;
      }
      if (!regionId) {
        toast.error(t('checkout.selectRegion'));
        return false;
      }
    }
    return true;
  };

  const buildPayload = () => ({
    customerInfo: {
      name: form.name,
      email: emailTrimmed || undefined,
      phone: form.phone,
      address: {
        street: streetLine || null,
        area: selectedRegion ? getLocalized(selectedRegion.name, lang) : null,
        city: form.city?.trim() || null,
      },
    },
    items: items.map((i) => ({
      menuItem: i.menuItem,
      name: cartLineLabel(i),
      quantity: i.quantity,
      selectedAddons: (i.selectedAddons || []).map((a) => a.name),
      comboId: i.comboId || null,
      itemNote: i.itemNote || '',
    })),
    paymentMethod,
    orderType,
    notes: form.notes,
    deliveryRegionId: orderType === 'delivery' ? parseInt(regionId, 10) : undefined,
    deliveryLocation:
      orderType === 'delivery' && pin ? { lat: pin.lat, lng: pin.lng } : undefined,
  });

  const handlePlaceOrder = async () => {
    if (!user) {
      setShowAuthModal(true);
      setAuthMode('login');
      return;
    }
    if (!items.length) {
      toast.error(t('cart.empty'));
      return;
    }
    if (!validateBeforeSubmit()) return;

    setLoading(true);
    try {
      const res = await api.post('/orders', buildPayload());
      if (!res.data.success) {
        throw new Error(res.data.error || 'Order failed');
      }
      const { orderNumber: num, orderId, total: tot } = res.data.data;
      setOrderNumber(num);

      if (user) {
        try {
          await api.put('/auth/profile', {
            name: form.name,
            phone: form.phone,
            email: emailTrimmed || undefined,
            address: {
              street: streetLine,
              area: selectedRegion ? getLocalized(selectedRegion.name, lang) : undefined,
              city: form.city?.trim() || undefined,
            },
          });
        } catch {
          /* non-fatal */
        }
      }

      if (paymentMethod === 'instapay') {
        setPendingInstapay({ orderId, orderNumber: num, total: tot });
        toast.success(t('checkout.instapayTitle'));
      } else {
        clearCart();
        setStep(4);
        toast.success(t('checkout.successTitle'));
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to place order';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleInstapaySubmit = async (e) => {
    e.preventDefault();
    if (!instapayFile || !pendingInstapay) {
      toast.error(t('checkout.uploadScreenshot'));
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('screenshot', instapayFile);
      fd.append('orderId', String(pendingInstapay.orderId));
      fd.append('userNotes', instapayNote || '');
      await api.post('/payments/upload-screenshot', fd);
      clearCart();
      setPendingInstapay(null);
      setStep(4);
      toast.success(t('checkout.successTitle'));
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (pendingInstapay) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4">
        <div className="max-w-lg mx-auto glass rounded-[2rem] p-8 border border-white/5">
          <h2 className="font-display text-3xl font-black text-white mb-4">{t('checkout.instapayTitle')}</h2>
          <p className="text-white/70 mb-6 leading-relaxed">
            {t('checkout.instapayLine', {
              amount: Number(pendingInstapay.total).toFixed(0),
              phone: publicConfig.instapayPhone || '—',
            })}
          </p>
          <form onSubmit={handleInstapaySubmit} className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setInstapayFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-white/70"
            />
            <textarea
              value={instapayNote}
              onChange={(e) => setInstapayNote(e.target.value)}
              placeholder={t('checkout.instapayNote')}
              className="input-field min-h-[100px]"
            />
            <button type="submit" disabled={loading} className="btn-primary w-full py-4">
              {loading ? '…' : t('checkout.submitPaymentProof')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="min-h-screen pt-28 pb-20 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full text-center"
        >
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <FiCheck size={40} className="text-white" />
          </div>
          <h2 className="font-display text-4xl font-black text-white mb-3 uppercase tracking-tighter">
            {t('checkout.successTitle')}
          </h2>
          <p className="text-white/60 text-lg mb-6 leading-relaxed">{t('checkout.successBody')}</p>
          <div className="glass rounded-3xl p-8 mb-8 border border-white/10">
            <p className="text-white/50 text-[10px] uppercase tracking-widest mb-2">
              {t('checkout.orderIdLabel')}
            </p>
            <p className="font-display text-4xl font-black text-brand-gold tracking-tight">{orderNumber}</p>
          </div>
          <div className="flex flex-col gap-4">
            <Link to="/track-order" className="btn-primary inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl">
              {t('checkout.trackOrder')}
            </Link>
            <Link
              to="/"
              className="bg-white/5 hover:bg-white/10 border border-white/20 text-white inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl transition-all"
            >
              {t('checkout.backHome')} <FiArrowRight />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (showAuthModal) {
    return (
      <div className="min-h-screen pt-28 pb-20 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass rounded-[2rem] p-8 border border-white/5"
        >
          <h2 className="font-display text-3xl font-black text-white mb-2 uppercase tracking-tighter">
            {authMode === 'login' ? t('login.login') : t('login.register')}
          </h2>
          <p className="text-white/60 mb-8">{t('checkout.needAccount')}</p>

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            {authMode === 'register' && (
              <input
                type="text"
                name="name"
                value={authForm.name}
                onChange={handleAuthChange}
                placeholder={t('login.name')}
                className="input-field"
                required
              />
            )}
            {authMode === 'login' ? (
              <input
                type="text"
                name="identifier"
                value={authForm.identifier}
                onChange={handleAuthChange}
                placeholder="Phone or email"
                className="input-field"
                required
              />
            ) : (
              <input
                type="tel"
                name="phone"
                value={authForm.phone}
                onChange={handleAuthChange}
                placeholder={t('login.phone')}
                className="input-field"
                required
              />
            )}
            <input
              type="password"
              name="password"
              value={authForm.password}
              onChange={handleAuthChange}
              placeholder={t('login.password')}
              className="input-field"
              required
            />
            {authMode === 'register' && (
              <input
                type="email"
                name="email"
                value={authForm.email}
                onChange={handleAuthChange}
                placeholder={t('checkout.email')}
                className="input-field"
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red hover:bg-red-600 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : authMode === 'login' ? (
                t('login.submitLogin')
              ) : (
                t('login.submitRegister')
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthForm({ identifier: '', password: '', name: '', phone: '', email: '' });
              }}
              className="text-brand-gold hover:underline font-bold"
            >
              {authMode === 'login' ? t('login.toggleToRegister') : t('login.toggleToLogin')}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAuthModal(false)}
            className="w-full mt-6 py-3 rounded-2xl font-bold text-white/40 hover:text-white transition-all"
          >
            {t('common.back')}
          </button>
        </motion.div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="min-h-screen pt-28 pb-20 flex flex-col items-center justify-center px-4 text-center">
        <p className="text-white/60 text-xl mb-6">{t('cart.empty')}</p>
        <Link to="/menu" className="btn-primary">
          {t('nav.menu')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="section-title text-left mb-6">
            {step === 1
              ? t('checkout.titleCart')
              : step === 2
                ? t('checkout.titleDetails')
                : t('checkout.titleConfirm')}
          </h1>
          <div className="flex items-center gap-4">
            {[t('checkout.stepCart'), t('checkout.stepDetails'), t('checkout.stepConfirm')].map((s, i) => (
              <div key={s} className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${
                    step > i + 1
                      ? 'bg-green-500 text-white'
                      : step === i + 1
                        ? 'bg-brand-red text-white'
                        : 'bg-white/5 text-white/20'
                  }`}
                >
                  {step > i + 1 ? <FiCheck size={18} /> : i + 1}
                </div>
                {i < 2 && (
                  <div
                    className={`w-12 h-1 rounded-full ${step > i + 1 ? 'bg-green-500' : 'bg-white/5'}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="cart"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="glass rounded-3xl p-5 flex items-center gap-5 border border-white/5"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-white/5 overflow-hidden flex-shrink-0">
                        <img
                          src={
                            item.image?.includes('fresco/')
                              ? `/${item.image}`
                              : item.image
                          }
                          alt={cartLineLabel(item)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-lg leading-tight uppercase tracking-tight truncate">
                          {cartLineLabel(item)}
                        </h4>
                        <p className="text-brand-gold font-bold text-sm">
                          {item.size} • {t('common.egp')} {Number(item.price).toFixed(0)}
                        </p>
                        {item.isSpicy && (
                          <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest mt-1">
                            🔥 {t('menu.spicy')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center bg-black/40 rounded-2xl p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 hover:text-brand-red flex items-center justify-center transition-colors"
                        >
                          <FiMinus />
                        </button>
                        <span className="w-8 text-center font-black text-white">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 hover:text-brand-red flex items-center justify-center transition-colors"
                        >
                          <FiPlus />
                        </button>
                      </div>
                      <div className="text-right ms-4 min-w-[80px]">
                        <p className="font-black text-white">
                          {t('common.egp')} {(item.price * item.quantity).toFixed(0)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-white/20 hover:text-brand-red transition-colors mt-2"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {alsoBought.length > 0 && (
                    <div className="mt-10">
                      <h3 className="font-black text-white text-lg mb-4">{t('cart.peopleAlsoBought')}</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {alsoBought.map((g, i) => (
                          <MenuCard key={g.name?.en ?? g.id} item={g} index={i} />
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full bg-brand-red hover:bg-red-600 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-all mt-8"
                  >
                    {t('cart.proceed')} <FiArrowRight />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="glass rounded-[2rem] p-8 border border-white/5">
                    <h3 className="font-black text-white text-xl mb-6 uppercase tracking-tight">
                      {t('checkout.howReceive')}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setOrderType('delivery')}
                        className={`p-6 rounded-[1.5rem] border-2 transition-all flex flex-col gap-2 ${
                          orderType === 'delivery'
                            ? 'border-brand-gold bg-brand-gold/10'
                            : 'border-white/5'
                        }`}
                      >
                        <FiTruck size={24} className={orderType === 'delivery' ? 'text-brand-gold' : 'text-white/40'} />
                        <div className="text-left">
                          <p className="font-bold text-white">{t('checkout.delivery')}</p>
                          <p className="text-xs text-white/40">{t('checkout.deliveryFeeHint')}</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderType('pickup')}
                        className={`p-6 rounded-[1.5rem] border-2 transition-all flex flex-col gap-2 ${
                          orderType === 'pickup'
                            ? 'border-brand-gold bg-brand-gold/10'
                            : 'border-white/5'
                        }`}
                      >
                        <FiShoppingBag
                          size={24}
                          className={orderType === 'pickup' ? 'text-brand-gold' : 'text-white/40'}
                        />
                        <div className="text-left">
                          <p className="font-bold text-white">{t('checkout.pickup')}</p>
                          <p className="text-xs text-green-500">{t('checkout.pickupFree')}</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="glass rounded-[2rem] p-8 border border-white/5">
                    <h3 className="font-black text-white text-xl mb-6 uppercase tracking-tight">
                      {t('checkout.personal')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleFormChange}
                        placeholder={t('checkout.fullName')}
                        className="input-field"
                      />
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleFormChange}
                        placeholder={t('checkout.phone')}
                        className="input-field"
                      />
                      <div className="sm:col-span-2">
                        <input
                          name="email"
                          type="text"
                          autoComplete="email"
                          value={form.email}
                          onChange={handleFormChange}
                          placeholder={t('checkout.email')}
                          className="input-field"
                        />
                      </div>
                      {orderType === 'delivery' && (
                        <>
                          <div className="sm:col-span-2 space-y-4">
                            <p className="text-[10px] text-white/40 font-black uppercase">{t('checkout.addressFormSection')}</p>
                            <input
                              name="addressStreet"
                              value={form.addressStreet}
                              onChange={handleFormChange}
                              placeholder={t('checkout.addressStreet')}
                              className="input-field"
                              autoComplete="street-address"
                              dir="auto"
                            />
                            <input
                              name="addressLine2"
                              value={form.addressLine2}
                              onChange={handleFormChange}
                              placeholder={t('checkout.addressLine2')}
                              className="input-field"
                              autoComplete="address-line2"
                              dir="auto"
                            />
                            <input
                              name="city"
                              value={form.city}
                              onChange={handleFormChange}
                              placeholder={t('checkout.cityPlaceholder')}
                              className="input-field"
                              autoComplete="address-level2"
                              dir="auto"
                            />
                            <p className="text-[10px] text-white/35">{t('checkout.geocodeUsesStreetCity')}</p>
                            <button
                              type="button"
                              onClick={handleFindAddressOnMap}
                              disabled={addressLookupStatus === 'loading'}
                              className="w-full py-4 rounded-2xl font-black text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all disabled:opacity-50"
                            >
                              {addressLookupStatus === 'loading' ? (
                                <span className="inline-flex items-center justify-center gap-2">
                                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  {t('checkout.addressGeocoding')}
                                </span>
                              ) : (
                                t('checkout.findOnMap')
                              )}
                            </button>
                          </div>
                          <div className="sm:col-span-2 space-y-3">
                            <p className="font-black text-white">{t('checkout.mapTitle')}</p>
                            <p className="text-xs text-white/40">{t('checkout.mapPinHint')}</p>
                            <LocationMap
                              center={
                                mapCenter || {
                                  lat: publicConfig.mapDefaultLat,
                                  lng: publicConfig.mapDefaultLng,
                                }
                              }
                              zoom={mapZoom}
                              position={pin}
                              onChange={handleDeliveryPinChange}
                              height={340}
                              flyTo
                              regionHighlight={
                                regionId && selectedRegion?.mapCenter
                                  ? {
                                      center: selectedRegion.mapCenter,
                                      radiusMeters: 1050,
                                      label: `${getLocalized(selectedRegion.name, lang)} — ${Number(
                                        selectedRegion.delivery_fee
                                      ).toFixed(0)} ${t('common.egp')}`,
                                    }
                                  : null
                              }
                            />
                            <button
                              type="button"
                              onClick={handleConfirmPinLocation}
                              disabled={!pin}
                              className="w-full py-4 rounded-2xl font-black text-white bg-brand-red hover:bg-red-600 transition-all disabled:opacity-40"
                            >
                              {t('checkout.confirmPinLocation')}
                            </button>
                            <div className="sm:col-span-2">
                              <label className="text-[10px] text-white/40 font-black uppercase block mb-2">
                                {t('checkout.regionManualHint')}
                              </label>
                              <select
                                value={regionId}
                                onChange={(e) => setRegionId(e.target.value)}
                                className="input-field"
                                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                              >
                                <option value="">{t('checkout.selectRegion')}</option>
                                {regions.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {getLocalized(r.name, lang)} — {Number(r.delivery_fee).toFixed(0)}{' '}
                                    {t('common.egp')}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="glass rounded-[2rem] p-8 border border-white/5">
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleFormChange}
                      placeholder={t('checkout.orderNotes')}
                      className="input-field min-h-[100px]"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-5 rounded-2xl font-bold text-white/40 hover:text-white transition-all"
                    >
                      {t('common.back')}
                    </button>
                    <button
                      type="button"
                      onClick={() => validateDetailsForReview() && setStep(3)}
                      className="flex-[2] bg-brand-red text-white py-5 rounded-2xl font-black text-lg"
                    >
                      {t('checkout.review')}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="glass rounded-[2rem] p-8 border border-white/5">
                    <h3 className="font-black text-white text-xl mb-6 uppercase tracking-tight italic">
                      {t('checkout.titleConfirm')}
                    </h3>
                    <div className="space-y-4">
                      {items.map((i) => (
                        <div
                          key={i.id}
                          className="flex justify-between items-center py-4 border-b border-white/5"
                        >
                          <div>
                            <p className="text-white font-bold">
                              {cartLineLabel(i)} × {i.quantity}
                            </p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest">{i.size}</p>
                          </div>
                          <p className="text-brand-gold font-black">
                            {t('common.egp')} {(i.price * i.quantity).toFixed(0)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 p-6 bg-white/5 rounded-2xl">
                      <p className="text-[10px] text-brand-gold font-black uppercase mb-2">
                        {t('checkout.deliveringTo')}
                      </p>
                      <p className="text-white font-bold">
                        {form.name} • {form.phone}
                      </p>
                      <p className="text-white/40 text-xs mt-1">
                        {orderType === 'delivery'
                          ? [streetLine, form.city?.trim(), selectedRegion && getLocalized(selectedRegion.name, lang)]
                              .filter(Boolean)
                              .join(' · ')
                          : t('checkout.storePickup')}
                      </p>
                    </div>
                  </div>

                  <div className="glass rounded-[2rem] p-8 border border-white/5">
                    <h3 className="font-black text-white text-xl mb-6 uppercase tracking-tight">
                      {t('checkout.payment')}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`p-5 rounded-2xl border-2 text-left font-bold ${
                          paymentMethod === 'cod'
                            ? 'border-brand-gold bg-brand-gold/10 text-white'
                            : 'border-white/10 text-white/60'
                        }`}
                      >
                        {t('checkout.payCod')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('instapay')}
                        className={`p-5 rounded-2xl border-2 text-left font-bold ${
                          paymentMethod === 'instapay'
                            ? 'border-brand-gold bg-brand-gold/10 text-white'
                            : 'border-white/10 text-white/60'
                        }`}
                      >
                        {t('checkout.payInstapay')}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 py-5 rounded-2xl font-bold text-white/40 hover:text-white transition-all"
                    >
                      {t('common.back')}
                    </button>
                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={loading}
                      className="flex-[2] bg-green-600 hover:bg-green-500 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-xl"
                    >
                      {loading ? (
                        <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <FiCheck /> {t('checkout.placeOrder')} {t('common.egp')} {total.toFixed(0)}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            <div className="glass rounded-[2rem] p-8 border border-white/5 sticky top-28">
              <h3 className="font-black text-white text-xl mb-8 uppercase tracking-tight">
                {t('checkout.orderBill')}
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between text-white/40 uppercase font-bold text-[10px]">
                  <span>{t('common.subtotal')}</span>
                  <span className="text-white text-sm">
                    {t('common.egp')} {subtotal.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between text-white/40 uppercase font-bold text-[10px]">
                  <span>{t('common.delivery')}</span>
                  <span
                    className={
                      orderType === 'pickup'
                        ? 'text-green-500 text-sm'
                        : orderType === 'delivery' && !selectedRegion
                          ? 'text-white/50 text-xs text-end max-w-[14rem]'
                          : appliedDeliveryFee === 0
                            ? 'text-green-500 text-sm'
                            : 'text-white text-sm'
                    }
                  >
                    {orderType === 'pickup' ? (
                      t('common.free')
                    ) : orderType === 'delivery' && !selectedRegion ? (
                      minDeliveryFee != null ? (
                        <>
                          {t('checkout.deliveryFeeFrom', { amount: minDeliveryFee })}{' '}
                          <span className="block text-[9px] text-white/35 font-normal normal-case mt-1">
                            {t('checkout.deliveryFeePending')}
                          </span>
                        </>
                      ) : (
                        t('checkout.deliveryFeePending')
                      )
                    ) : appliedDeliveryFee === 0 ? (
                      t('common.free')
                    ) : (
                      `${t('common.egp')} ${appliedDeliveryFee}`
                    )}
                  </span>
                </div>
                <div className="border-t border-white/10 pt-6 flex justify-between items-end">
                  <span className="text-white font-black text-lg uppercase tracking-tighter">
                    {t('common.total')}
                  </span>
                  <span className="text-brand-gold font-black text-3xl">
                    {t('common.egp')} {total.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
