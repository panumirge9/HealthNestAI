import { useState } from 'react';
import { reportApi } from '../lib/api';
import { Spinner, ErrorBox, Disclaimer } from '../components/UIKit';

const RISK_STYLE = {
  low:      { color: '#16a34a', bg: '#f0fdf4', label: 'Low risk' },
  moderate: { color: '#d97706', bg: '#fffbeb', label: 'Moderate' },
  high:     { color: '#ea580c', bg: '#fff7ed', label: 'High risk' },
  critical: { color: '#dc2626', bg: '#fef2f2', label: 'Critical' },
};

const STATUS_COLORS = {
  excellent: '#16a34a', good: '#65a30d', fair: '#d97706', poor: '#dc2626',
};

export default function HealthReport() {
  const [form, setForm] = useState({
    age: '', gender: 'not_specified', weight_kg: '', height_cm: '',
    systolic_bp: '', diastolic_bp: 80, sugar_mgdl: '',
    sleep_hours: '', water_glasses: '', exercise_days_per_week: 0, smoking: false,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const payload = {
        ...form,
        age: Number(form.age),
        weight_kg: Number(form.weight_kg),
        height_cm: Number(form.height_cm),
        systolic_bp: Number(form.systolic_bp),
        diastolic_bp: form.diastolic_bp ? Number(form.diastolic_bp) : 80,
        sugar_mgdl: form.sugar_mgdl ? Number(form.sugar_mgdl) : null,
        sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : null,
        water_glasses: form.water_glasses ? Number(form.water_glasses) : null,
        exercise_days_per_week: Number(form.exercise_days_per_week),
      };
      const { data } = await reportApi.generate(payload);
      setResult(data);
    } catch (e) {
      setError(e.message || 'Failed to generate report');
    } finally { setLoading(false); }
  };

  const risk = result ? RISK_STYLE[result.risk_level] : null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 mb-1">Health Report</h1>
        <p className="text-sm text-stone-500">Get your personalized health score with deep insights.</p>
      </header>

      {!result ? (
        <form onSubmit={submit} className="card p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Age *</label><input type="number" min={10} max={120} value={form.age} onChange={e => set('age', e.target.value)} className="input" required /></div>
            <div><label className="label">Gender</label><select value={form.gender} onChange={e => set('gender', e.target.value)} className="input"><option value="not_specified">Prefer not to say</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
            <div><label className="label">Weight (kg) *</label><input type="number" step="0.1" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} className="input" required /></div>
            <div><label className="label">Height (cm) *</label><input type="number" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} className="input" required /></div>
            <div><label className="label">Systolic BP *</label><input type="number" value={form.systolic_bp} onChange={e => set('systolic_bp', e.target.value)} className="input" placeholder="120" required /></div>
            <div><label className="label">Diastolic BP</label><input type="number" value={form.diastolic_bp} onChange={e => set('diastolic_bp', e.target.value)} className="input" placeholder="80" /></div>
            <div><label className="label">Blood sugar (mg/dL)</label><input type="number" value={form.sugar_mgdl} onChange={e => set('sugar_mgdl', e.target.value)} className="input" placeholder="optional" /></div>
            <div><label className="label">Sleep (hours/night)</label><input type="number" step="0.5" value={form.sleep_hours} onChange={e => set('sleep_hours', e.target.value)} className="input" placeholder="7.5" /></div>
            <div><label className="label">Water (glasses/day)</label><input type="number" value={form.water_glasses} onChange={e => set('water_glasses', e.target.value)} className="input" placeholder="8" /></div>
            <div><label className="label">Exercise days/week</label><input type="number" min={0} max={7} value={form.exercise_days_per_week} onChange={e => set('exercise_days_per_week', e.target.value)} className="input" /></div>
          </div>
          <div>
            <label className="label">Do you smoke?</label>
            <div className="flex gap-2">
              {[{ v: false, l: 'No' }, { v: true, l: 'Yes' }].map(o => (
                <button key={o.l} type="button" onClick={() => set('smoking', o.v)}
                  className={`px-6 py-2 rounded-xl text-sm font-medium border ${
                    form.smoking === o.v ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-stone-600 border-stone-300'
                  }`}>{o.l}</button>
              ))}
            </div>
          </div>
          <ErrorBox message={error} />
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? <><Spinner size={16} /> Generating report…</> : 'Generate Health Report →'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Score */}
          <div className="card p-6 text-center" style={{ background: risk.bg, borderColor: risk.color + '40' }}>
            <div className="text-7xl font-bold tabular-nums leading-none mb-2" style={{ color: risk.color, letterSpacing: '-0.05em' }}>
              {result.score}
            </div>
            <div className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: risk.color }}>
              Health Score · {risk.label}
            </div>
            <p className="text-sm text-stone-700 max-w-xl mx-auto">{result.summary}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-stone-900">{result.bmi}</div>
              <div className="text-xs text-stone-500 mt-1">BMI</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-stone-900">{result.insights.length}</div>
              <div className="text-xs text-stone-500 mt-1">Insights</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold" style={{ color: risk.color }}>{result.score}</div>
              <div className="text-xs text-stone-500 mt-1">Out of 100</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-stone-900 capitalize">{result.risk_level}</div>
              <div className="text-xs text-stone-500 mt-1">Risk Level</div>
            </div>
          </div>

          {/* Insights */}
          <div className="card p-5">
            <h3 className="font-bold text-stone-900 mb-3">Detailed Insights</h3>
            <div className="space-y-3">
              {result.insights.map((ins, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: '#f8f8f6' }}>
                  <div className="flex-shrink-0 w-1 self-stretch rounded-full" style={{ background: STATUS_COLORS[ins.status] }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-stone-900 capitalize">{ins.category.replace('_', ' ')}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: STATUS_COLORS[ins.status] + '20', color: STATUS_COLORS[ins.status] }}>
                        {ins.status}
                      </span>
                      <span className="text-xs text-stone-400 ml-auto">{ins.score}/100</span>
                    </div>
                    <p className="text-xs text-stone-600">{ins.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="card p-5">
            <h3 className="font-bold text-stone-900 mb-3">Recommendations</h3>
            <ol className="space-y-2">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-stone-700">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  {rec}
                </li>
              ))}
            </ol>
          </div>

          <Disclaimer />

          <button onClick={() => { setResult(null); setError(null); }} className="btn-ghost w-full">
            Generate New Report
          </button>
        </div>
      )}
    </div>
  );
}
