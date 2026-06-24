import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import {
  FiPackage,
  FiUsers,
  FiShoppingBag,
  FiDollarSign,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiClock,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import api from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { getLocalized } from '../utils/localized';

const STATUS_COLORS = {
  placed: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  preparing: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  out_for_delivery: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const CATEGORIES = ['Pasta', 'Appetizers', 'Sandwiches', 'Meals', 'Drinks'];
const ORDER_STATUSES = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

export default function Admin() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [stats, setStats] = useState({
    totalOrders: 0, todayOrders: 0, pendingOrders: 0,
    totalRevenue: 0, totalUsers: 0, totalMenuItems: 0
  });
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [instapayPayments, setInstapayPayments] = useState([]);

  const [itemForm, setItemForm] = useState({
    name: '',
    name_ar: '',
    description: '',
    description_ar: '',
    price: '',
    category: 'Sandwiches',
    size: 'Regular',
    spicyLevel: 0,
    calories: '',
    isAvailable: true,
    isFeatured: false,
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      loadDashboard();
      loadOrders();
      loadMenu();
      loadInstapay();

      const interval = setInterval(() => {
        loadOrders();
        loadInstapay();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadDashboard = () => {
    api
      .get('/admin/dashboard')
      .then((r) => setStats(r.data.data))
      .catch((err) => console.error('Stats Load Failed', err));
  };

  const loadOrders = () => {
    api
      .get('/admin/orders')
      .then((r) => setOrders(r.data.data || []))
      .catch((err) => console.error('Orders Load Failed', err));
  };

  const loadMenu = () => {
    api
      .get('/menu')
      .then((r) => setMenuItems(r.data.data || []))
      .catch((err) => console.error('Menu Load Failed', err));
  };

  const loadInstapay = () => {
    api
      .get('/payments/admin/pending')
      .then((r) => setInstapayPayments(r.data.data || []))
      .catch(() => setInstapayPayments([]));
  };

  const loadOrderDetail = (orderId) => {
    if (!orderId) return;
    api
      .get(`/admin/orders/${orderId}`)
      .then((r) => setOrderDetail(r.data.data))
      .catch(() => setOrderDetail(null));
  };

  useEffect(() => {
    setSelectedOrder((prev) => {
      if (!prev?.id) return prev;
      const fresh = orders.find((o) => o.id === prev.id);
      return fresh ? { ...prev, ...fresh } : prev;
    });
  }, [orders]);

  useEffect(() => {
    if (!selectedOrder?.id) {
      setOrderDetail(null);
      return;
    }
    loadOrderDetail(selectedOrder.id);
  }, [selectedOrder?.id]);

  const statusLabel = (key) => t(`track.${key}`, { defaultValue: key });

  const updateOrderStatus = async (id, orderStatus) => {
    try {
      await api.put(`/admin/orders/${id}/status`, { orderStatus });
      toast.success(t('admin.toastOrderSet', { status: statusLabel(orderStatus) }));
      loadOrders();
      loadDashboard();
      loadOrderDetail(id);
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.toastStatusFailed'));
    }
  };

  const updateInstapayStatus = async (paymentId, status) => {
    try {
      const pay = instapayPayments.find((p) => p.id === paymentId);
      await api.put(`/payments/${paymentId}/status`, { status });
      toast.success(status === 'approved' ? t('admin.toastInstapayApproved') : t('admin.toastInstapayRejected'));
      loadInstapay();
      loadOrders();
      loadDashboard();
      if (pay?.order_id) loadOrderDetail(pay.order_id);
    } catch (err) {
      toast.error(err.response?.data?.error || t('admin.toastPaymentFailed'));
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: itemForm.name,
        name_ar: itemForm.name_ar || null,
        description: itemForm.description,
        description_ar: itemForm.description_ar || null,
        price: parseFloat(itemForm.price),
        category: itemForm.category,
        size: itemForm.size || 'Regular',
        has_spicy: Number(itemForm.spicyLevel) > 0,
        calories: itemForm.calories ? parseInt(itemForm.calories, 10) : null,
        is_available: itemForm.isAvailable,
        is_featured: itemForm.isFeatured,
      };
      if (editItem) {
        await api.put(`/menu/${editItem.id}`, payload);
        toast.success(t('admin.toastItemUpdated'));
      } else {
        await api.post('/menu', payload);
        toast.success(t('admin.toastItemAdded'));
      }
      setShowItemForm(false);
      setEditItem(null);
      setItemForm({
        name: '',
        name_ar: '',
        description: '',
        description_ar: '',
        price: '',
        category: 'Sandwiches',
        size: 'Regular',
        spicyLevel: 0,
        calories: '',
        isAvailable: true,
        isFeatured: false,
      });
      loadMenu();
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.toastActionFailed'));
    }
  };

  const deleteItem = async (id) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    try {
      await api.delete(`/menu/${id}`);
      toast.success(t('admin.toastItemRemoved'));
      loadMenu();
    } catch (err) {
      toast.error(t('admin.toastDeleteFailed'));
    }
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark">
      <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user || user.role !== 'admin') return <Navigate to="/login" />;

  const detail =
    selectedOrder && orderDetail?.id === selectedOrder.id
      ? { ...selectedOrder, ...orderDetail }
      : selectedOrder;
  const currentOrderStatus = String(detail?.orderStatus || 'placed').toLowerCase();

  return (
    <div className="min-h-screen pt-24 pb-20 bg-brand-dark text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="font-display text-5xl font-black uppercase italic tracking-tighter">{t('admin.title')}</h1>
            <p className="text-white/40 font-medium">{t('admin.welcome', { name: user.name })}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'orders', labelKey: 'admin.tabOrders', icon: <FiPackage /> },
              { id: 'payments', labelKey: 'admin.tabPayments', icon: <span className="text-lg">💳</span> },
              { id: 'dashboard', labelKey: 'admin.tabDashboard', icon: <FiDollarSign /> },
              { id: 'menu', labelKey: 'admin.tabMenu', icon: <FiShoppingBag /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                  activeTab === tab.id ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {tab.icon} {t(tab.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {[
                  { labelKey: 'admin.statTotalOrders', val: stats.totalOrders, icon: <FiPackage />, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                  { labelKey: 'admin.statRevenue', val: Number(stats.totalRevenue || 0).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-EG'), icon: <FiDollarSign />, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
                  { labelKey: 'admin.statTodayOrders', val: stats.todayOrders, icon: <FiClock />, color: 'text-green-400', bg: 'bg-green-400/10' },
                  { labelKey: 'admin.statPendingKitchen', val: stats.pendingOrders, icon: <FiShoppingBag />, color: 'text-orange-400', bg: 'bg-orange-400/10' },
                  { labelKey: 'admin.statActiveCustomers', val: stats.totalUsers, icon: <FiUsers />, color: 'text-purple-400', bg: 'bg-purple-400/10' },
                  { labelKey: 'admin.statLiveMenuItems', val: stats.totalMenuItems, icon: '🍗', color: 'text-brand-red', bg: 'bg-brand-red/10' },
                ].map((s, i) => (
                  <div key={s.labelKey} className="glass rounded-[2rem] p-8 border border-white/5 relative overflow-hidden group">
                    <div className={`absolute top-0 end-0 w-24 h-24 ${s.bg} rounded-bl-[5rem] flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <span className={`text-2xl ${s.color}`}>{s.icon}</span>
                    </div>
                    <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">{t(s.labelKey)}</p>
                    <h3 className={`text-4xl font-display font-black ${s.color}`}>{s.val ?? 0}</h3>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Live Orders Tab */}
          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Orders List */}
                <div className="lg:col-span-1">
                  <h2 className="font-display text-2xl font-black uppercase mb-6">{t('admin.liveOrdersTitle', { count: orders.length })}</h2>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {orders.map(order => (
                      <motion.button
                        key={order.id}
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        whileHover={{ scale: 1.02 }}
                        className={`w-full p-4 rounded-xl border-2 text-start transition-all ${
                          selectedOrder?.id === order.id
                            ? 'bg-brand-red/20 border-brand-red'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-black text-brand-gold">{order.orderNumber}</span>
                          <span className={`text-xs px-2 py-1 rounded-lg font-bold capitalize ${STATUS_COLORS[String(order.orderStatus || 'placed').toLowerCase()] || STATUS_COLORS.placed}`}>
                            {statusLabel(order.orderStatus || 'placed')}
                          </span>
                        </div>
                        <p className="text-sm text-white/60">{order.customerInfo.name}</p>
                        <p className="text-xs text-white/40 mt-1">{t('common.egp')} {order.total}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Order Details */}
                <div className="lg:col-span-2">
                  {selectedOrder ? (
                    <div className="glass rounded-[2rem] p-8 border border-white/5">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-white/40 text-xs uppercase font-black mb-1">{t('admin.orderId')}</p>
                          <h3 className="font-display text-3xl font-black text-brand-gold">{detail.orderNumber}</h3>
                        </div>
                        <div className="text-end">
                          <p className="text-white/40 text-xs uppercase font-black mb-1">{t('admin.total')}</p>
                          <p className="text-2xl font-black text-brand-gold">{t('common.egp')} {detail.total}</p>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10">
                        <p className="text-white/40 text-xs uppercase font-black mb-3">{t('admin.customerInfo')}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between gap-4">
                            <span className="text-white/60">{t('admin.name')}</span>
                            <span className="font-bold text-end">{detail.customerInfo.name}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-white/60">{t('admin.phone')}</span>
                            <span className="font-bold text-end">{detail.customerInfo.phone}</span>
                          </div>
                          {detail.customerInfo.email && (
                            <div className="flex justify-between gap-4">
                              <span className="text-white/60">{t('admin.email')}</span>
                              <span className="font-bold text-end break-all">{detail.customerInfo.email}</span>
                            </div>
                          )}
                          <div className="flex justify-between gap-4">
                            <span className="text-white/60">{t('admin.address')}</span>
                            <span className="font-bold text-end">{detail.customerInfo.address || t('admin.storePickup')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10">
                        <p className="text-white/40 text-xs uppercase font-black mb-3">{t('admin.paymentMethod')}</p>
                        <p className="font-black text-lg text-white">
                          {detail.paymentMethod === 'instapay' ? t('admin.payInstapay') : t('admin.payCash')}
                        </p>
                      </div>

                      {Array.isArray(detail.statusHistory) && detail.statusHistory.length > 0 && (
                        <div className="mb-6">
                          <p className="text-white/40 text-xs uppercase font-black mb-3">{t('admin.statusHistory')}</p>
                          <ul className="space-y-2 max-h-40 overflow-y-auto">
                            {detail.statusHistory.map((h) => (
                              <li key={h.id} className="text-sm text-white/80 border-b border-white/5 pb-2">
                                <span className="text-[10px] text-brand-gold font-mono">
                                  {new Date(h.created_at).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-EG')}
                                </span>
                                <span className="mx-2 text-white/30">—</span>
                                {h.note ? (
                                  <span>
                                    {h.note === 'instapay_accepted' || h.note === 'instapay_rejected'
                                      ? t(`admin.history.${h.note}`)
                                      : h.note}
                                  </span>
                                ) : (
                                  <span className="font-semibold">{statusLabel(h.status)}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Order Items */}
                      <div className="mb-6">
                        <p className="text-white/40 text-xs uppercase font-black mb-3">{t('admin.orderItems')}</p>
                        <div className="space-y-2">
                          {detail.items && detail.items.length > 0 ? detail.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-start py-2 border-b border-white/5 gap-4">
                              <div>
                                <p className="font-bold">{item.name}</p>
                                <p className="text-xs text-white/40">
                                  {t('common.qty')}: {item.quantity}
                                  {item.combo_selection ? ` • ${t('admin.combo')}: ${item.combo_selection}` : ''}
                                </p>
                                {item.custom_notes && (
                                  <p className="text-xs text-orange-300 mt-1">{t('admin.note')}: {item.custom_notes}</p>
                                )}
                              </div>
                              <p className="font-bold text-brand-gold whitespace-nowrap">
                                {t('common.egp')} {Number(item.subtotal ?? (item.price * item.quantity)).toFixed(0)}
                              </p>
                            </div>
                          )) : <p className="text-white/40">{t('admin.noItems')}</p>}
                        </div>
                      </div>

                      {/* Status Update */}
                      <div>
                        <p className="text-white/40 text-xs uppercase font-black mb-3">{t('admin.changeStatus')}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {ORDER_STATUSES.map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => updateOrderStatus(selectedOrder.id, status)}
                              className={`py-3 rounded-lg font-bold text-sm uppercase transition-all border ${
                                currentOrderStatus === status
                                  ? `${STATUS_COLORS[status]} border-current shadow-lg`
                                  : 'bg-white/5 text-white/60 hover:bg-white/10 border-white/10'
                              }`}
                            >
                              {statusLabel(status)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="glass rounded-[2rem] p-8 border border-white/5 text-center">
                      <FiPackage size={40} className="mx-auto text-white/20 mb-4" />
                      <p className="text-white/40">{t('admin.selectOrder')}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <motion.div key="payments" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h2 className="font-display text-2xl font-black uppercase mb-6">{t('admin.pendingInstapay', { count: instapayPayments.length })}</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {instapayPayments.length === 0 ? (
                  <p className="text-white/40">{t('admin.noInstapay')}</p>
                ) : (
                  instapayPayments.map((p) => (
                    <div key={p.id} className="glass rounded-2xl p-6 border border-white/10">
                      <div className="flex justify-between gap-4 mb-4">
                        <div>
                          <p className="text-brand-gold font-black">{p.order_number}</p>
                          <p className="text-sm text-white/60">{p.customer_name} • {p.customer_phone}</p>
                          <p className="text-xs text-white/40 mt-1">{t('common.egp')} {p.total}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => updateInstapayStatus(p.id, 'approved')}
                            className="px-4 py-2 rounded-xl bg-green-600 text-white font-bold text-sm"
                          >
                            {t('admin.approve')}
                          </button>
                          <button
                            type="button"
                            onClick={() => updateInstapayStatus(p.id, 'rejected')}
                            className="px-4 py-2 rounded-xl bg-red-600/80 text-white font-bold text-sm"
                          >
                            {t('admin.reject')}
                          </button>
                        </div>
                      </div>
                      {p.user_notes && <p className="text-xs text-white/50 mb-3">{t('admin.customerNote', { note: p.user_notes })}</p>}
                      <a href={p.screenshot_path} target="_blank" rel="noreferrer" className="block">
                        <img src={p.screenshot_path} alt="" className="w-full rounded-xl border border-white/10" />
                      </a>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Menu Management Content */}
          {activeTab === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-display text-3xl font-black uppercase italic">{t('admin.kitchenMenu')}</h2>
                <button type="button" onClick={() => { setShowItemForm(true); setEditItem(null); }} className="bg-brand-red hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 transition-all shadow-lg shadow-brand-red/20">
                  <FiPlus size={20} /> {t('admin.addNewItem')}
                </button>
              </div>

              {/* Form Logic (Item Submit / Edit) */}
              {showItemForm && (
                <div className="glass rounded-[2rem] p-8 border border-brand-red/30 mb-10 shadow-2xl">
                   {/* Form details here matching handleItemSubmit */}
                   <p className="text-brand-gold font-bold mb-4 uppercase tracking-widest text-xs">{t('admin.editingMenuDb')}</p>
                   <form onSubmit={handleItemSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <input
                        className="input-field md:col-span-3"
                        placeholder={t('admin.placeholderNameEn')}
                        value={itemForm.name}
                        onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                        required
                      />
                      <input
                        className="input-field md:col-span-3"
                        dir="rtl"
                        placeholder={t('admin.placeholderNameAr')}
                        value={itemForm.name_ar}
                        onChange={(e) => setItemForm({ ...itemForm, name_ar: e.target.value })}
                      />
                      <textarea
                        className="input-field md:col-span-3 min-h-[80px]"
                        placeholder={t('admin.placeholderDescEn')}
                        value={itemForm.description}
                        onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                      />
                      <textarea
                        className="input-field md:col-span-3 min-h-[80px]"
                        dir="rtl"
                        placeholder={t('admin.placeholderDescAr')}
                        value={itemForm.description_ar}
                        onChange={(e) => setItemForm({ ...itemForm, description_ar: e.target.value })}
                      />
                      <input className="input-field" type="number" placeholder={t('admin.price')} value={itemForm.price} onChange={e => setItemForm({...itemForm, price: e.target.value})} required />
                      <select className="input-field" value={itemForm.category} onChange={e => setItemForm({...itemForm, category: e.target.value})}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{t(`categories.${c}`, c)}</option>)}
                      </select>
                      <label className="flex items-center gap-2 text-sm text-white/70">
                        <input type="checkbox" checked={itemForm.isAvailable} onChange={e => setItemForm({...itemForm, isAvailable: e.target.checked})} />
                        {t('admin.available')}
                      </label>
                      <label className="flex items-center gap-2 text-sm text-white/70">
                        <input type="checkbox" checked={itemForm.isFeatured} onChange={e => setItemForm({...itemForm, isFeatured: e.target.checked})} />
                        {t('admin.featured')}
                      </label>
                      <label className="flex items-center gap-2 text-sm text-white/70 md:col-span-3">
                        <input type="checkbox" checked={Number(itemForm.spicyLevel) > 0} onChange={e => setItemForm({...itemForm, spicyLevel: e.target.checked ? 1 : 0})} />
                        {t('admin.spicyOption')}
                      </label>
                      <div className="md:col-span-3 flex gap-4">
                        <button type="submit" className="btn-primary px-10">{t('admin.saveItem')}</button>
                        <button type="button" onClick={() => setShowItemForm(false)} className="btn-ghost">{t('admin.cancel')}</button>
                      </div>
                   </form>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map(item => (
                  <div key={item.id} className="glass rounded-3xl p-6 border border-white/5 flex flex-col justify-between group">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full">{t(`categories.${item.category}`, item.category)}</span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setEditItem(item);
                              setItemForm({
                                name: getLocalized(item.name, 'en') || (typeof item.name === 'string' ? item.name : ''),
                                name_ar: typeof item.name === 'object' ? item.name.ar || '' : '',
                                description: getLocalized(item.description, 'en') || (typeof item.description === 'string' ? item.description : ''),
                                description_ar:
                                  typeof item.description === 'object' ? item.description.ar || '' : '',
                                price: String(item.price),
                                category: item.category,
                                size: item.size || 'Regular',
                                spicyLevel: item.has_spicy ? 1 : 0,
                                calories: item.calories ?? '',
                                isAvailable: item.is_available,
                                isFeatured: item.is_featured,
                              });
                              setShowItemForm(true);
                            }}
                            className="p-2 bg-white/10 hover:bg-blue-500 rounded-lg text-white transition-colors"
                          >
                            <FiEdit size={14} />
                          </button>
                          <button type="button" onClick={() => deleteItem(item.id)} className="p-2 bg-white/10 hover:bg-brand-red rounded-lg text-white transition-colors"><FiTrash2 size={14} /></button>
                        </div>
                      </div>
                      <h4 className="font-bold text-xl uppercase leading-none mb-2">
                        {getLocalized(item.name, lang)}
                      </h4>
                      <p className={`text-white/50 text-xs mb-1 ${lang === 'ar' ? 'text-start' : ''}`} dir={lang === 'ar' ? 'ltr' : 'rtl'}>
                        {getLocalized(item.name, lang === 'ar' ? 'en' : 'ar')}
                      </p>
                      <p className="text-white/40 text-xs line-clamp-2 mb-4 italic">
                        {getLocalized(item.description, lang)}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <p className="font-display font-black text-2xl">{t('common.egp')} {Number(item.price).toFixed(0)}</p>
                      <div className={`w-3 h-3 rounded-full ${item.is_available ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

