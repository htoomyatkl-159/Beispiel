import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUpRight, ArrowRight } from '@phosphor-icons/react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { catalog, readPage } from '../lib/api';
import { TrackCard, TrackList } from '../components/TrackCard';
import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { Pagination } from '../components/Pagination';
import { BeispielMark } from '../components/BrandMark';

export function Home() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const page = readPage(params.get('page'));
  const query = useQuery({ queryKey: ['tracks', page, 12], queryFn: ({ signal }) => catalog.list(page, 12, signal) });
  return <div className="page home-page">
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow"><span className="tiny-line" />{t('heroEyebrow')}</p>
        <h1>{t('heroFirst')}<span>{t('heroSecond')}</span></h1><p className="hero-description">{t('heroText')}</p>
        <div className="hero-actions"><Link className="button-link button-primary" to="/search">{t('explore')}<ArrowRight size={18} /></Link><a href="#collection" className="text-action">{t('viewCatalog')}<ArrowDown size={16} /></a></div>
      </div>
      <div className="hero-visual"><div className="orbit" aria-hidden="true"><div className="orbit-inner"><BeispielMark className="hero-monogram" /></div><div className="orbit-line orbit-line-one" /><div className="orbit-line orbit-line-two" /></div>
        <span className="visual-caption">{t('discoveryIndex')}</span><div className="hero-stat"><strong>{query.data?.meta.total ?? '—'}</strong><span>{t('songsToDiscover')}</span></div>
      </div>
    </section>
    <section id="collection" className="collection-section">
      <div className="section-heading"><div><p className="eyebrow">{t('catalogEdition')}</p><h2>{t('catalogIntro')}</h2><p>{t('catalogText')}</p></div><Link className="text-action" to="/search">{t('viewAll')}<ArrowUpRight size={17} /></Link></div>
      {query.isPending ? <LoadingState /> : query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()} />
        : query.data.data.length === 0 ? <EmptyState reset={() => setParams({})} /> : <>
          <div className="featured-grid">{query.data.data.slice(0, 4).map((track, index) => <TrackCard track={track} index={index + (page - 1) * 12} key={track.id} featured />)}</div>
          <p className="artwork-disclosure">{t('noArtwork')}</p>
          <div className="list-section-heading"><h2>{t('listTitle')}</h2><span>{t('resultCount', { count: query.data.meta.total })}</span></div>
          <TrackList tracks={query.data.data} offset={(page - 1) * 12} />
          <Pagination meta={query.data.meta} onPage={(next) => { setParams({ page: String(next) }); document.getElementById('collection')?.scrollIntoView(); }} />
        </>}
    </section>
  </div>;
}
