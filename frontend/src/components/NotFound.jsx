import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl mb-6">🍗</div>
      <h1 className="font-display text-6xl font-black text-white mb-4">{t('errors.notFound404')}</h1>
      <p className="text-white/60 text-xl mb-8">{t('errors.notFoundTitle')}</p>
      <Link to="/" className="btn-primary">
        {t('errors.goHome')}
      </Link>
    </div>
  );
}
