import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../hooks/useApi';
import { FiFacebook, FiInstagram, FiPhone, FiMapPin } from 'react-icons/fi';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api
      .get('/menu')
      .then((res) => {
        const items = res.data.data || [];
        const uniqueCats = [...new Set(items.map((item) => item.category))];
        setCategories(uniqueCats);
      })
      .catch((err) => console.error('Could not load categories for footer', err));
  }, [i18n.language]);

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/menu', label: t('nav.menu') },
    { to: '/order', label: t('nav.orderNow') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];

  return (
    <footer className="bg-black/60 border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center mb-4 group">
              <img
                src="https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304555/fressco_logo_iju8bl.png"
                alt="fresco Logo"
                className="h-16 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </Link>
            <p className="text-white/60 text-sm leading-relaxed">{t('footer.tagline')}</p>
            <div className="flex gap-3 mt-5">
              {[
                { icon: <FiFacebook />, href: 'https://www.facebook.com/FrescoFriedChicken/' },
                { icon: <FiInstagram />, href: 'https://www.instagram.com/frescofriedchicken/' },
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-white/10 hover:bg-brand-red rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold text-brand-gold mb-5 text-lg">{t('footer.quickLinks')}</h4>
            <ul className="space-y-3">
              {links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-white/60 hover:text-brand-gold transition-colors text-sm"
                  >
                    → {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-brand-gold mb-5 text-lg">{t('footer.onMenu')}</h4>
            <ul className="space-y-3">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <li key={cat}>
                    <Link
                      to={`/menu?category=${cat}`}
                      className="text-white/60 hover:text-brand-gold transition-colors text-sm uppercase tracking-wide"
                    >
                      → {t(`categories.${cat}`, cat)}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-white/20 text-xs italic">{t('footer.loadingCats')}</li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-brand-gold mb-5 text-lg">{t('footer.getInTouch')}</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-white/60 text-sm">
                <FiMapPin className="text-brand-gold mt-0.5 shrink-0" />
                <span>{t('footer.address')}</span>
              </li>
              <li className="flex items-center gap-3 text-white/60 text-sm">
                <FiPhone className="text-brand-gold shrink-0" />
                <a
                  href="tel:+201021188509"
                  dir="ltr"
                  className="hover:text-brand-gold transition-colors inline-block [unicode-bidi:isolate]"
                >
                  +20 10 21188509
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/40 text-sm">
          © {new Date().getFullYear()} Andrew Ashraf. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}
