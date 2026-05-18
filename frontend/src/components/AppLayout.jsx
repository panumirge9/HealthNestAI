import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import Logo from './Logo';

import {
  LayoutDashboard,
  Stethoscope,
  FileText,
  Target,
  Activity,
  FlaskConical,
  Shield,
  Pill,
  AlertTriangle,
  Menu
} from 'lucide-react';

/* =========================
   NAV CONFIG (Clean Icons)
========================= */
const NAV = [
  { to: '/app', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { to: '/app/symptoms', label: 'Symptom Check', icon: Stethoscope },
  { to: '/app/report', label: 'Health Report', icon: FileText },
  { to: '/app/goals', label: 'Health Goals', icon: Target },
  { to: '/app/medical', label: 'Medical History', icon: Activity },
  { to: '/app/labs', label: 'Lab Results', icon: FlaskConical },
  { to: '/app/insurance', label: 'Insurance', icon: Shield },
  { to: '/app/medicines', label: 'Medicines & Inventory', icon: Pill },
  { to: '/app/emergency', label: 'Emergency Profile', icon: AlertTriangle },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#f8fafc]">

      {/* =========================
         SIDEBAR
      ========================= */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-stone-200 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:flex flex-col ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-stone-100">
          <Logo className="w-9 h-9" />
          <span className="font-extrabold text-xl tracking-tight text-stone-900">
            HealthNestAI
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {NAV.map(n => {
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {n.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Profile */}
        <div className="p-4 border-t border-stone-100">
          <NavLink
            to="/app/profile"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-emerald-200 to-emerald-400 text-emerald-900 shadow-inner">
              {user?.name?.[0]?.toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-stone-800 truncate">
                {user?.name}
              </div>
              <div className="text-[10px] text-stone-400 truncate">
                {user?.email}
              </div>
            </div>
          </NavLink>

          <button
            onClick={() => {
              logout();
              nav('/login');
            }}
            className="mt-2 w-full text-left text-xs text-stone-400 hover:text-stone-700 px-2 py-1"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* =========================
         MAIN CONTENT
      ========================= */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-stone-200 shadow-sm">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg hover:bg-stone-100"
          >
            <Menu className="w-5 h-5 text-stone-600" />
          </button>

          <Logo className="w-7 h-7" />
          <span className="font-bold text-stone-900">
            HealthNestAI
          </span>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}