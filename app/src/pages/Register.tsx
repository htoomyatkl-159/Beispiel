import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkle } from '@phosphor-icons/react';
import { useAuth } from '../auth/AuthProvider';
import { ApiError } from '../lib/api';
import { BeispielMark } from '../components/BrandMark';

export function Register() {
  const { register } = useAuth(); const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(''); try { await register(email, password, displayName); navigate('/'); } catch (err) { setError(err instanceof ApiError ? err.message : 'We could not create your account. Please review your details and try again.'); } finally { setBusy(false); } }
  return <section className="auth-page"><div className="auth-showcase register-showcase"><Link to="/" className="auth-brand"><BeispielMark width={38} height={38} /><span>Beispiel</span></Link><div><p className="eyebrow"><Sparkle size={16} /> A better way to explore</p><h1>Your next favorite song is <em>out there.</em></h1><p>Create your free account and start building a clearer picture of your musical taste.</p></div><span className="auth-showcase-foot">FREE TO EXPLORE · METADATA ONLY</span></div><div className="auth-card"><div className="auth-card-heading"><p className="eyebrow">Join Beispiel</p><h2>Start discovering</h2><p>Set up your profile in less than a minute. No payment required.</p></div><form onSubmit={submit}><label>What should we call you?<input value={displayName} onChange={e => setDisplayName(e.target.value)} required maxLength={80} autoComplete="name" placeholder="Your display name" /></label><label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" /></label><label>Create a password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={12} autoComplete="new-password" placeholder="At least 12 characters" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="auth-submit" disabled={busy}>{busy ? 'Creating your account…' : 'Create free account'}<ArrowRight size={18} /></button></form><p className="auth-switch">Already have an account? <Link to="/login">Sign in instead</Link></p></div></section>;
}
