import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Compass } from '@phosphor-icons/react';
import { useAuth } from '../auth/AuthProvider';
import { ApiError } from '../lib/api';
import { BeispielMark } from '../components/BrandMark';

export function Login() {
  const { login } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(''); try { await login(email, password); const next = new URLSearchParams(location.search).get('next'); navigate(next?.startsWith('/') ? next : '/'); } catch (err) { setError(err instanceof ApiError ? err.message : 'We could not sign you in. Please check your details and try again.'); } finally { setBusy(false); } }
  return <section className="auth-page"><div className="auth-showcase"><Link to="/" className="auth-brand"><BeispielMark width={38} height={38} /><span>Beispiel</span></Link><div><p className="eyebrow"><Compass size={16} /> Discover music differently</p><h1>Find sounds that feel like <em>you.</em></h1><p>Save your discoveries today. Your personal recommendations grow with every choice.</p></div><span className="auth-showcase-foot">DISCOVER MUSIC BEYOND THE ORDINARY</span></div><div className="auth-card"><div className="auth-card-heading"><p className="eyebrow">Welcome back</p><h2>Continue your discovery</h2><p>Sign in to see your saved feedback and recommendations.</p></div><form onSubmit={submit}><label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" /></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Enter your password" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="auth-submit" disabled={busy}>{busy ? 'Signing you in…' : 'Sign in'}<ArrowRight size={18} /></button></form><p className="auth-switch">New to Beispiel? <Link to="/register">Create a free account</Link></p></div></section>;
}
