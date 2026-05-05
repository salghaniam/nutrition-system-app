import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorkersList from './pages/WorkersList';
import WorkerForm from './pages/WorkerForm';
import WorkerDetail from './pages/WorkerDetail';
import Hospitals from './pages/Hospitals';
import Devices from './pages/Devices';
import MedicalReports from './pages/MedicalReports';
import HealthCertificates from './pages/HealthCertificates';
import Users from './pages/Users';
import Lookups from './pages/Lookups';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import WorkerLogin from './pages/WorkerLogin';
import WorkerPortal from './pages/WorkerPortal';
import WorkerTransfers from './pages/WorkerTransfers';
import AttachmentUpdates from './pages/AttachmentUpdates';
import DeletedWorkers from './pages/DeletedWorkers';
import AuditLogs from './pages/AuditLogs';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-moh-bg-light">
        <div className="animate-spin w-12 h-12 border-4 border-moh-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/worker-login" element={<WorkerLogin />} />
      <Route path="/worker-portal" element={<WorkerPortal />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="workers" element={<WorkersList />} />
        <Route path="deleted-workers" element={<DeletedWorkers />} />
          <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="workers/new" element={<WorkerForm />} />
        <Route path="workers/:id" element={<WorkerDetail />} />
        <Route path="workers/:id/edit" element={<WorkerForm />} />
        <Route path="hospitals" element={<Hospitals />} />
        <Route path="devices" element={<Devices />} />
        <Route path="medical-reports" element={<MedicalReports />} />
        <Route path="health-certificates" element={<HealthCertificates />} />
        <Route path="worker-transfers" element={<WorkerTransfers />} />
        <Route path="attachment-updates" element={<AttachmentUpdates />} />
        <Route path="users" element={<Users />} />
        <Route path="lookups" element={<Lookups />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
