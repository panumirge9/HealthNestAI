import { useState, useEffect } from 'react';
import { insuranceApi } from '../lib/api';
import { Spinner, ErrorBox, EmptyState } from '../components/UIKit';

import {
  Shield,
  Plus,
  FileText,
  Calendar,
  IndianRupee,
  Trash2
} from "lucide-react";

export default function Insurance() {
  const [data, setData] = useState({ insurance: null, claims: [], summary: null });
  const [loading, setLoading] = useState(true);
  const [addingIns, setAddingIns] = useState(false);
  const [addingClaim, setAddingClaim] = useState(false);
  const [error, setError] = useState(null);

  const [insForm, setInsForm] = useState({
    provider: '',
    plan_name: '',
    policy_number: '',
    deductible: '',
    copay: '',
    out_of_pocket_max: '',
    expiry_date: ''
  });

  const [claimForm, setClaimForm] = useState({
    description: '',
    date: new Date().toISOString().split('T')[0],
    amount_billed: '',
    amount_covered: '',
    status: 'pending'
  });

  const fetchIns = async () => {
    try {
      const res = await insuranceApi.get();
      setData(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIns();
  }, []);

  const saveInsurance = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await insuranceApi.create({
        ...insForm,
        deductible: Number(insForm.deductible || 0),
        copay: Number(insForm.copay || 0),
        out_of_pocket_max: Number(insForm.out_of_pocket_max || 0)
      });
      setAddingIns(false);
      await fetchIns();
    } catch (e) {
      setError(e.message);
    }
  };

  const saveClaim = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await insuranceApi.addClaim(data.insurance.id, {
        ...claimForm,
        amount_billed: Number(claimForm.amount_billed || 0),
        amount_covered: Number(claimForm.amount_covered || 0)
      });

      setAddingClaim(false);
      setClaimForm({
        description: '',
        date: new Date().toISOString().split('T')[0],
        amount_billed: '',
        amount_covered: '',
        status: 'pending'
      });

      await fetchIns();
    } catch (e) {
      setError(e.message);
    }
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800',
      approved: 'bg-emerald-100 text-emerald-800',
      denied: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800'
    }[status] || 'bg-neutral-100 text-neutral-800';

    return (
      <span className={`text-[10px] font-semibold uppercase px-2 py-1 rounded-md ${styles}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return <div className="py-10 text-center"><Spinner /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Shield size={20} />
          Insurance & Claims
        </h1>
        <p className="text-sm text-neutral-500">
          Manage your policy and track expenses.
        </p>
      </div>

      <ErrorBox message={error} />

      {/* EMPTY STATE */}
      {!data.insurance && !addingIns ? (
        <EmptyState
          icon={<Shield size={28} />}
          title="No insurance policy"
          subtitle="Add your policy to track claims and coverage."
          action={
            <button onClick={() => setAddingIns(true)} className="btn-primary mt-4 flex items-center gap-2">
              <Plus size={14} />
              Add Insurance
            </button>
          }
        />
      ) : addingIns ? (

        /* FORM */
        <form onSubmit={saveInsurance} className="card p-6 mb-8">

          <h3 className="font-bold mb-4">Policy Details</h3>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <input className="input" placeholder="Provider" value={insForm.provider} onChange={e => setInsForm({...insForm, provider: e.target.value})}/>
            <input className="input" placeholder="Plan Name" value={insForm.plan_name} onChange={e => setInsForm({...insForm, plan_name: e.target.value})}/>
            <input className="input" placeholder="Policy Number" value={insForm.policy_number} onChange={e => setInsForm({...insForm, policy_number: e.target.value})}/>
            <input type="date" className="input" value={insForm.expiry_date} onChange={e => setInsForm({...insForm, expiry_date: e.target.value})}/>
          </div>

          <h3 className="font-bold mb-4 mt-6">Coverage</h3>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <input type="number" className="input" placeholder="Deductible" value={insForm.deductible} onChange={e => setInsForm({...insForm, deductible: e.target.value})}/>
            <input type="number" className="input" placeholder="Out of Pocket Max" value={insForm.out_of_pocket_max} onChange={e => setInsForm({...insForm, out_of_pocket_max: e.target.value})}/>
            <input type="number" className="input" placeholder="Copay" value={insForm.copay} onChange={e => setInsForm({...insForm, copay: e.target.value})}/>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setAddingIns(false)} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Save Policy
            </button>
          </div>

        </form>

      ) : (

        <>
          {/* POLICY CARD */}
          <div className="card p-6 mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">

            <div className="flex items-center gap-3 mb-4">
              <Shield size={20} className="text-blue-600" />
              <div>
                <h2 className="text-lg font-bold text-blue-900">
                  {data.insurance.provider}
                </h2>
                <p className="text-sm text-blue-700">
                  {data.insurance.plan_name}
                </p>
              </div>
            </div>

            <p className="text-xs text-blue-600 mb-4">
              Policy: {data.insurance.policy_number}
            </p>

            {/* Deductible */}
            <div className="bg-white p-4 rounded-xl">
              <div className="flex justify-between text-xs mb-2 font-medium">
                <span>₹{data.insurance.deductible_met}</span>
                <span>₹{data.insurance.deductible}</span>
              </div>

              <div className="h-2 bg-neutral-100 rounded-full">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${data.summary?.deductible_pct || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* CLAIMS */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <FileText size={18} />
              Claims
            </h2>

            {!addingClaim && (
              <button onClick={() => setAddingClaim(true)} className="text-sm text-blue-600 flex items-center gap-1">
                <Plus size={14} />
                Add Claim
              </button>
            )}
          </div>

          {/* CLAIM FORM */}
          {addingClaim && (
            <form onSubmit={saveClaim} className="card p-5 mb-4 border-dashed border">

              <input className="input mb-3" placeholder="Description" value={claimForm.description} onChange={e => setClaimForm({...claimForm, description: e.target.value})}/>

              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <input type="date" className="input" value={claimForm.date} onChange={e => setClaimForm({...claimForm, date: e.target.value})}/>
                <select className="input" value={claimForm.status} onChange={e => setClaimForm({...claimForm, status: e.target.value})}>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <input type="number" className="input" placeholder="Amount Billed" value={claimForm.amount_billed} onChange={e => setClaimForm({...claimForm, amount_billed: e.target.value})}/>
                <input type="number" className="input" placeholder="Amount Covered" value={claimForm.amount_covered} onChange={e => setClaimForm({...claimForm, amount_covered: e.target.value})}/>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setAddingClaim(false)} className="btn-ghost flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Save Claim
                </button>
              </div>

            </form>
          )}

          {/* CLAIM LIST */}
          <div className="space-y-3">
            {data.claims.map(c => (
              <div key={c.id} className="card p-4 flex justify-between items-center">

                <div>
                  <h4 className="font-semibold text-neutral-900">{c.description}</h4>

                  <div className="text-xs text-neutral-500 flex items-center gap-2 mt-1">
                    <Calendar size={12} />
                    {c.date}
                  </div>

                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="flex items-center gap-1">
                      <IndianRupee size={12} />
                      {c.amount_billed}
                    </span>

                    <span className="text-emerald-600">
                      Covered: ₹{c.amount_covered}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <StatusBadge status={c.status} />
                </div>

              </div>
            ))}
          </div>

        </>
      )}
    </div>
  );
}