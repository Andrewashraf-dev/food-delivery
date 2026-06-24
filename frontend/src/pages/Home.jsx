import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiStar, FiClock, FiTruck } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../hooks/useApi';
import MenuCard from '../components/MenuCard';
import ReviewsSlider from '../components/ReviewsSlider';

const SHOP_IMAGE =
  'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304555/shop_aays3q.jpg';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay },
});

export default function Home() {
  const { t, i18n } = useTranslation();
  const [featured, setFeatured] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState(false);

  useEffect(() => {
    setFeaturedLoading(true);
    setFeaturedError(false);
    api
      .get('/menu', { params: { featured: true } })
      .then((res) => setFeatured(res.data.data?.slice(0, 4) || []))
      .catch(() => setFeaturedError(true))
      .finally(() => setFeaturedLoading(false));
  }, [i18n.language]);

  const features = [
    { icon: <FiTruck />, titleKey: 'home.featFastTitle', descKey: 'home.featFastDesc' },
    { icon: <FiStar />, titleKey: 'home.featQualityTitle', descKey: 'home.featQualityDesc' },
    { icon: <FiClock />, titleKey: 'home.featLateTitle', descKey: 'home.featLateDesc' },
    { icon: '💳', titleKey: 'home.featPayTitle', descKey: 'home.featPayDesc' },
  ];

  return (
    <div className="overflow-hidden">
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img
            src="https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1776464070/Gemini_Generated_Image_lf0sqglf0sqglf0s_t4b4yi.png"
            alt="Fresco Fried Chicken"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/80 to-brand-dark/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent" />
        </div>

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute top-20 end-10 w-64 h-64 border border-brand-gold/10 rounded-full hidden lg:block"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-32 end-20 w-40 h-40 border border-brand-red/20 rounded-full hidden lg:block"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <div className="max-w-2xl">
            <motion.div {...fadeUp(0.1)}>
              <span className="inline-flex items-center gap-2 bg-brand-gold/20 border border-brand-gold/30 text-brand-gold text-sm font-semibold px-4 py-2 rounded-full mb-6">
                🔥 {t('home.heroBadge')}
              </span>
            </motion.div>

            <motion.h1 {...fadeUp(0.2)} className="font-display text-6xl sm:text-7xl md:text-8xl font-black text-white leading-[0.9] mb-6">
              {t('home.heroTitle1')}{' '}
              <span className="text-gradient">{t('home.heroTitle2')}</span>{' '}
              {t('home.heroTitle3')}
            </motion.h1>

            <motion.p {...fadeUp(0.35)} className="text-white/70 text-xl leading-relaxed mb-8 max-w-lg">
              {t('home.heroSubtitle')}
            </motion.p>

            <motion.div {...fadeUp(0.5)} className="flex flex-wrap gap-4">
              <Link to="/order" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
                {t('home.orderNow')} <FiArrowRight />
              </Link>
              <Link to="/menu" className="btn-secondary flex items-center gap-2 text-lg px-8 py-4">
                {t('home.viewMenu')}
              </Link>
            </motion.div>

            <motion.div {...fadeUp(0.65)} className="flex flex-wrap gap-8 mt-12">
              {[
                { val: '50K+', labelKey: 'home.statCustomers' },
                { val: '4.9★', labelKey: 'home.statRating' },
                { val: '30 min', labelKey: 'home.statDelivery' },
              ].map((stat) => (
                <div key={stat.labelKey}>
                  <div className="text-3xl font-display font-black text-brand-gold">{stat.val}</div>
                  <div className="text-white/50 text-sm">{t(stat.labelKey)}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 start-1/2 -translate-x-1/2 text-white/40"
        >
          ↓
        </motion.div>
      </section>

      <section className="bg-brand-red/10 border-y border-brand-red/20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.titleKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="text-brand-gold text-2xl">{f.icon}</div>
                <div>
                  <div className="font-bold text-white text-sm">{t(f.titleKey)}</div>
                  <div className="text-white/50 text-xs">{t(f.descKey)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="section-subtitle mb-3">{t('home.favSubtitle')}</p>
          <h2 className="section-title">{t('home.favTitle')}</h2>
          <p className="text-white/50 mt-4 max-w-lg mx-auto">{t('home.favDesc')}</p>
        </motion.div>

        {featuredLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card h-72 animate-pulse bg-white/5 rounded-2xl" />
            ))}
          </div>
        ) : featuredError ? (
          <div className="text-center py-12">
            <p className="text-white/40 text-lg mb-4">⚠️ {t('home.favLoadError')}</p>
            <Link to="/menu" className="btn-secondary text-sm">
              {t('home.browseMenu')}
            </Link>
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/40 text-lg mb-4">{t('home.favEmpty')}</p>
            <Link to="/menu" className="btn-secondary text-sm">
              {t('home.browseMenu')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((item, i) => (
              <MenuCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link to="/menu" className="btn-secondary inline-flex items-center gap-2">
            {t('home.viewFullMenu')} <FiArrowRight />
          </Link>
        </div>
      </section>

      <section className="py-20 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img
                src={SHOP_IMAGE}
                alt="Our kitchen"
                className="rounded-3xl w-full h-96 object-cover shadow-2xl"
              />
              <div className="absolute -bottom-6 -end-6 bg-brand-gold text-brand-dark p-5 rounded-2xl shadow-xl font-bold text-center">
                <div className="font-display text-3xl font-black">7+</div>
                <div className="text-sm">{t('home.storyYears')}</div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="section-subtitle mb-4">{t('home.storySubtitle')}</p>
              <h2 className="section-title mb-6 leading-tight">
                {t('home.storyTitleLine1')}
                <br />
                <span className="text-gradient">{t('home.storyTitleLine2')}</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-6">{t('home.storyP1')}</p>
              <p className="text-white/60 leading-relaxed mb-8">{t('home.storyP2')}</p>
              <Link to="/about" className="btn-primary inline-flex items-center gap-2">
                {t('home.storyCta')} <FiArrowRight />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <ReviewsSlider />

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center relative overflow-hidden bg-gradient-to-r from-brand-red to-brand-orange rounded-3xl p-12"
        >
          <div className="absolute inset-0 bg-noise opacity-50" />
          <div className="relative z-10">
            <p className="text-white/80 font-semibold uppercase tracking-widest text-sm mb-4">{t('home.ctaBadge')}</p>
            <h2 className="font-display text-5xl font-black text-white mb-4">{t('home.ctaTitle')}</h2>
            <p className="text-white/80 text-lg mb-8">
              {t('home.ctaCode', { code: 'FRESCO1' })}
            </p>
            <Link to="/order" className="bg-white text-brand-red font-bold text-lg px-10 py-4 rounded-full hover:bg-brand-cream transition-colors inline-flex items-center gap-2">
              {t('home.ctaOrder')} <FiArrowRight />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
