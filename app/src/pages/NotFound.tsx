import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass } from '@phosphor-icons/react';

export function NotFound({ unexpected = false }: { unexpected?: boolean }) {
  const { t } = useTranslation();
  return <div className="page"><section className="page-state route-state"><Compass size={45} weight="thin" /><span className="eyebrow">{unexpected ? 'ERROR' : '404'}</span><h1>{t(unexpected ? 'unexpectedTitle' : 'notFoundTitle')}</h1><p>{t(unexpected ? 'unexpectedText' : 'notFoundText')}</p><Link className="button-link button-primary" to="/">{t('home')}</Link></section></div>;
}
