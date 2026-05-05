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
// 🆕 v22: Mobile pages
import { useIsMobile } from './utils/deviceDetection';
import MobileLayout from './layouts/MobileLayout';
import MobileDashboard from './pages/mobile/MobileDashboard';
import MobileWorkersList from './pages/mobile/MobileWorkersList';
import MobileWorkerDetail from './pages/mobile/MobileWorkerDetail';
// 🆕 v22.2: المزيد من Mobile pages
import MobileHealthCertificates from './pages/mobile/MobileHealthCertificates';
import MobileMedicalReports from './pages/mobile/MobileMedicalReports';
import MobileWorkerTransfers from './pages/mobile/MobileWorkerTransfers';
import MobileWorkerForm from './pages/mobile/MobileWorkerForm';
import MobileDevices from './pages/mobile/MobileDevices';
import {
  MobileUsers, MobileHospitals, MobileDeletedWorkers,
  MobileLookups, MobileAuditLogs, MobileReports, 
  MobileSettings, MobileAttachmentUpdates,
} from './pages/mobile/MobileAdminPages';


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


// 🆕 v22: Smart Layout - يختار MainLayout أو MobileLayout
const SmartLayout = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileLayout /> : <MainLayout />;
};

// 🆕 v22: Smart Page Components - يختار النسخة الموبايل أو الديسكتوب
const SmartDashboard = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileDashboard /> : <Dashboard />;
};

const SmartWorkersList = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileWorkersList /> : <WorkersList />;
};

const SmartWorkerDetail = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileWorkerDetail /> : <WorkerDetail />;
};

// 🆕 v22.2: Smart components للصفحات الجديدة
const SmartHealthCertificates = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileHealthCertificates /> : <HealthCertificates />;
};

const SmartMedicalReports = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileMedicalReports /> : <MedicalReports />;
};

const SmartWorkerTransfers = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileWorkerTransfers /> : <WorkerTransfers />;
};

const SmartWorkerForm = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileWorkerForm /> : <WorkerForm />;
};

const SmartDevices = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileDevices /> : <Devices />;
};

const SmartUsers = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileUsers /> : <Users />;
};

const SmartHospitals = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileHospitals /> : <Hospitals />;
};

const SmartDeletedWorkers = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileDeletedWorkers /> : <DeletedWorkers />;
};

const SmartLookups = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileLookups /> : <Lookups />;
};

const SmartAuditLogs = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileAuditLogs /> : <AuditLogs />;
};

const SmartReports = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileReports /> : <Reports />;
};

const SmartSettings = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileSettings /> : <Settings />;
};

const SmartAttachmentUpdates = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileAttachmentUpdates /> : <AttachmentUpdates />;
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
        <Route index element={<SmartDashboard />} />
        <Route path="workers" element={<SmartWorkersList />} />
        <Route path="deleted-workers" element={<SmartDeletedWorkers />} />
          <Route path="audit-logs" element={<SmartAuditLogs />} />
        <Route path="workers/new" element={<SmartWorkerForm />} />
        <Route path="workers/:id" element={<SmartWorkerDetail />} />
        <Route path="workers/:id/edit" element={<SmartWorkerForm />} />
        <Route path="hospitals" element={<SmartHospitals />} />
        <Route path="devices" element={<SmartDevices />} />
        <Route path="medical-reports" element={<SmartMedicalReports />} />
        <Route path="health-certificates" element={<SmartHealthCertificates />} />
        <Route path="worker-transfers" element={<SmartWorkerTransfers />} />
        <Route path="attachment-updates" element={<SmartAttachmentUpdates />} />
        <Route path="users" element={<SmartUsers />} />
        <Route path="lookups" element={<SmartLookups />} />
        <Route path="reports" element={<SmartReports />} />
        <Route path="settings" element={<SmartSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
