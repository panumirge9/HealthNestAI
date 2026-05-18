import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Spinner } from './components/UIKit';
import AppLayout from './components/AppLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SymptomChecker from './pages/SymptomChecker';
import HealthReport from './pages/HealthReport';
import MedicineReminder from './pages/MedicineReminder';
import Profile from './pages/Profile';

// New Phase 2 Pages
import EmergencyProfile from './pages/EmergencyProfile';
import LabResults from './pages/LabResults';
import MedicalHistory from './pages/MedicalHistory';
import HealthGoals from './pages/HealthGoals';
import Insurance from './pages/Insurance';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner size={28} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/app" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/app" /> : <Register />} />
      <Route path="/" element={<Navigate to={user ? '/app' : '/login'} />} />
      
      <Route path="/app" element={<Protected><AppLayout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="symptoms" element={<SymptomChecker />} />
        <Route path="report" element={<HealthReport />} />
        <Route path="medicines" element={<MedicineReminder />} />
        <Route path="profile" element={<Profile />} />
        
        {/* Phase 2 Routes */}
        <Route path="emergency" element={<EmergencyProfile />} />
        <Route path="labs" element={<LabResults />} />
        <Route path="medical" element={<MedicalHistory />} />
        <Route path="goals" element={<HealthGoals />} />
        <Route path="insurance" element={<Insurance />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}