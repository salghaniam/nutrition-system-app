import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Stethoscope, Settings, FileText,
  ClipboardList, LogOut, Menu, X, UserCog, BadgeCheck, Activity, FileHeart, ArrowRightLeft, Upload, Trash2,
  ChevronRight, FileSearch
} from 'lucide-react';
import { useAuth, ROLE_NAMES } from '../context/AuthContext';
import { useIdleTimer } from '../hooks/useIdleTimer';
import IdleWarningModal from '../components/IdleWarningModal';
import toast from 'react-hot-toast';

const MainLayout = () => {
  // 🆕 v21: Responsive sidebar
  // Desktop: مفتوحة افتراضياً
  // Mobile: مغلقة افتراضياً
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 768;
  });
  
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // مراقبة تغيير حجم الشاشة
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true); // Desktop: دائماً مفتوحة
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // إغلاق sidebar تلقائياً عند تغيير الصفحة (موبايل فقط)
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // 🆕 v19: Idle Timer
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

  // عناصر القائمة
  const menuItems = [
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* 🆕 v21: Overlay للموبايل - يظهر مع sidebar */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:fixed top-0 right-0 h-screen
          w-72 md:w-64
          bg-white shadow-xl md:shadow-soft
          transform transition-transform duration-300 ease-in-out
          z-40
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:-translate-x-0 md:translate-x-0'}
          ${!sidebarOpen && !isMobile ? 'md:translate-x-full' : ''}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Logo header */}
          <div className="p-4 border-b border-gray-100 bg-gradient-to-l from-moh-primary to-moh-primary-dark text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0">
                  ص
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-base leading-tight truncate">إدارة العاملين</h2>
                  <p className="text-xs opacity-90 truncate">وزارة الصحة - قسم التغذية</p>
                </div>
              </div>
              {/* زر إغلاق على الموبايل */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-1.5 hover:bg-white/10 rounded-lg transition flex-shrink-0"
                aria-label="إغلاق القائمة"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {menuItems.filter(item => canSee(item.roles)).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 md:py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-moh-primary text-white shadow-soft'
                      : 'text-gray-700 hover:bg-moh-bg-light hover:text-moh-primary active:bg-moh-bg-light'
                  }`
                }
              >
                <item.icon size={20} className="flex-shrink-0" />
                <span className="text-sm font-medium flex-1">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-moh-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                {user?.fullName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{ROLE_NAMES[user?.role]}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition font-medium"
            >
              <LogOut size={16} />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen && !isMobile ? 'md:mr-64' : 'md:mr-0'
        }`}
      >
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            {/* زر القائمة */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition"
              aria-label={sidebarOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            >
              {sidebarOpen && !isMobile ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* اسم النظام على الموبايل */}
            <h1 className="md:hidden font-bold text-base text-moh-primary">
              نظام التغذية
            </h1>
          </div>

          {/* المستشفى الحالي */}
          <div className="flex items-center gap-3">
            {user?.hospital && (
              <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 bg-moh-bg-light text-moh-primary rounded-lg text-xs md:text-sm">
                <Building2 size={14} className="flex-shrink-0" />
                <span className="truncate max-w-[120px] md:max-w-none">{user.hospital.name}</span>
              </div>
            )}
          </div>
        </header>

        {/* Content - مع padding أقل على الموبايل */}
        <main className="flex-1 p-3 md:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Idle Warning Modal */}
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
