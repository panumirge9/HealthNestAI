import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner, ErrorBox } from '../components/UIKit';
import Logo from '../components/Logo'; // NEW IMPORT

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault(); setError(null); setLoading(true);
    try { await login(form.email, form.password); nav('/app'); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8f8f6]">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <Logo className="w-12 h-12" />
          <span className="font-extrabold text-stone-900 text-2xl tracking-tight">HealthNestAI</span>
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-1 text-center">Welcome back</h1>
        <p className="text-sm text-stone-500 mb-6 text-center">Sign in to your account</p>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input" placeholder="you@example.com" required autoComplete="email" /></div>
          <div><label className="label">Password</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input" placeholder="••••••••" required autoComplete="current-password" /></div>
          <ErrorBox message={error} />
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">{loading ? <><Spinner size={14} /> Signing in…</> : 'Sign in'}</button>
        </form>
        <p className="mt-6 text-sm text-stone-500 text-center">Don't have an account? <Link to="/register" className="text-emerald-600 font-semibold hover:underline">Sign up</Link></p>
      </div>
    </div>
  );
}