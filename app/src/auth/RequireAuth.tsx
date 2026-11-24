import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
export function RequireAuth() { const { user, loading } = useAuth(); const location = useLocation(); if (loading) return <div className="page-state"><p>Checking your session…</p></div>; return user ? <Outlet /> : <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />; }
