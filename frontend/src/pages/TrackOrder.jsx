import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiPackage, FiTruck, FiHome, FiCheck, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import api from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

const STATUS_DEFS = [
  { id: 'placed', icon: <FiPackage /> },
  { id: 'confirmed', icon: <FiCheck /> },
  { id: 'preparing', icon: <FiPackage /> },
  { id: 'out_for_delivery', icon: <FiTruck /> },
  { id: 'delivered', icon: <FiHome /> },
];

export default function TrackOrder() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const locale = i18n.language?.startsWith('ar') ? 'ar-EG' : 'en-EG';

  const trackingStatuses = useMemo(
    () =>
      STATUS_DEFS.map((s) => ({
        ...s,
        label: t(`track.${s.id}`),
      })),
    [t, i18n.language]
  );

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error(t('track.signInPrompt'));
      navigate('/login');
    }
  }, [user, authLoading, navigate, t]);

  useEffect(() => {
    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  const fetchUserOrders = async () => {
    try {
      setRetrying(true);
      const res = await api.get('/orders/my');
      if (res.data.data && Array.isArray(res.data.data)) {
        setOrders(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedOrder(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (err.response?.status === 401) {
        toast.error(t('track.sessionExpired'));
        navigate('/login');
      } else {
        toast.error(err.response?.data?.error || t('track.fetchFail'));
      }
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  const getStatusIndex = (status) => {
    const statusValue = status || 'placed';
    return STATUS_DEFS.findIndex((s) => s.id === statusValue);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <FiPackage size={48} className="text-brand-gold" />
          </div>
          <p className="text-white">{t('track.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <FiPackage size={48} className="text-brand-gold" />
          </div>
          <p className="text-white">{t('track.fetchingOrders')}</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-brand-dark pt-32 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-16 text-center border border-dashed border-white/10"
          >
            <FiPackage size={48} className="mx-auto text-white/20 mb-4" />
            <h2 className="font-bold text-2xl mb-2">{t('track.emptyTitle')}</h2>
            <p className="text-white/60 mb-8">{t('track.emptyBody')}</p>
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => navigate('/menu')}
                className="bg-brand-red hover:bg-red-600 text-white px-8 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-brand-red/20"
              >
                {t('track.browse')} 🍗
              </button>
              <button
                type="button"
                onClick={fetchUserOrders}
                disabled={retrying}
                className="bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-2xl font-bold text-sm transition-all border border-white/20 disabled:opacity-50"
              >
                {retrying ? t('track.refreshing') : t('track.refreshOrders')}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const currentOrder = selectedOrder;
  const currentStatusIndex = currentOrder
    ? getStatusIndex(currentOrder.order_status || currentOrder.status)
    : -1;

  return (
    <div className="min-h-screen bg-brand-dark pt-32 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-5xl font-black text-white mb-2">{t('track.title')}</h1>
          <p className="text-white/60">{t('track.subtitle')}</p>
        </motion.div>

        <div className="mb-8">
          <h2 className="text-white font-bold mb-4">{t('track.yourOrders')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {orders.map((order) => (
              <motion.button
                key={order.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedOrder(order)}
                className={`p-4 rounded-xl border-2 transition-all text-start ${
                  selectedOrder?.id === order.id
                    ? 'bg-brand-red/20 border-brand-red text-brand-red'
                    : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10'
                }`}
              >
                <div className="font-bold">{order.order_number}</div>
                <div className="text-sm text-white/60">
                  {new Date(order.created_at).toLocaleDateString(locale)}
                </div>
                <div className="text-xs mt-1 capitalize">
                  {t(`track.${order.order_status || order.status || 'placed'}`)}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {currentOrder && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="glass rounded-[2rem] p-8 border border-white/5">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">
                      {t('track.orderNumberLabel')}
                    </p>
                    <h2 className="font-display text-3xl font-black text-brand-gold">{currentOrder.order_number}</h2>
                  </div>
                  <div className="text-end">
                    <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">
                      {t('track.orderTotalLabel')}
                    </p>
                    <p className="text-2xl font-bold text-brand-gold">
                      {t('common.egp')} {currentOrder.total}
                    </p>
                  </div>
                </div>

                {currentStatusIndex !== -1 && (
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-3">
                      {t('track.currentStatusLabel')}
                    </p>
                    <div className="inline-block bg-brand-red/20 border border-brand-red text-brand-red px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-wide">
                      {trackingStatuses[currentStatusIndex]?.label}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="space-y-4">
                {trackingStatuses.map((status, idx) => {
                  const isCompleted = idx < currentStatusIndex;
                  const isCurrent = idx === currentStatusIndex;

                  return (
                    <motion.div
                      key={status.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative"
                    >
                      {idx < trackingStatuses.length - 1 && (
                        <div
                          className={`absolute start-7 top-16 w-1 h-12 ${
                            isCompleted || isCurrent ? 'bg-green-500' : 'bg-white/10'
                          }`}
                        />
                      )}

                      <div className="flex gap-6 items-start relative z-10">
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-lg transition-all ${
                            isCompleted
                              ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                              : isCurrent
                                ? 'bg-brand-red text-white shadow-lg shadow-brand-red/50 scale-110'
                                : 'bg-white/10 text-white/40 border border-white/20'
                          }`}
                        >
                          {isCompleted ? <FiCheck /> : STATUS_DEFS[idx].icon}
                        </div>

                        <div className="flex-1 py-2">
                          <h4
                            className={`font-bold transition-all ${
                              isCompleted || isCurrent ? 'text-white text-lg' : 'text-white/60'
                            }`}
                          >
                            {status.label}
                          </h4>
                          {isCurrent && <p className="text-white/40 text-sm mt-1">{t('track.stageHint')}</p>}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="glass rounded-[2rem] p-8 border border-white/5">
              <h3 className="font-bold text-lg mb-4 uppercase">{t('track.orderInfo')}</h3>
              <div className="space-y-3">
                {currentOrder.customer_name && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">{t('track.customerName')}</span>
                    <span className="font-bold">{currentOrder.customer_name}</span>
                  </div>
                )}
                {currentOrder.order_type && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">{t('track.deliveryType')}</span>
                    <span className="font-bold capitalize">{currentOrder.order_type}</span>
                  </div>
                )}
                {currentOrder.created_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">{t('track.orderDate')}</span>
                    <span className="font-bold">
                      {new Date(currentOrder.created_at).toLocaleDateString(locale)}
                    </span>
                  </div>
                )}
                {currentOrder.estimated_delivery && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">{t('track.estimatedDelivery')}</span>
                    <span className="font-bold">
                      {new Date(currentOrder.estimated_delivery).toLocaleString(locale)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchUserOrders}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/20 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <FiArrowRight size={18} />
              {t('track.refreshStatus')}
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
