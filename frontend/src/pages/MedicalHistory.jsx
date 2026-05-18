import { useState, useEffect } from 'react';
import { medicalApi } from '../lib/api';
import { Spinner, EmptyState } from '../components/UIKit';

import {
  HeartPulse,
  Scissors,
  Syringe,
  AlertTriangle,
  Building2,
  User,
  CheckCircle2,
  Trash2,
  Plus
} from "lucide-react";

const CATEGORIES = [
  { key: 'condition', label: 'Condition', icon: HeartPulse, color: 'text-red-600', bg: 'bg-red-100' },
  { key: 'surgery', label: 'Surgery', icon: Scissors, color: 'text-purple-600', bg: 'bg-purple-100' },
  { key: 'vaccination', label: 'Vaccine', icon: Syringe, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { key: 'allergy', label: 'Allergy', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
  { key: 'hospitalization', label: 'Hospital', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
];

export default function MedicalHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    category: 'condition',
    title: '',
    description: '',
    date_occurred: new Date().toISOString().split('T')[0],
    doctor: '',
    hospital: '',
    severity: 'moderate',
    resolved: false
  });

  const fetchRecords = async () => {
    try {
      const { data } = await medicalApi.list();
      setRecords(data.records || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await medicalApi.create(form);
      setAdding(false);
      setForm({
        category: 'condition',
        title: '',
        description: '',
        date_occurred: new Date().toISOString().split('T')[0],
        doctor: '',
        hospital: '',
        severity: 'moderate',
        resolved: false
      });
      fetchRecords();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm("Delete record?")) return;
    await medicalApi.delete(id);
    fetchRecords();
  };

  if (loading) {
    return (
      <div className="py-10 text-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">
          Medical History
        </h1>

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Add Record
          </button>
        )}
      </div>

      {/* Form */}
      {adding && (
        <form onSubmit={save} className="card p-6 mb-8">

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input"
              >
                {CATEGORIES.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Date</label>
              <input
                type="date"
                required
                value={form.date_occurred}
                onChange={(e) => setForm({ ...form, date_occurred: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="label">Title / Diagnosis</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
            />
          </div>

          <div className="mb-4">
            <label className="label">Notes</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input min-h-[80px]"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <input
              value={form.doctor}
              onChange={(e) => setForm({ ...form, doctor: e.target.value })}
              className="input"
              placeholder="Doctor"
            />
            <input
              value={form.hospital}
              onChange={(e) => setForm({ ...form, hospital: e.target.value })}
              className="input"
              placeholder="Hospital"
            />
          </div>

          <div className="flex items-center gap-2 mb-6">
            <input
              type="checkbox"
              checked={form.resolved}
              onChange={(e) => setForm({ ...form, resolved: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-sm text-neutral-700">
              Issue resolved
            </span>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1"
            >
              {saving ? <Spinner size={14} /> : 'Save Record'}
            </button>
          </div>
        </form>
      )}

      {/* Empty State */}
      {records.length === 0 && !adding ? (
        <EmptyState
          icon={<HeartPulse size={28} />}
          title="No medical history"
          subtitle="Keep track of conditions, surgeries, and allergies."
        />
      ) : (

        <div className="space-y-3">
          {records.map(r => {
            const cat = CATEGORIES.find(c => c.key === r.category) || CATEGORIES[0];
            const Icon = cat.icon;

            return (
              <div
                key={r.id}
                className="card p-4 flex gap-4 items-start transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.bg}`}>
                  <Icon size={20} className={cat.color} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-bold text-neutral-900 text-lg">
                      {r.title}
                    </h3>

                    <button
                      onClick={() => del(r.id)}
                      className="text-neutral-300 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className={`text-xs font-semibold ${cat.color} mb-2`}>
                    {cat.label} · {r.date_occurred}
                  </div>

                  {r.description && (
                    <p className="text-sm text-neutral-600 mb-2">
                      {r.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
                    {r.doctor && (
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {r.doctor}
                      </span>
                    )}

                    {r.hospital && (
                      <span className="flex items-center gap-1">
                        <Building2 size={14} />
                        {r.hospital}
                      </span>
                    )}

                    {r.resolved && (
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <CheckCircle2 size={14} />
                        Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}