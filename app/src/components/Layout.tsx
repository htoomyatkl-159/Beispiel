import { Compass, MagnifyingGlass, Translate, ArrowUpRight, Sparkle, UsersThree, SquaresFour } from '@phosphor-icons/react';
import { BeispielMark } from './BrandMark';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Button } from './ui/button';
import { useAuth } from '../auth/AuthProvider';

export function Layout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuth();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [location.pathname]);
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">{t('skip')}</a>
    <aside className="sidebar">
      <Link to="/" className="brand" aria-label="Beispiel home"><span className="brand-icon"><BeispielMark width={33} height={33} /></span><span>Beispiel<span className="brand-subtitle">{t('brandSubtitle')}</span></span></Link>
      <nav aria-label={t('navigation')}>
        <NavLink to="/" end aria-label={t('discover')}><Compass size={22} /><span>{t('discover')}</span><span className="nav-active-dot" /></NavLink>
        <NavLink to="/search" aria-label={t('search')}><MagnifyingGlass size={22} /><span>{t('search')}</span><span className="nav-active-dot" /></NavLink><NavLink to="/for-you" aria-label="For you"><Sparkle size={22} /><span>For you</span><span className="nav-active-dot" /></NavLink><NavLink to="/search?type=artist" aria-label="Artists"><UsersThree size={22} /><span>Artists</span><span className="nav-active-dot" /></NavLink><NavLink to="/search" aria-label="Genres"><SquaresFour size={22} /><span>Genres</span><span className="nav-active-dot" /></NavLink>
      </nav>
      <div className="sidebar-note"><span className="eyebrow">{t('sidebarEyebrow')}</span><h2>{t('sidebarTitle')}</h2><p>{t('sidebarText')}</p><Link to="/search">{t('browse')}<ArrowUpRight size={17} /></Link></div>
      <div className="sidebar-bottom"><span className="status-dot" />{t('catalogEdition')}<span className="small-wordmark">B.</span></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><span className="desktop-label">{t('independent')}</span><span className="breadcrumb-slash">/</span><span>{location.pathname === '/' ? t('discover') : location.pathname === '/search' ? t('search') : t('track')}</span></div>
        <div className="topbar-actions"><span className="metadata-badge"><span />{t('metadataOnly')}</span>{user ? <><Link className="account-link" to="/profile">{user.displayName}</Link><Button variant="ghost" onClick={() => void logout()}>{t('signOut')}</Button></> : <><Link className="account-link" to="/login">{t('signIn')}</Link><Link className="account-link" to="/register">{t('register')}</Link></>}<Button variant="ghost" className="language-button" onClick={() => void i18n.changeLanguage(i18n.language === 'en' ? 'my' : 'en')} aria-label={t('language')}><Translate size={19} /><span>{i18n.language === 'en' ? 'မြန်မာ' : 'EN'}</span></Button></div>
      </header>
      <main id="main-content" tabIndex={-1}><Outlet /></main>
      <footer className="footer"><span><BeispielMark width={18} height={18} />{t('footer')}</span><span>{t('footerNote')}</span></footer>
    </div>
  </div>;
}
