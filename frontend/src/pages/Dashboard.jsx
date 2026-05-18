import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Disclaimer } from '../components/UIKit';

// ✅ Lucide Icons (install: npm install lucide-react)
import {
  Activity,
  FileText,
  Target,
  HeartPulse,
  FlaskConical,
  Shield,
  Pill,
  Siren
} from "lucide-react";

const ACTIONS = [
  {
    to: '/app/symptoms',
    title: 'Symptom Analysis',
    desc: 'AI-powered structured assessment',
    icon: <Activity className="w-6 h-6" />,
    color: '#059669',
    accent: '#d1fae5',
    primary: true,
  },
  {
    to: '/app/report',
    title: 'Health Report',
    desc: 'Get your 0-100 health score',
    icon: <FileText className="w-6 h-6" />,
    color: '#2563eb',
    accent: '#dbeafe',
  },
  {
    to: '/app/goals',
    title: 'Health Goals',
    desc: 'Track fitness & daily habits',
    icon: <Target className="w-6 h-6" />,
    color: '#ea580c',
    accent: '#ffedd5',
  },
  {
    to: '/app/medical',
    title: 'Medical History',
    desc: 'Log conditions & surgeries',
    icon: <HeartPulse className="w-6 h-6" />,
    color: '#7c3aed',
    accent: '#ede9fe',
  },
  {
    to: '/app/labs',
    title: 'Lab Results',
    desc: 'Track & get AI summaries',
    icon: <FlaskConical className="w-6 h-6" />,
    color: '#0284c7',
    accent: '#e0f2fe',
  },
  {
    to: '/app/insurance',
    title: 'Insurance',
    desc: 'Manage policies & bills',
    icon: <Shield className="w-6 h-6" />,
    color: '#4f46e5',
    accent: '#e0e7ff',
  },
  {
    to: '/app/medicines',
    title: 'Meds & Inventory',
    desc: 'Reminders & stock alerts',
    icon: <Pill className="w-6 h-6" />,
    color: '#d946ef',
    accent: '#fae8ff',
  },
  {
    to: '/app/emergency',
    title: 'Emergency Profile',
    desc: 'Critical data & contacts',
    icon: <Siren className="w-6 h-6" />,
    color: '#e11d48',
    accent: '#ffe4e6',
  }
];

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();

  const hour = new Date().getHours();
  const greet =
    hour < 12
      ? 'Good morning'
      : hour < 17
      ? 'Good afternoon'
      : 'Good evening';

  const first = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in">
      
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-1">
          {greet}, {first}
        </h1>
        <p className="text-sm text-neutral-500">
          What would you like to do today?
        </p>
      </header>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {ACTIONS.map((a) => (
          <button
            key={a.to}
            onClick={() => nav(a.to)}
            className="
              card p-5 text-left relative overflow-hidden
              transition-all duration-300
              hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]
              active:scale-[0.98]
              group
            "
          >
            {/* Core Badge */}
            {a.primary && (
              <div className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Core
              </div>
            )}

            {/* Icon */}
            <div
              className="
                w-12 h-12 rounded-xl flex items-center justify-center mb-4
                transition-transform duration-300 group-hover:scale-110
              "
              style={{ background: a.accent, color: a.color }}
            >
              {a.icon}
            </div>

            {/* Title */}
            <h3 className="font-bold text-neutral-900 mb-1">
              {a.title}
            </h3>

            {/* Description */}
            <p className="text-xs text-neutral-500 leading-relaxed">
              {a.desc}
            </p>
          </button>
        ))}
      </div>

      {/* Disclaimer */}
      <Disclaimer text="HealthNestAI provides general wellness guidance only. Always consult a qualified healthcare professional for medical concerns." />
    </div>
  );
}