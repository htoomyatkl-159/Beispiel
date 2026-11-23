import { useTranslation } from 'react-i18next';
import { ArrowClockwise, MagnifyingGlass, WarningCircle } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { ApiError } from '../lib/api';
import { Link } from 'react-router-dom';

export function LoadingState() {
  const { t } = useTranslation();
  return <div className="catalog-loading" role="status" aria-label={t('loading')}>
    <span className="sr-only">{t('loading')}</span>
    {Array.from({ length: 6 }, (_, index) => <div className="skeleton-row" key={index}><span /><span /><span /></div>)}
  </div>;
}

export function ErrorState({ error, retry }: { error?: unknown; retry: () => void }) {
  const { t } = useTranslation();
  return <section className="page-state" role="alert">
    <span className="state-icon"><WarningCircle size={27} /></span>
    <h2>{t('errorTitle')}</h2><p>{t('errorText')}</p>
    <Button variant="outline" onClick={retry}><ArrowClockwise />{t('retry')}</Button>
    {error instanceof ApiError && error.requestId && <small>{t('reference')}: {error.requestId}</small>}
  </section>;
}

export function EmptyState({ search = false, reset }: { search?: boolean; reset?: () => void }) {
  const { t } = useTranslation();
  return <section className="page-state">
    <span className="state-icon"><MagnifyingGlass size={27} /></span>
    <h2>{t(search ? 'emptyTitle' : 'emptyCatalog')}</h2>
    <p>{t(search ? 'emptyText' : 'emptyCatalogText')}</p>
    {reset ? <Button variant="outline" onClick={reset}>{t('resetSearch')}</Button>
      : <Link className="button-link button-outline" to="/search">{t('resetSearch')}</Link>}
  </section>;
}
