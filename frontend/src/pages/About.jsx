import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiAward, FiUsers, FiHeart, FiStar } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const VALUE_ICONS = [<FiAward />, <FiHeart />, <FiUsers />, <FiStar />];

export default function About() {
  const { t } = useTranslation();
  const valuesList = t('about.valuesList', { returnObjects: true }) || [];
  const teamList = t('about.teamList', { returnObjects: true }) || [];
  const timelineList = t('about.timelineList', { returnObjects: true }) || [];

  const stats = [
    { val: '50K+', labelKey: 'about.statHappy', emoji: '😊' },
    { val: '15+', labelKey: 'about.statFlavour', emoji: '🏆' },
    { val: '8', labelKey: 'about.statBranches', emoji: '📍' },
    { val: '200+', labelKey: 'about.statTeam', emoji: '👥' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304555/shop_aays3q.jpg"
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-dark via-brand-dark/80 to-brand-dark" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <p className="section-subtitle mb-4">{t('about.subtitle')}</p>
            <h1 className="section-title text-5xl md:text-6xl mb-6 leading-tight">
              {t('about.title1')}
              <br />
              <span className="text-gradient">{t('about.title2')}</span>
            </h1>
            <p className="text-white/60 text-xl leading-relaxed max-w-2xl mx-auto">{t('about.intro')}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.labelKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-4xl mb-2">{stat.emoji}</div>
                <div className="font-display text-4xl font-black text-brand-gold">{stat.val}</div>
                <div className="text-white/50 text-sm mt-1">{t(stat.labelKey)}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="section-subtitle mb-3">{t('about.valuesSubtitle')}</p>
          <h2 className="section-title">{t('about.valuesTitle')}</h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {valuesList.map((v, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card p-6 text-center hover:border-brand-gold/40"
            >
              <div className="text-brand-gold text-3xl mb-4 flex justify-center">{VALUE_ICONS[i]}</div>
              <h3 className="font-display font-bold text-white text-xl mb-3">{v.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-20 bg-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="section-subtitle mb-3">{t('about.journeySubtitle')}</p>
            <h2 className="section-title">{t('about.journeyTitle')}</h2>
          </motion.div>
          <div className="relative">
            <div className="absolute start-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-red via-brand-gold to-transparent" />
            {timelineList.map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex gap-6 mb-8 relative"
              >
                <div className="w-16 flex-shrink-0 flex items-start pt-1">
                  <div className="w-4 h-4 bg-brand-gold rounded-full ring-4 ring-brand-dark ms-6" />
                </div>
                <div className="flex-1 pb-2">
                  <span className="text-brand-gold font-bold text-lg font-display">{row.year}</span>
                  <p className="text-white/70 mt-1 leading-relaxed">{row.event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="section-subtitle mb-3">{t('about.teamSubtitle')}</p>
          <h2 className="section-title">{t('about.teamTitle')}</h2>
        </motion.div>
        <div className="grid sm:grid-cols-3 gap-8">
          {teamList.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="card p-8 text-center hover:border-brand-gold/40"
            >
              <div className="text-6xl mb-4">{member.emoji}</div>
              <h3 className="font-display font-bold text-white text-xl">{member.name}</h3>
              <p className="text-brand-gold text-sm mt-1">{member.role}</p>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-white/60 mb-6">{t('about.ctaTitle')}</p>
          <Link to="/order" className="btn-primary inline-flex items-center gap-2">
            {t('about.ctaBtn')}
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
