import { useEffect, useState } from 'react';
import { medicinesApi } from '../lib/api';
import { Spinner, ErrorBox, EmptyState } from '../components/UIKit';

/* Clean Icon System */
const Icon = {
  pill: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path d="M4 14l6-6a4 4 0 115.657 5.657l-6 6A4 4 0 014 14z" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
      <path d="M6 7h12M9 7V4h6v3M8 7v12h8V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MedicineReminder() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: '',
    dosage: '',
    times: ['08:00'],
    days_of_week: [0,1,2,3,4,5,6],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: '',
  });

  const fetch = async () => {
    try {
      const { data } = await medicinesApi.list();
      setReminders(data.reminders || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const addTime = () => setForm(f => ({ ...f, times: [...f.times, '12:00'] }));
  const removeTime = i => setForm(f => ({ ...f, times: f.times.filter((_, idx) => idx !== i) }));

  const toggleDay = d => setForm(f => ({
    ...f,
    days_of_week: f.days_of_week.includes(d)
      ? f.days_of_week.filter(x => x !== d)
      : [...f.days_of_week, d]
  }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = { ...form, end_date: form.end_date || null };
      await medicinesApi.create(payload);
      setAdding(false);
      setForm({
        name: '',
        dosage: '',
        times: ['08:00'],
        days_of_week: [0,1,2,3,4,5,6],
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        notes: '',
      });
      fetch();
    } catch (e) { setError(e.message); }
  };

  const del = async (id) => {
    if (!confirm('Delete this reminder?')) return;
    await medicinesApi.delete(id);
    fetch();
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in">
      
      {/* HEADER */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            {Icon.pill}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Medicine Reminders</h1>
            <p className="text-sm text-stone-500">Manage your daily medications</p>
          </div>
        </div>

        {!adding && (
          <button onClick={() => setAdding(true)} className="btn-primary flex items-center gap-2">
            {Icon.plus} Add
          </button>
        )}
      </header>

      {/* FORM */}
      {adding && (
        <form onSubmit={submit} className="card p-5 mb-6 space-y-4 border border-stone-200 shadow-sm">
          <h3 className="font-semibold text-stone-900">New Reminder</h3>

          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="input" placeholder="Medicine Name" required />
            <input value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })}
              className="input" placeholder="Dosage (500mg)" />
          </div>

          {/* TIMES */}
          <div>
            <label className="label">Times</label>
            {form.times.map((t, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input type="time" value={t}
                  onChange={e => {
                    const ts = [...form.times];
                    ts[i] = e.target.value;
                    setForm({ ...form, times: ts });
                  }}
                  className="input flex-1"
                />
                {form.times.length > 1 && (
                  <button type="button" onClick={() => removeTime(i)} className="text-red-500">
                    {Icon.trash}
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addTime}
              className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              {Icon.plus} Add time
            </button>
          </div>

          {/* DAYS */}
          <div>
            <label className="label">Days</label>
            <div className="flex gap-1.5">
              {DAYS.map((d, i) => (
                <button key={d} type="button" onClick={() => toggleDay(i)}
                  className={`w-9 h-9 rounded-lg text-xs font-semibold transition ${
                    form.days_of_week.includes(i)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-100 text-stone-500'
                  }`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.start_date}
              onChange={e => setForm({ ...form, start_date: e.target.value })}
              className="input" required />
            <input type="date" value={form.end_date}
              onChange={e => setForm({ ...form, end_date: e.target.value })}
              className="input" />
          </div>

          <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            className="input" placeholder="Notes (optional)" />

          <ErrorBox message={error} />

          <div className="flex gap-3">
            <button type="button" onClick={() => setAdding(false)} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Save
            </button>
          </div>
        </form>
      )}

      {/* CONTENT */}
      {loading ? (
        <div className="text-center py-10"><Spinner /></div>
      ) : reminders.length === 0 ? (
        <EmptyState title="No reminders yet" subtitle="Add your first medicine reminder." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {reminders.map(r => (
            <div key={r.id} className="card p-4 flex justify-between items-start border hover:shadow-md transition">
              
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  {Icon.pill}
                </div>

                <div>
                  <div className="font-semibold text-stone-900">{r.name}</div>
                  {r.dosage && <div className="text-xs text-stone-500">{r.dosage}</div>}

                  <div className="flex gap-2 mt-2 flex-wrap">
                    {r.times.map(t => (
                      <span key={t} className="text-xs px-2 py-1 rounded-md bg-stone-100 flex items-center gap-1">
                        {Icon.clock} {t}
                      </span>
                    ))}
                  </div>

                  <div className="text-[11px] text-stone-400 mt-2">
                    {r.days_of_week.map(d => DAYS[d]).join(' • ')}
                  </div>
                </div>
              </div>

              <button onClick={() => del(r.id)} className="text-stone-400 hover:text-red-500">
                {Icon.trash}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}