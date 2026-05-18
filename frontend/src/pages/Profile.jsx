import { useEffect, useState } from 'react';
import { profileApi, planApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Spinner, ErrorBox } from '../components/UIKit';

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', age: '', gender: '', blood_group: '', allergies: '', existing_conditions: '' });
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([profileApi.get(), planApi.status()])
      .then(([p, s]) => {
        const stats = p.data.stats || {};
        setForm({
          name: p.data.user?.name || '',
          age: stats.age || '',
          gender: stats.gender || '',
          blood_group: stats.blood_group || '',
          allergies: stats.allergies || '',
          existing_conditions: stats.existing_conditions || '',
        });
        setUsage(s.data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null); setSuccess(false);
    try {
      const payload = { ...form, age: form.age ? Number(form.age) : null };
      Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null; });
      await profileApi.update(payload);
      setSuccess(true); setTimeout(() => setSuccess(false), 2500);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const upgrade = async (planType) => {
    if (!confirm(`Activate Pro Plan (${planType === 'yearly' ? '₹1499/year' : '₹199/month'})?\n\nIn production, this would open Razorpay checkout.`)) return;
    try {
      await planApi.upgrade({ plan_type: planType });
      const { data } = await planApi.status();
      setUsage(data);
      alert('✅ Pro plan activated!');
    } catch (e) { alert(e.message); }
  };

  if (loading) return <div className="text-center py-10"><Spinner /></div>;

  const isPro = usage?.plan === 'pro';

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile form */}
        <form onSubmit={save} className="card p-5 space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-stone-100">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', color: '#065f46' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-stone-900">{user?.name}</div>
              <div className="text-sm text-stone-500">{user?.email}</div>
            </div>
            {isPro && <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: 'linear-gradient(135deg,#fef9c3,#fde68a)', color: '#92400e' }}>⭐ PRO</span>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" /></div>
            <div><label className="label">Age</label><input type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} className="input" /></div>
            <div><label className="label">Gender</label><select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="input"><option value="">-</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
            <div><label className="label">Blood</label><select value={form.blood_group} onChange={e => setForm({...form, blood_group: e.target.value})} className="input"><option value="">-</option>{['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => <option key={b}>{b}</option>)}</select></div>
          </div>
          <div><label className="label">Allergies</label><input value={form.allergies} onChange={e => setForm({...form, allergies: e.target.value})} className="input" placeholder="e.g. penicillin" /></div>
          <div><label className="label">Existing conditions</label><input value={form.existing_conditions} onChange={e => setForm({...form, existing_conditions: e.target.value})} className="input" placeholder="e.g. diabetes" /></div>
          <ErrorBox message={error} />
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving…' : success ? '✓ Saved' : 'Save'}</button>
        </form>

        {/* Plan card */}
        <div className="space-y-4">
          {isPro ? (
            <div className="card p-5" style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}>
              <div className="text-3xl mb-2">⭐</div>
              <h3 className="font-bold text-green-900 text-lg">Pro Plan Active</h3>
              <p className="text-sm text-green-700 mt-1">Unlimited AI analyses, no daily limits.</p>
              {usage?.plan_expires && <p className="text-xs text-green-600 mt-2">Expires: {usage.plan_expires}</p>}
            </div>
          ) : (
            <>
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-stone-100">
                  <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Current Plan</div>
                  <div className="font-bold text-stone-900 text-lg">Free</div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold mb-3 flex items-center gap-1.5">
                    <span>⭐</span> Upgrade to Pro
                  </h3>
                  <button onClick={() => upgrade('monthly')} className="w-full mb-2 p-3 rounded-xl text-left transition-all hover:shadow border-2 border-emerald-200 hover:border-emerald-500 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-stone-900">₹199/month</div>
                        <div className="text-xs text-stone-500">Cancel anytime</div>
                      </div>
                      <div className="text-xs font-bold text-white px-3 py-1.5 rounded-lg bg-emerald-600">Subscribe</div>
                    </div>
                  </button>
                  <button onClick={() => upgrade('yearly')} className="w-full p-3 rounded-xl text-left transition-all hover:shadow border-2 border-emerald-500 relative" style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}>
                    <div className="absolute top-0 right-0 text-[9px] font-bold text-white px-2 py-0.5 rounded-bl-lg bg-emerald-600">SAVE 37%</div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-green-900">₹1499/year</div>
                        <div className="text-xs text-green-700">Best value</div>
                      </div>
                      <div className="text-xs font-bold text-white px-3 py-1.5 rounded-lg bg-emerald-600">Subscribe</div>
                    </div>
                  </button>
                </div>
              </div>

              {usage?.features && (
                <div className="card p-4">
                  <h4 className="font-semibold text-sm text-stone-900 mb-3">Today's usage</h4>
                  {Object.entries(usage.features).map(([key, val]) => {
                    const pct = (val.used / Math.max(1, val.limit)) * 100;
                    const color = val.remaining === 0 ? '#dc2626' : val.remaining <= 1 ? '#d97706' : '#16a34a';
                    return (
                      <div key={key} className="mb-2 last:mb-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-stone-600 capitalize">{key.replace('-', ' ')}</span>
                          <span className="font-bold tabular-nums" style={{ color }}>{val.used}/{val.limit}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f0f0ee' }}>
                          <div className="h-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
