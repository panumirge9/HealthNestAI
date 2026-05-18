import { useState, useEffect } from 'react';
import { labApi } from '../lib/api';
import { Spinner, ErrorBox, EmptyState } from '../components/UIKit';

import {
  FlaskConical,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  BrainCircuit
} from "lucide-react";

export default function LabResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    test_name: '',
    test_date: new Date().toISOString().split('T')[0],
    lab_name: '',
    items: [{ name: '', value: '', unit: '', normal_min: '', normal_max: '' }]
  });

  const fetchResults = async () => {
    try {
      const { data } = await labApi.list();
      setResults(data.results || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...form,
        results: form.items.map(i => ({
          ...i,
          value: parseFloat(i.value) || 0,
          normal_min: i.normal_min ? parseFloat(i.normal_min) : null,
          normal_max: i.normal_max ? parseFloat(i.normal_max) : null,
        }))
      };

      await labApi.create(payload);

      setAdding(false);
      setForm({
        test_name: '',
        test_date: new Date().toISOString().split('T')[0],
        lab_name: '',
        items: [{ name: '', value: '', unit: '', normal_min: '', normal_max: '' }]
      });

      await fetchResults();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    await labApi.delete(id);
    fetchResults();
  };

  if (loading) {
    return <div className="py-10 text-center"><Spinner /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <FlaskConical size={20} />
            Lab Results
          </h1>
          <p className="text-sm text-neutral-500">
            Track biomarkers and get AI insights.
          </p>
        </div>

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Add Report
          </button>
        )}
      </div>

      <ErrorBox message={error} />

      {/* Form */}
      {adding && (
        <form className="card p-6 mb-8" onSubmit={save}>
          
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <input
              required
              value={form.test_name}
              onChange={e => setForm({ ...form, test_name: e.target.value })}
              className="input"
              placeholder="Test Name"
            />
            <input
              type="date"
              required
              value={form.test_date}
              onChange={e => setForm({ ...form, test_date: e.target.value })}
              className="input"
            />
          </div>

          {/* Items */}
          <div className="space-y-3 mb-4">
            {form.items.map((item, i) => (
              <div key={i} className="flex gap-2 flex-wrap bg-neutral-50 p-2 rounded-xl border">
                
                <input
                  required
                  value={item.name}
                  onChange={e => {
                    const items = [...form.items];
                    items[i].name = e.target.value;
                    setForm({ ...form, items });
                  }}
                  className="input flex-1 min-w-[120px]"
                  placeholder="Item"
                />

                <input
                  type="number"
                  value={item.value}
                  onChange={e => {
                    const items = [...form.items];
                    items[i].value = e.target.value;
                    setForm({ ...form, items });
                  }}
                  className="input w-24"
                  placeholder="Value"
                />

                <input
                  value={item.unit}
                  onChange={e => {
                    const items = [...form.items];
                    items[i].unit = e.target.value;
                    setForm({ ...form, items });
                  }}
                  className="input w-20"
                  placeholder="Unit"
                />

                <input
                  type="number"
                  value={item.normal_min}
                  onChange={e => {
                    const items = [...form.items];
                    items[i].normal_min = e.target.value;
                    setForm({ ...form, items });
                  }}
                  className="input w-20"
                  placeholder="Min"
                />

                <input
                  type="number"
                  value={item.normal_max}
                  onChange={e => {
                    const items = [...form.items];
                    items[i].normal_max = e.target.value;
                    setForm({ ...form, items });
                  }}
                  className="input w-20"
                  placeholder="Max"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setForm(f => ({
                  ...f,
                  items: [...f.items, { name: '', value: '', unit: '', normal_min: '', normal_max: '' }]
                }))
              }
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              + Add Item
            </button>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setAdding(false)} className="btn-ghost flex-1">
              Cancel
            </button>

            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? <Spinner size={14} /> : 'Save & Analyze'}
            </button>
          </div>
        </form>
      )}

      {/* Empty */}
      {results.length === 0 && !adding ? (
        <EmptyState
          icon={<FlaskConical size={28} />}
          title="No lab results"
          subtitle="Add tests to track your health insights."
        />
      ) : (

        <div className="space-y-4">
          {results.map(r => (
            <div key={r.id} className="card overflow-hidden">

              {/* Header */}
              <div className="p-5 flex justify-between bg-neutral-50 border-b">
                <div>
                  <h3 className="font-bold text-lg text-neutral-900">
                    {r.test_name}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {r.test_date} {r.lab_name && `· ${r.lab_name}`}
                  </p>
                </div>

                <button onClick={() => del(r.id)} className="text-neutral-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Table */}
              <div className="p-5">
                <table className="w-full text-sm">
                  <tbody>
                    {r.results.map((item, i) => (
                      <tr key={i} className="border-b last:border-0">
                        
                        <td className="py-2 font-medium text-neutral-800">
                          {item.name}
                        </td>

                        <td className="py-2 text-right font-bold">
                          {item.value} <span className="text-xs text-neutral-500">{item.unit}</span>
                        </td>

                        <td className="py-2 text-right text-neutral-500 text-xs">
                          {item.normal_min ?? '-'} – {item.normal_max ?? '-'}
                        </td>

                        <td className="py-2 text-center">
                          {item.status === 'normal' && <CheckCircle2 size={16} className="text-emerald-600 mx-auto" />}
                          {item.status === 'low' && <ArrowDown size={16} className="text-blue-600 mx-auto" />}
                          {item.status === 'high' && <ArrowUp size={16} className="text-red-600 mx-auto" />}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* AI */}
                {r.ai_summary && (
                  <div className="mt-5 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2 text-emerald-800 font-semibold text-xs uppercase">
                      <BrainCircuit size={16} />
                      AI Interpretation
                    </div>
                    <p className="text-sm text-emerald-900">
                      {r.ai_summary}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}