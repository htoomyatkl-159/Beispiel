import { ArrowUpRight } from '@phosphor-icons/react';
import { DiscoveryGlyph } from './BrandMark';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { duration, type Track } from '../lib/api';

export function TrackCard({ track, index, featured = false }: { track: Track; index: number; featured?: boolean }) {
  const { t } = useTranslation();
  if (featured) return <Link to={`/tracks/${track.id}`} className={`track-card color-${index % 4}`} aria-label={t('openSong', { title: track.title })}>
    <div className="type-tile" aria-hidden="true">
      <span className="tile-genre">{track.genre}</span><DiscoveryGlyph seed={track.sourceTrackId} />
      <span className="tile-number">{String(index + 1).padStart(2, '0')}</span>
      <span className="tile-label">CATALOG / TEXT</span>
      <span className="tile-arrow"><ArrowUpRight size={20} /></span>
    </div>
    <div className="card-copy"><h3>{track.title}</h3><p>{track.artistsText}</p></div>
  </Link>;
  return <Link to={`/tracks/${track.id}`} className="track-row" aria-label={t('openSong', { title: track.title })}>
    <span className="row-index">{String(index + 1).padStart(2, '0')}</span>
    <span className="row-title"><span className={`row-glyph color-${index % 4}`} aria-hidden="true"><DiscoveryGlyph seed={track.sourceTrackId} width={26} height={26} /></span>
      <span><strong>{track.title}</strong><span className="mobile-artist">{track.artistsText}</span></span>
    </span>
    <span className="row-artist">{track.artistsText}</span>
    <span className="genre-pill">{track.genre}</span>
    <span className="row-duration">{duration(track.durationMs)}</span>
    <ArrowUpRight className="row-arrow" size={18} aria-hidden="true" />
  </Link>;
}

export function TrackList({ tracks, offset = 0 }: { tracks: Track[]; offset?: number }) {
  const { t } = useTranslation();
  return <div className="track-list">
    <div className="list-head" aria-hidden="true"><span>#</span><span>{t('title')}</span><span>{t('artist')}</span><span>{t('genre')}</span><span>{t('duration')}</span><span /></div>
    {tracks.map((track, index) => <TrackCard track={track} index={offset + index} key={track.id} />)}
  </div>;
}
