import { useState, useEffect } from 'react';
import { goalsApi } from '../lib/api';
import { Spinner, ErrorBox, EmptyState } from '../components/UIKit';

import {
  Target,
  Footprints,
  Moon,
  Droplets,
  Scale,
  Flame,
  Plus,
  Trash2,
  X
} from "lucide-react";

const GOAL_CONFIG = {
  weight: { icon: Scale, color: '#f59e0b', bg: '#fffbeb' },
  steps: { icon: Footprints, color: '#16a34a', bg: '#f0fdf4' },
  sleep: { icon: Moon, color: '#8b5cf6', bg: '#f5f3ff' },
  hydration: { icon: Droplets, color: '#3b82f6', bg: '#eff6ff' },
  custom: { icon: Target, color: '#ec4899', bg: '#fdf2f8' },
};

const PRESETS = [
  { category: 'steps', title: 'Daily Steps', target_value: 10000, current_value: 0, unit: 'steps' },
  { category: 'sleep', title: 'Sleep Hours', target_value: 8, current_value: 0, unit: 'hrs' },
  { category: 'hydration', title: 'Water Intake', target_value: 8, current_value: 0, unit: 'glasses' },
];

export default function HealthGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [logging, setLogging] = useState(null);
  const [logValue, setLogValue] = useState('');
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    category: 'steps',
    title: '',
    target_value: '',
    current_value: '0',
    unit: '',
    start_date: new Date().toISOString().split('T')[0],
    target_date: ''
  });

  const fetchGoals = async () => {
    try {
      const { data } = await goalsApi.list();
      setGoals(data.goals || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const saveGoal = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await goalsApi.create({
        ...form,
        target_value: Number(form.target_value),
        current_value: Number(form.current_value)
      });
      setAdding(false);
      await fetchGoals();
    } catch (e) {
      setError(e.message);
    }
  };

  const logProgress = async (id) => {
    if (!logValue) return;
    try {
      await goalsApi.log(id, {
        value: Number(logValue),
        logged_date: new Date().toISOString().split('T')[0],
        note: ''
      });
      setLogging(null);
      setLogValue('');
      await fetchGoals();
    } catch (e) {
      alert(e.message);
    }
  };

  const del = async (id) => {
    if (!window.confirm("Delete goal?")) return;
    await goalsApi.delete(id);
    fetchGoals();
  };

  const loadPreset = (p) => setForm({ ...form, ...p });

  if (loading) {
    return <div className="py-10 text-center"><Spinner /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Target size={20} />
            Health Goals
          </h1>
          <p className="text-sm text-neutral-500">
            Track your daily habits and progress.
          </p>
        </div>

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            New Goal
          </button>
        )}
      </div>

      <ErrorBox message={error} />

      {/* Form */}
      {adding && (
        <div className="card p-6 mb-8">

          {/* Presets */}
          <div className="flex flex-wrap gap-2 mb-6">
            {PRESETS.map(p => {
              const Icon = GOAL_CONFIG[p.category].icon;
              return (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => loadPreset(p)}
                  className="chip flex items-center gap-1 bg-neutral-50"
                >
                  <Icon size={14} />
                  {p.title}
                </button>
              );
            })}
          </div>

          <form onSubmit={saveGoal} className="space-y-4">

            <div className="grid sm:grid-cols-2 gap-4">
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="input"
              >
                {Object.keys(GOAL_CONFIG).map(k => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>

              <input
                required
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="input"
                placeholder="Goal title"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <input type="number" value={form.target_value} onChange={e => setForm({ ...form, target_value: e.target.value })} className="input" placeholder="Target" />
              <input type="number" value={form.current_value} onChange={e => setForm({ ...form, current_value: e.target.value })} className="input" placeholder="Start" />
              <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="input" placeholder="Unit" />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setAdding(false)} className="btn-ghost flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1">
                Create Goal
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Empty */}
      {goals.length === 0 && !adding ? (
        <EmptyState
          icon={<Target size={28} />}
          title="No goals yet"
          subtitle="Create your first goal to start tracking."
        />
      ) : (

        <div className="grid sm:grid-cols-2 gap-4">
          {goals.map(g => {
            const conf = GOAL_CONFIG[g.category] || GOAL_CONFIG.custom;
            const Icon = conf.icon;

            return (
              <div key={g.id} className="card p-5 relative group hover:shadow-lg transition">

                <button
                  onClick={() => del(g.id)}
                  className="absolute top-3 right-3 text-neutral-300 hover:text-red-500 hidden group-hover:block"
                >
                  <Trash2 size={16} />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: conf.bg }}>
                    <Icon size={18} color={conf.color} />
                  </div>

                  <div>
                    <h3 className="font-bold text-neutral-900">{g.title}</h3>
                    <div className="text-xs text-orange-500 flex items-center gap-1">
                      <Flame size={12} />
                      {g.streak_days} day streak
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1 font-medium" style={{ color: conf.color }}>
                    <span>{g.current_value} / {g.target_value} {g.unit}</span>
                    <span>{g.progress_pct}%</span>
                  </div>

                  <div className="h-2 bg-neutral-100 rounded-full">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, g.progress_pct)}%`, backgroundColor: conf.color }}
                    />
                  </div>
                </div>

                {/* Logging */}
                {logging === g.id ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={logValue}
                      onChange={e => setLogValue(e.target.value)}
                      className="input flex-1"
                      placeholder="Enter value"
                    />
                    <button onClick={() => logProgress(g.id)} className="btn-primary px-3">
                      Save
                    </button>
                    <button onClick={() => setLogging(null)} className="btn-ghost px-2">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setLogging(g.id)}
                    className="w-full py-2 rounded-xl text-xs font-semibold"
                    style={{ background: conf.bg, color: conf.color }}
                  >
                    Log Progress
                  </button>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}