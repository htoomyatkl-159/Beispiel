import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import type { PageResult } from '../lib/api';

export function Pagination({ meta, onPage }: { meta: PageResult['meta']; onPage: (page: number) => void }) {
  const { t } = useTranslation();
  const from = meta.total === 0 ? 0 : Math.min((meta.page - 1) * meta.limit + 1, meta.total);
  return <nav className="pagination" aria-label="Pagination">
    <span>{t('showing', { from, to: Math.min(meta.page * meta.limit, meta.total), total: meta.total })}</span>
    <div><Button variant="ghost" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} aria-label={t('previous')}><ArrowLeft /></Button>
      <span>{t('page', { page: meta.page, total: Math.max(1, Math.ceil(meta.total / meta.limit)) })}</span>
      <Button variant="ghost" disabled={!meta.hasNext} onClick={() => onPage(meta.page + 1)} aria-label={t('next')}><ArrowRight /></Button></div>
  </nav>;
}
