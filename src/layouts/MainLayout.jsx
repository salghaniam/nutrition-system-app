import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {   
  LayoutDashboard, Users, Building2, Stethoscope, Settings, FileText,
  ClipboardList, LogOut, Menu, X, UserCog, BadgeCheck, Activity, FileHeart, ArrowRightLeft, Upload, Trash2} from 'lucide-react';
import { useAuth, ROLE_NAMES } from '../context/AuthContext';
import { useIdleTimer } from '../hooks/useIdleTimer';
import IdleWarningModal from '../components/IdleWarningModal';
import toast from 'react-hot-toast';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();

  // 🆕 v19: Idle Timer - خروج تلقائي بعد ساعة خمول
  const [showIdleWarning, setShowIdleWarning] = useState(false);

  const handleIdleTimeout = () => {
    toast.error('انتهت الجلسة بسبب الخمول - يرجى إعادة تسجيل الدخول', { duration: 5000 });
    logout();
  };

  const handleIdleWarning = () => {
    setShowIdleWarning(true);
  };

  const handleExtendSession = () => {
    setShowIdleWarning(false);
    resetTimer();
    toast.success('تم تمديد الجلسة', { duration: 2000 });
  };

  const handleManualLogout = () => {
    setShowIdleWarning(false);
    logout();
  };

  const { resetTimer, secondsLeft, isWarning } = useIdleTimer({
    enabled: !!user,
    onTimeout: handleIdleTimeout,
    onWarning: handleIdleWarning,
    onActivity: () => setShowIdleWarning(false),
  });
  const navigate = useNavigate();

  // عناصر القائمة حسب الدور
  const menuItems = [
    { to: '/', icon: LayoutDashboard, label: 'لوحة التحكم', roles: 'all' },
    { to: '/workers', icon: Users, label: 'العمالة', roles: 'all' },
    { to: '/deleted-workers', icon: Trash2, label: 'العمال المحذوفون', roles: ['system_admin'] },
    { to: '/audit-logs', icon: Activity, label: 'سجل الأحداث', roles: ['system_admin'] },
    { to: '/medical-reports', icon: Stethoscope, label: 'التقارير الطبية', roles: 'all' },
    { to: '/health-certificates', icon: FileHeart, label: 'الشهادات الصحية', roles: 'all' },
    { to: '/worker-transfers', icon: ArrowRightLeft, label: 'طلبات النقل', roles: ['system_admin', 'system_supervisor', 'hospital_head'] },
    { to: '/attachment-updates', icon: Upload, label: 'طلبات تحديث المرفقات', roles: ['labor_supervisor', 'system_admin', 'system_supervisor'] },
    { to: '/devices', icon: Activity, label: 'الأجهزة', roles: 'all' },
    { to: '/hospitals', icon: Building2, label: 'المستشفيات', roles: ['system_admin', 'system_supervisor'] },
    { to: '/users', icon: UserCog, label: 'المستخدمين', roles: ['system_admin', 'system_supervisor', 'hospital_head'] },
    { to: '/lookups', icon: ClipboardList, label: 'البيانات المرجعية', roles: ['system_admin', 'system_supervisor', 'hospital_head'] },
    { to: '/reports', icon: FileText, label: 'التقارير الإحصائية', roles: 'all' },
    { to: '/settings', icon: Settings, label: 'الإعدادات', roles: ['system_admin'] },
  ];

  const canSee = (roles) => roles === 'all' || (user && roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-l border-gray-200 transition-all duration-300 fixed h-full z-30 overflow-hidden`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-l from-moh-primary to-moh-primary-dark text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-moh-primary font-bold text-xl">
                ص
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">إدارة العاملين</h1>
                <p className="text-xs opacity-80">وزارة الصحة - قسم التغذية</p>
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {menuItems.filter((m) => canSee(m.roles)).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-moh-primary text-white shadow-soft'
                      : 'text-gray-700 hover:bg-moh-bg-light hover:text-moh-primary'
                  }`
                }
              >
                <item.icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-moh-primary text-white rounded-full flex items-center justify-center font-bold">
                {user?.fullName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-500">{ROLE_NAMES[user?.role]}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut size={16} />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 ${sidebarOpen ? 'mr-64' : 'mr-0'} transition-all duration-300`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-3">
            {user?.hospital && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-moh-bg-light text-moh-primary rounded-lg text-sm">
                <Building2 size={16} />
                {user.hospital.name}
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>

      {/* 🆕 v19: Idle Warning Modal */}
      {showIdleWarning && isWarning && (
        <IdleWarningModal
          secondsLeft={secondsLeft}
          onExtend={handleExtendSession}
          onLogout={handleManualLogout}
        />
      )}
    </div>
  );
};

export default MainLayout;
