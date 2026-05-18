import { useState, useEffect } from 'react';
import { emergencyApi } from '../lib/api';
import { Spinner, ErrorBox } from '../components/UIKit';

/* Clean Icon System */
const Icon = {
  shield: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path d="M12 3l8 4v5c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7l8-4z" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
      <path d="M12 21s-7-4.5-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.5-9 9-9 9z" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
      <path d="M6 7h12M9 7V4h6v3M8 7v12h8V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
};

export default function EmergencyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    blood_type: '',
    allergies: [],
    conditions: [],
    medications: [],
    emergency_contacts: [],
    organ_donor: false,
    notes: '',
    _allergyInput: '',
    _contactName: '',
    _contactPhone: '',
    _contactRel: ''
  });

  const fetchProfile = async () => {
    try {
      const { data } = await emergencyApi.get();
      if (data.profile) {
        setProfile(data.profile);
        setForm(f => ({
          ...f,
          ...data.profile,
          _allergyInput: '',
          _contactName: '',
          _contactPhone: '',
          _contactRel: ''
        }));
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await emergencyApi.upsert(form);
      await fetchProfile();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const addTag = (field, inputField) => {
    if (!form[inputField].trim()) return;
    setForm(f => ({
      ...f,
      [field]: [...f[field], f[inputField].trim()],
      [inputField]: ''
    }));
  };

  const removeTag = (field, index) => {
    setForm(f => ({
      ...f,
      [field]: f[field].filter((_, i) => i !== index)
    }));
  };

  const addContact = () => {
    if (!form._contactName || !form._contactPhone) return;
    const newContact = {
      name: form._contactName,
      relationship: form._contactRel,
      phone: form._contactPhone
    };
    setForm(f => ({
      ...f,
      emergency_contacts: [...f.emergency_contacts, newContact],
      _contactName: '',
      _contactPhone: '',
      _contactRel: ''
    }));
  };

  if (loading) return <div className="py-10 text-center"><Spinner /></div>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
          {Icon.shield}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Emergency Profile</h1>
          <p className="text-sm text-stone-500">Critical health information for emergencies</p>
        </div>
      </div>

      <ErrorBox message={error} />

      <form onSubmit={save} className="space-y-6">

        {/* BASIC INFO */}
        <div className="card p-6 space-y-4 border border-stone-200 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Blood Type</label>
              <select
                value={form.blood_type}
                onChange={e => setForm({...form, blood_type: e.target.value})}
                className="input"
              >
                <option value="">Select...</option>
                {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.organ_donor}
                  onChange={e => setForm({...form, organ_donor: e.target.checked})}
                  className="w-5 h-5 text-emerald-600 rounded"
                />
                <span className="text-sm font-semibold text-stone-700 flex items-center gap-1">
                  {Icon.heart} Organ Donor
                </span>
              </label>
            </div>
          </div>

          {/* ALLERGIES */}
          <div>
            <label className="label">Allergies</label>
            <div className="flex gap-2">
              <input
                value={form._allergyInput}
                onChange={e => setForm({...form, _allergyInput: e.target.value})}
                className="input"
                placeholder="e.g. Penicillin"
              />
              <button
                type="button"
                onClick={() => addTag('allergies', '_allergyInput')}
                className="btn-ghost flex items-center gap-1 px-4"
              >
                {Icon.plus} Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {form.allergies.map((a, i) => (
                <span key={i} className="px-3 py-1 text-xs rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-2">
                  {a}
                  <button onClick={() => removeTag('allergies', i)}>{Icon.trash}</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* CONTACTS */}
        <div className="card p-6 border border-stone-200 shadow-sm">
          <h3 className="font-bold text-stone-900 mb-4">Emergency Contacts</h3>

          <div className="grid sm:grid-cols-3 gap-2 mb-3">
            <input value={form._contactName}
              onChange={e => setForm({...form, _contactName: e.target.value})}
              className="input" placeholder="Name" />

            <input value={form._contactRel}
              onChange={e => setForm({...form, _contactRel: e.target.value})}
              className="input" placeholder="Relation" />

            <div className="flex gap-2">
              <input value={form._contactPhone}
                onChange={e => setForm({...form, _contactPhone: e.target.value})}
                className="input flex-1" placeholder="Phone" />
              <button onClick={addContact} type="button" className="btn-ghost px-3">
                {Icon.plus}
              </button>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            {form.emergency_contacts.map((c, i) => (
              <div key={i} className="flex justify-between items-center bg-stone-50 border border-stone-200 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  {Icon.user}
                  <div>
                    <div className="font-semibold text-sm">{c.name}</div>
                    <div className="text-xs text-stone-500">{c.relationship}</div>
                    <div className="text-xs text-stone-600 font-mono">{c.phone}</div>
                  </div>
                </div>
                <button onClick={() => removeTag('emergency_contacts', i)}>{Icon.trash}</button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full py-3">
          {saving ? <Spinner size={16} /> : 'Save Emergency Profile'}
        </button>

      </form>
    </div>
  );
}