import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiMenu, FiX, FiUser, FiLogOut } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { items } = useCart();
  const { user, logout } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const itemCount = items.reduce((n, i) => n + i.quantity, 0);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const toggleLang = () => {
    const next = i18n.language?.startsWith('ar') ? 'en' : 'ar';
    i18n.changeLanguage(next);
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/menu', label: t('nav.menu') },
    { to: '/track-order', label: t('nav.track') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass shadow-2xl shadow-black/50' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-4">
          <Link to="/" className="flex items-center group">
            <img
              src="https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304555/fressco_logo_iju8bl.png"
              alt="fresco Logo"
              className="h-24 w-auto object-contain -my-6 group-hover:scale-105 transition-transform duration-300"
            />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link pb-1 ${location.pathname === link.to ? 'text-brand-gold after:w-full' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/order" className="relative p-2 hover:text-brand-gold transition-colors" aria-label="Cart">
              <FiShoppingCart size={22} />
              {itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-brand-red text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                >
                  {itemCount}
                </motion.span>
              )}
            </Link>

            <button
              type="button"
              onClick={toggleLang}
              className="hidden sm:inline-flex px-3 py-2 rounded-full border border-white/15 text-sm font-black text-white hover:border-brand-gold hover:text-brand-gold transition-colors"
            >
              {i18n.language?.startsWith('ar') ? t('nav.english') : t('nav.arabic')}
            </button>

            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-full px-3 py-2 transition-all"
                >
                  <FiUser size={16} />
                  <span className="text-sm hidden sm:inline">{user.name?.split(' ')[0]}</span>
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-brand-dark/95 py-2 text-white shadow-xl backdrop-blur-md z-50"
                    >
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-brand-gold hover:bg-white/10 transition-colors text-sm"
                        >
                          {t('nav.admin')}
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-white/80 hover:bg-white/10 hover:text-red-400 transition-colors w-full text-left text-sm"
                      >
                        <FiLogOut size={14} /> {t('nav.logout')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="hidden sm:flex btn-primary text-sm py-2">
                {t('nav.signIn')}
              </Link>
            )}

            <Link to="/order" className="btn-primary text-sm py-2 hidden sm:flex">
              {t('nav.orderNow')}
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 hover:text-brand-gold transition-colors"
            >
              {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 bg-brand-dark/95 text-white backdrop-blur-md"
          >
            <div className="px-4 py-4 flex flex-col gap-4">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-lg font-medium ${location.pathname === link.to ? 'text-brand-gold' : 'text-white/80'}`}
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  toggleLang();
                  setMenuOpen(false);
                }}
                className="text-left text-white/80 font-bold"
              >
                {i18n.language?.startsWith('ar') ? t('nav.english') : t('nav.arabic')}
              </button>
              <Link to="/order" className="btn-primary text-center mt-2">
                {t('nav.orderNow')} {itemCount > 0 && `(${itemCount})`}
              </Link>
              {!user && (
                <Link to="/login" className="btn-ghost text-center">
                  {t('nav.signIn')}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
