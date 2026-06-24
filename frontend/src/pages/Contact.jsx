import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPhone, FiMail, FiMapPin, FiFacebook, FiInstagram, FiSend, FiClock } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import api from '../hooks/useApi';
import toast from 'react-hot-toast';

export default function Contact() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contact', form);
      setSent(true);
      toast.success(t('contact.toastOk'));
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setSent(true);
      toast.success(t('contact.toastDemo'));
    } finally {
      setLoading(false);
    }
  };

  const topicOptions = [
    { value: 'Order Issue', label: t('contact.topicOrder') },
    { value: 'Feedback', label: t('contact.topicFeedback') },
    { value: 'Catering', label: t('contact.topicCatering') },
    { value: 'Partnership', label: t('contact.topicPartner') },
    { value: 'Other', label: t('contact.topicOther') },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="py-16 text-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-red/10 to-transparent" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <p className="section-subtitle mb-3">{t('contact.subtitle')}</p>
          <h1 className="section-title text-5xl md:text-6xl mb-4">{t('contact.title')}</h1>
          <p className="text-white/50 max-w-md mx-auto">{t('contact.intro')}</p>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="glass rounded-3xl p-8">
              <h2 className="font-display text-2xl font-bold text-white mb-6">{t('contact.formTitle')}</h2>
              {sent ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="text-6xl mb-4">✉️</div>
                  <h3 className="font-display text-2xl font-bold text-white mb-3">{t('contact.sentTitle')}</h3>
                  <p className="text-white/60">{t('contact.sentBody')}</p>
                  <button type="button" onClick={() => setSent(false)} className="btn-secondary mt-6">
                    {t('contact.sendAnother')}
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">{t('contact.nameLabel')}</label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">{t('contact.emailLabel')}</label>
                      <input
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        type="email"
                        className="input-field"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">{t('contact.subjectLabel')}</label>
                    <select name="subject" value={form.subject} onChange={handleChange} className="input-field">
                      <option value="">{t('contact.subjectPlaceholder')}</option>
                      {topicOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">{t('contact.messageLabel')}</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={5}
                      placeholder={t('contact.placeholderMessage')}
                      className="input-field resize-none"
                      required
                      minLength={10}
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('contact.sending')}
                      </span>
                    ) : (
                      <>
                        <FiSend /> {t('contact.sendMessage')}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: <FiPhone />,
                  title: t('contact.cardPhone'),
                  lines: ['+20 22032316', '+20 10 21188509'],
                  href: 'tel:+201021188509',
                },
                {
                  icon: <FiMail />,
                  title: t('contact.cardEmail'),
                  lines: ['hello@frescoegypt.com', 'orders@frescoegypt.com'],
                  href: 'mailto:hello@frescoegypt.com',
                },
                {
                  icon: <FiMapPin />,
                  title: t('contact.cardBranch'),
                  lines: ['9 Shekoulany st. Shoubra , Cairo, Egypt, 11674'],
                  href: '#map',
                },
                {
                  icon: <FiClock />,
                  title: t('contact.cardHours'),
                  lines: ['Daily: 11AM – 1AM', 'Delivery until 1:30AM'],
                  href: null,
                },
              ].map((item, i) => (
                <motion.div key={i} whileHover={{ scale: 1.02 }} className="glass rounded-2xl p-5 cursor-default">
                  <div className="text-brand-gold text-xl mb-3">{item.icon}</div>
                  <h4 className="font-bold text-white text-sm mb-2">{item.title}</h4>
                  {item.lines.map((line, j) => (
                    <p key={j} className="text-white/60 text-sm">
                      {line}
                    </p>
                  ))}
                </motion.div>
              ))}
            </div>

            <div className="glass rounded-2xl p-6">
              <h4 className="font-bold text-white mb-4">{t('contact.followUs')}</h4>
              <div className="flex gap-3">
                {[
                  {
                    icon: <FiFacebook size={20} />,
                    href: 'https://www.facebook.com/FrescoFriedChicken/',
                    label: 'Facebook',
                    color: 'hover:bg-blue-600',
                  },
                  {
                    icon: <FiInstagram size={20} />,
                    href: 'https://www.instagram.com/frescofriedchicken/',
                    label: 'Instagram',
                    color: 'hover:bg-pink-600',
                  },
                ].map((s, i) => (
                  <a
                    key={i}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 bg-white/10 ${s.color} px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium`}
                  >
                    {s.icon} {s.label}
                  </a>
                ))}
              </div>
            </div>

            <div id="map" className="glass rounded-2xl overflow-hidden h-56 border border-white/5">
              <iframe
                title="Fresco Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3451.9867!2d31.2460!3d30.0825!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x145840660682245b%3A0xc39f201099e29f8a!2s9%20Ash%20Shekoulani%2C%20Shubra%2C%20Cairo%20Governorate!5e0!3m2!1sen!2seg!4v1711985000000!5m2!1sen!2seg"
                width="100%"
                height="100%"
                style={{
                  border: 0,
                  filter: 'invert(90%) hue-rotate(180deg) brightness(0.8) contrast(1.2)',
                }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
