import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileHeart, ArrowRightLeft, Menu, X, LogOut,
  Stethoscope, Activity, UserCog, Building2, ClipboardList, FileText,
  Settings, Trash2, Upload, FileSearch, ChevronLeft, Bell
} from 'lucide-react';
import { useAuth, ROLE_NAMES } from '../context/AuthContext';
import { useIdleTimer } from '../hooks/useIdleTimer';
import IdleWarningModal from '../components/IdleWarningModal';
import toast from 'react-hot-toast';

/**
 * 🆕 v22: Mobile Layout
 * - Bottom Tabs للوصول السريع (4 صفحات أساسية)
 * - Side Drawer لباقي الصفحات
 * - Header مدمج مع ☰ menu
 */
const MobileLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Idle Timer
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const handleIdleTimeout = () => {
    toast.error('انتهت الجلسة بسبب الخمول', { duration: 5000 });
    logout();
  };
  const handleExtendSession = () => {
    setShowIdleWarning(false);
    resetTimer();
    toast.success('تم تمديد الجلسة');
  };
  const { resetTimer, secondsLeft, isWarning } = useIdleTimer({
    enabled: !!user,
    onTimeout: handleIdleTimeout,
    onWarning: () => setShowIdleWarning(true),
    onActivity: () => setShowIdleWarning(false),
  });

  // إغلاق Drawer عند تغيير الصفحة
  const closeDrawer = () => setDrawerOpen(false);

  // Bottom Tabs (4 الأهم)
  const bottomTabs = [
    { to: '/', icon: LayoutDashboard, label: 'الرئيسية' },
    { to: '/workers', icon: Users, label: 'العمالة' },
    { to: '/health-certificates', icon: FileHeart, label: 'الشهادات' },
    { to: '/worker-transfers', icon: ArrowRightLeft, label: 'النقل' },
  ];

  // كل القائمة (في Drawer)
  const allMenuItems = [
    { to: '/', icon: LayoutDashboard, label: 'لوحة التحكم', roles: 'all' },
    { to: '/workers', icon: Users, label: 'العمالة', roles: 'all' },
    { to: '/deleted-workers', icon: Trash2, label: 'العمال المحذوفون', roles: ['system_admin'] },
    { to: '/medical-reports', icon: Stethoscope, label: 'التقارير الطبية', roles: 'all' },
    { to: '/health-certificates', icon: FileHeart, label: 'الشهادات الصحية', roles: 'all' },
    { to: '/worker-transfers', icon: ArrowRightLeft, label: 'طلبات النقل', roles: 'all' },
    { to: '/attachment-updates', icon: Upload, label: 'تحديثات المرفقات', roles: ['system_admin', 'system_supervisor', 'hospital_head'] },
    { to: '/devices', icon: Activity, label: 'الأجهزة', roles: 'all' },
    { to: '/users', icon: UserCog, label: 'المستخدمين', roles: ['system_admin'] },
    { to: '/hospitals', icon: Building2, label: 'المستشفيات', roles: ['system_admin'] },
    { to: '/lookups', icon: ClipboardList, label: 'البيانات المرجعية', roles: ['system_admin'] },
    { to: '/audit-logs', icon: FileSearch, label: 'سجل العمليات', roles: ['system_admin'] },
    { to: '/reports', icon: FileText, label: 'التقارير الإحصائية', roles: 'all' },
    { to: '/settings', icon: Settings, label: 'الإعدادات', roles: ['system_admin'] },
  ];

  const canSee = (roles) => {
    if (!user) return false;
    if (roles === 'all') return true;
    return Array.isArray(roles) && roles.includes(user.role);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-l from-moh-primary to-moh-primary-dark text-white px-4 py-3 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 hover:bg-white/10 active:bg-white/20 rounded-lg transition"
            aria-label="فتح القائمة"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 text-center">
            <h1 className="font-bold text-base">نظام التغذية</h1>
            {user?.hospital && (
              <p className="text-xs opacity-90 truncate">{user.hospital.name}</p>
            )}
          </div>

          {/* الأفاتار */}
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-base">
            {user?.fullName?.charAt(0)}
          </div>
        </div>
      </header>

      {/* Side Drawer */}
      {drawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeDrawer}
          />
          
          {/* Drawer */}
          <aside className="fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
            {/* Drawer Header */}
            <div className="bg-gradient-to-l from-moh-primary to-moh-primary-dark text-white p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">القائمة</h2>
                <button
                  onClick={closeDrawer}
                  className="p-1.5 hover:bg-white/10 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* User info in drawer */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
                  {user?.fullName?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user?.fullName}</p>
                  <p className="text-xs opacity-90">{ROLE_NAMES[user?.role]}</p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {allMenuItems.filter(item => canSee(item.roles)).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={closeDrawer}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      isActive
                        ? 'bg-moh-primary text-white'
                        : 'text-gray-700 hover:bg-moh-bg-light active:bg-moh-bg-light'
                    }`
                  }
                >
                  <item.icon size={20} className="flex-shrink-0" />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  <ChevronLeft size={16} className="opacity-50" />
                </NavLink>
              ))}
            </nav>

            {/* Logout button */}
            <div className="border-t border-gray-100 p-3">
              <button
                onClick={() => { closeDrawer(); logout(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded-lg transition font-medium"
              >
                <LogOut size={18} />
                تسجيل الخروج
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-20">
        <div className="p-3">
          <Outlet />
        </div>
      </main>

      {/* Bottom Tabs */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
        <div className="grid grid-cols-4 h-16 safe-bottom">
          {bottomTabs.map((tab) => {
            const isActive = tab.to === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(tab.to);
            
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/'}
                className={`flex flex-col items-center justify-center gap-0.5 transition active:bg-gray-100 ${
                  isActive ? 'text-moh-primary' : 'text-gray-500'
                }`}
              >
                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute top-0 w-12 h-1 bg-moh-primary rounded-b-full"></div>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Idle Modal */}
      {showIdleWarning && isWarning && (
        <IdleWarningModal
          secondsLeft={secondsLeft}
          onExtend={handleExtendSession}
          onLogout={() => { setShowIdleWarning(false); logout(); }}
        />
      )}
    </div>
  );
};

export default MobileLayout;
