import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MagnifyingGlass, X, SpinnerGap } from '@phosphor-icons/react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { catalog, readPage } from '../lib/api';
import { Button } from '../components/ui/button';
import { TrackList } from '../components/TrackCard';
import { Pagination } from '../components/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../components/PageState';

export function Search() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const type = params.get('type') === 'artist' ? 'artist' : 'track';
  const page = readPage(params.get('page'));
  const [draft, setDraft] = useState(q);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => { setDraft(q); clearTimeout(timeout.current); }, [q]);
  useEffect(() => () => clearTimeout(timeout.current), []);
  function commit(value: string, nextType = type, replace = false) {
    clearTimeout(timeout.current);
    setParams({ ...(value.trim() ? { q: value.trim() } : {}), type: nextType }, { replace });
  }
  const query = useQuery({ queryKey: ['search', q, type, page], queryFn: ({ signal }) => catalog.search(q, type, page, signal) });
  return <div className="page search-page">
    <div className="search-intro"><p className="eyebrow">{t('searchEyebrow')}</p><h1>{t('searchTitle')}</h1><p>{t('searchText')}</p></div>
    <form className="search-form" onSubmit={(event) => { event.preventDefault(); commit(draft); }} role="search">
      <label className="sr-only" htmlFor="catalog-search">{t('searchLabel')}</label><MagnifyingGlass size={23} aria-hidden="true" />
      <input id="catalog-search" value={draft} placeholder={t('searchPlaceholder')} maxLength={200} autoComplete="off" onChange={(event) => {
        const value = event.target.value; setDraft(value); clearTimeout(timeout.current);
        timeout.current = setTimeout(() => commit(value, type, true), 300);
      }} />
      {draft && <Button variant="ghost" className="clear-button" type="button" aria-label={t('clearSearch')} onClick={() => { setDraft(''); commit(''); }}><X size={18} /></Button>}
      <Button type="submit">{t('search')}</Button>
    </form>
    <div className="search-options"><fieldset><legend className="sr-only">{t('searchBy')}</legend>
      <Button variant="ghost" aria-pressed={type === 'track'} onClick={() => commit(draft, 'track')}>{t('tracks')}</Button>
      <Button variant="ghost" aria-pressed={type === 'artist'} onClick={() => commit(draft, 'artist')}>{t('artists')}</Button>
    </fieldset><span className="search-status" aria-live="polite">{query.isFetching && <><SpinnerGap className="spin" size={16} />{t('updating')}</>}</span></div>
    <div className="search-results-heading"><h2>{q ? t('resultsFor', { query: q }) : t('allSongs')}</h2>{query.data && <span>{t('resultCount', { count: query.data.meta.total })}</span>}</div>
    {type === 'artist' && <p className="artist-search-note">{t('artistSearchNote')}</p>}
    {query.isPending ? <LoadingState /> : query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()} />
      : query.data.data.length === 0 ? <EmptyState search={Boolean(q)} reset={() => { setDraft(''); commit(''); }} />
        : <><TrackList tracks={query.data.data} offset={(page - 1) * 12} /><Pagination meta={query.data.meta} onPage={(next) => {
          const updated = new URLSearchParams(params); updated.set('page', String(next)); setParams(updated);
        }} /></>}
  </div>;
}
