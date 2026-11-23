import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Info, Sparkle } from '@phosphor-icons/react';
import { DiscoveryGlyph } from '../components/BrandMark';
import { useTranslation } from 'react-i18next';
import { ApiError, catalog, duration, recommendations } from '../lib/api';
import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { Button } from '../components/ui/button';

export function TrackDetail() {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const query = useQuery({ queryKey: ['track', id], queryFn: ({ signal }) => catalog.track(id, signal) });
  const similar = useQuery({ queryKey: ['similar', id], queryFn: ({ signal }) => recommendations.similar(id, 5, signal), enabled: false });
  if (query.isPending) return <div className="page"><LoadingState /></div>;
  if (query.isError) return <div className="page">{query.error instanceof ApiError && query.error.status === 404
    ? <section className="page-state"><DiscoveryGlyph width={40} height={40} /><h1>{t('songNotFound')}</h1><p>{t('songNotFoundText')}</p><Link className="button-link button-primary" to="/search">{t('backToCatalog')}</Link></section>
    : <ErrorState error={query.error} retry={() => void query.refetch()} />}</div>;
  const track = query.data.data;
  return <div className="page detail-page">
    <Link className="text-action back-link" to="/search"><ArrowLeft size={17} />{t('backToCatalog')}</Link>
    <section className="detail-hero">
      <div className="detail-placeholder"><span className="eyebrow">{track.genre}</span><DiscoveryGlyph seed={track.sourceTrackId} /><span>{t('noArtwork')}</span></div>
      <div className="detail-heading"><p className="eyebrow">{t('songDetails')}</p><h1>{track.title}</h1><p className="detail-artist">{t('by')} <Link to={`/search?${new URLSearchParams({ q: track.artistsText, type: 'artist' })}`}>{track.artistsText}</Link></p><div className="detail-tags"><span className="genre-pill">{track.genre}</span><span>{duration(track.durationMs)}</span>{track.explicit && <span className="explicit-marker">E</span>}</div><div className="detail-actions"><Link className="button-link button-primary" to={`/search?${new URLSearchParams({ q: track.artistsText, type: 'artist' })}`}>{t('exploreArtist')}<ArrowUpRight size={17} /></Link><Button variant="outline" onClick={() => void similar.refetch()} disabled={similar.isFetching}><Sparkle />{similar.isFetching ? t('findingSimilar') : t('findSimilar')}</Button></div></div>
    </section>
    {similar.isError ? <ErrorState error={similar.error} retry={() => void similar.refetch()} /> : similar.data && (similar.data.data.length ? <section className="similar-panel"><div className="section-heading"><div><p className="eyebrow">{t('recommendationEyebrow')}</p><h2>{t('similarSongs')}</h2></div><span>{t('recommendationModel')}</span></div><div className="similar-grid">{similar.data.data.map((item) => <Link className="similar-card" to={`/tracks/${item.track.id}`} key={item.track.id}><DiscoveryGlyph seed={item.track.sourceTrackId} /><div><strong>{item.track.title}</strong><span>{item.track.artistsText}</span><small>{t('similarityScore', { score: Math.round(item.similarity * 100) })}</small></div></Link>)}</div></section> : <EmptyState />)}
    <div className="detail-content"><section className="metadata-panel"><h2>{t('songDetails')}</h2><dl>
      <div><dt>{t('album')}</dt><dd>{track.albumName || t('notProvided')}</dd></div>
      <div><dt>{t('genre')}</dt><dd>{track.genre}</dd></div>
      <div><dt>{t('duration')}</dt><dd>{track.durationMs === null ? t('notProvided') : duration(track.durationMs)}</dd></div>
      <div><dt>{t('contentLabel')}</dt><dd>{t(track.explicit ? 'explicit' : 'noExplicitFlag')}</dd></div>
      <div><dt>{t('sourcePopularity')}</dt><dd>{track.popularity === null ? t('notProvided') : `${track.popularity} / 100`}<small>{t('popularityNote')}</small></dd></div>
      <div><dt>{t('sourceId')}</dt><dd className="mono">{track.sourceTrackId}</dd></div>
      <div><dt>{t('catalogVersion')}</dt><dd className="mono">{track.catalogVersion}</dd></div>
    </dl></section><aside className="honesty-note"><span className="state-icon"><Info size={25} /></span><h2>{t('noPlaybackTitle')}</h2><p>{t('noPlaybackText')}</p></aside></div>
  </div>;
}
