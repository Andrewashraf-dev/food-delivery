import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLock, FiUser, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../context/AuthContext';

const DEV_ADMIN_EMAIL = 'admin@frescoegypt.com';
const DEV_ADMIN_PASSWORD = 'Admin@Fresco123';

export default function Login() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', identifier: '' });

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const user = await login(form.identifier, form.password);
        toast.success(t('login.toastSignedIn', { name: user.name }));
        navigate(user.role === 'admin' ? '/admin' : '/');
      } else {
        const user = await register({
          name: form.name,
          phone: form.identifier.trim(),
          password: form.password,
          email: form.email || undefined,
        });
        toast.success(t('login.toastRegistered', { name: user.name }));
        navigate('/');
      }
    } catch (err) {
      const data = err.response?.data;
      const firstValidation = Array.isArray(data?.errors) && data.errors[0]?.msg;
      toast.error(data?.message || firstValidation || data?.error || t('login.authFailed'));
    } finally {
      setLoading(false);
    }
  };

  const formSlideX = (loginMode) => {
    if (lang === 'ar') return loginMode ? 20 : -20;
    return loginMode ? -20 : 20;
  };

  return (
    <div
      className="min-h-screen pt-20 flex items-center justify-center px-4 py-12"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=1400&q=80"
          alt=""
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-brand-dark/90" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <img
              src="https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304555/fressco_logo_iju8bl.png"
              alt={t('login.logoAlt')}
              className="w-12 h-12 rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="text-start">
              <div className="font-display text-2xl font-black text-white">FRESCO</div>
              <div className="text-[10px] text-brand-gold tracking-widest">{t('login.brandTagline')}</div>
            </div>
          </Link>
        </div>

        <div className="glass rounded-3xl p-8 shadow-2xl">
          <div className="flex bg-white/5 rounded-xl p-1 mb-8">
            {[t('login.login'), t('login.register')].map((tab, i) => (
              <button
                key={tab}
                type="button"
                onClick={() => setIsLogin(i === 0)}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  (isLogin && i === 0) || (!isLogin && i === 1)
                    ? 'bg-brand-red text-white shadow-lg'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: formSlideX(isLogin) }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {!isLogin && (
                <div className="relative">
                  <FiUser className="absolute start-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={t('login.name')}
                    className="input-field ps-10"
                    required={!isLogin}
                  />
                </div>
              )}

              <div className="relative">
                <FiPhone className="absolute start-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  name="identifier"
                  value={form.identifier}
                  onChange={handleChange}
                  type="text"
                  placeholder={isLogin ? t('login.identifierPlaceholder') : t('login.phone')}
                  className="input-field ps-10"
                  required
                />
              </div>

              {!isLogin && (
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  type="email"
                  placeholder={t('checkout.email')}
                  className="input-field"
                />
              )}

              <div className="relative">
                <FiLock className="absolute start-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  type={showPass ? 'text' : 'password'}
                  placeholder={t('login.password')}
                  className="input-field ps-10 pe-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute end-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
                >
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('common.loading')}
                  </span>
                ) : isLogin ? (
                  t('login.submitLogin')
                ) : (
                  t('login.submitRegister')
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          <div className="mt-6 text-center">
            <p className="text-white/40 text-sm">
              {isLogin ? t('login.toggleToRegister') : t('login.toggleToLogin')}
            </p>
          </div>

          {isLogin && import.meta.env.DEV && (
            <div className="mt-4 p-3 bg-brand-gold/10 border border-brand-gold/20 rounded-xl text-center">
              <p className="text-white/50 text-xs">
                {t('login.devAdminHint', { email: DEV_ADMIN_EMAIL, password: DEV_ADMIN_PASSWORD })}
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-white/30 text-sm mt-6">
          <Link to="/" className="hover:text-white/60 transition-colors inline-flex items-center gap-1">
            <span aria-hidden>{lang === 'ar' ? '→' : '←'}</span>
            {t('login.backHome')}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
