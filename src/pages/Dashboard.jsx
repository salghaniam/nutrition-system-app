import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Building2, Stethoscope, FileHeart, Bell, AlertCircle,
  CheckCircle, XCircle, Clock, ArrowRightLeft, Upload, BarChart3, FileText,
} from 'lucide-react';
import api from '../services/api';

const ICON_MAP = {
  Stethoscope, FileHeart, ArrowRightLeft, Upload, FileText,
};

const COLOR_CLASSES = {
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  pink: 'bg-pink-100 text-pink-700 border-pink-200',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  red: 'bg-red-100 text-red-700 border-red-200',
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [indicators, setIndicators] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [u, s, n] = await Promise.all([
        api.get('/auth/me'),
        api.get('/dashboard/stats').catch(() => ({ data: { data: {} } })),
        api.get('/dashboard/notifications'),
      ]);
      setUser(u.data.data || u.data.user);
      setStats(s.data.data || {});
      setNotifications(n.data.data?.notifications || []);
      setIndicators(n.data.data?.indicators || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-12 h-12 border-4 border-moh-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const totalNotifications = notifications.reduce((sum, n) => sum + n.count, 0);

  return (
    <div className="space-y-6">
      {/* الترحيب */}
      <div className="bg-gradient-to-l from-moh-primary to-moh-primary-dark text-white rounded-2xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold">مرحباً، {user?.fullName || user?.username}</h1>
        <p className="text-white/80 mt-1 text-sm">{getRoleLabel(user?.role)}</p>
      </div>

      {/* 🆕 الإشعارات */}
      {notifications.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Bell size={22} className="text-orange-500 animate-pulse" />
              الإشعارات والطلبات المعلقة
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{totalNotifications}</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {notifications.map((notif, idx) => {
              const Icon = ICON_MAP[notif.icon] || AlertCircle;
              const colorClass = COLOR_CLASSES[notif.color] || COLOR_CLASSES.blue;
              return (
                <Link
                  key={idx}
                  to={notif.link}
                  className={`block p-4 rounded-xl border-2 ${colorClass} hover:shadow-md transition group`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg flex-shrink-0">
                      <Icon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold">{notif.count}</span>
                        <span className="text-xs px-2 py-0.5 bg-white rounded-full">معلّق</span>
                      </div>
                      <p className="font-semibold text-sm">{notif.title}</p>
                      <p className="text-xs mt-1 opacity-70 group-hover:opacity-100">
                        {notif.actionLabel} ←
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {notifications.length === 0 && (
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3 text-green-800">
            <CheckCircle size={24} />
            <p className="font-medium">لا توجد طلبات تتطلب اعتمادك حالياً ✨</p>
          </div>
        </div>
      )}

      {/* 🆕 مؤشرات السارية/المنتهية */}
      {indicators && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IndicatorCard
            title="حالة التقارير الطبية"
            icon={Stethoscope}
            color="purple"
            data={indicators.medicalReports}
          />
          <IndicatorCard
            title="حالة الشهادات الصحية"
            icon={FileHeart}
            color="pink"
            data={indicators.healthCertificates}
          />
        </div>
      )}

      {/* الإحصائيات الأساسية */}
      {stats && Object.keys(stats).length > 0 && (
        <div className="card">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <BarChart3 size={22} className="text-moh-primary" />
            إحصائيات النظام
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.totalWorkers !== undefined && (
              <StatCard label="إجمالي العمال" value={stats.totalWorkers} icon={Users} color="blue" />
            )}
            {stats.totalHospitals !== undefined && (
              <StatCard label="المستشفيات" value={stats.totalHospitals} icon={Building2} color="green" />
            )}
            {stats.totalDevices !== undefined && (
              <StatCard label="الأجهزة" value={stats.totalDevices} icon={BarChart3} color="orange" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============ مكون: بطاقة المؤشر مع Pie Chart ============
const IndicatorCard = ({ title, icon: Icon, color, data }) => {
  const total = data.total + data.none;
  const items = [
    { label: 'سارية', value: data.valid, color: '#10b981', percent: total > 0 ? Math.round(data.valid / total * 100) : 0 },
    { label: 'قريبة الانتهاء', value: data.expiringSoon, color: '#f59e0b', percent: total > 0 ? Math.round(data.expiringSoon / total * 100) : 0 },
    { label: 'منتهية', value: data.expired, color: '#ef4444', percent: total > 0 ? Math.round(data.expired / total * 100) : 0 },
    { label: 'لم تُصدر', value: data.none, color: '#9ca3af', percent: total > 0 ? Math.round(data.none / total * 100) : 0 },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2">
          <Icon size={20} className="text-moh-primary" />
          {title}
        </h3>
        <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">المجموع: {total}</span>
      </div>

      <div className="flex items-center gap-4">
        {/* الـ Donut Chart */}
        <DonutChart items={items} size={140} />

        {/* القائمة */}
        <div className="flex-1 space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="flex-1">{item.label}</span>
              <strong>{item.value}</strong>
              <span className="text-xs text-gray-500">({item.percent}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============ مكون: Donut Chart بدون مكتبات خارجية ============
const DonutChart = ({ items, size = 140 }) => {
  const total = items.reduce((sum, i) => sum + i.value, 0);
  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-full"
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-gray-400">لا بيانات</span>
      </div>
    );
  }

  const radius = size / 2;
  const strokeWidth = 22;
  const innerRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * innerRadius;

  let cumulativePercent = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {items.map((item, idx) => {
          if (item.value === 0) return null;
          const percent = item.value / total;
          const dashArray = `${percent * circumference} ${circumference}`;
          const dashOffset = -cumulativePercent * circumference;
          cumulativePercent += percent;

          return (
            <circle
              key={idx}
              cx={radius}
              cy={radius}
              r={innerRadius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${radius} ${radius})`}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-2xl font-bold">{total}</span>
        <span className="text-xs text-gray-500">إجمالي</span>
      </div>
    </div>
  );
};

// ============ بطاقة إحصائية بسيطة ============
const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    orange: 'bg-orange-50 text-orange-700',
  };
  return (
    <div className={`p-4 rounded-xl ${colors[color] || colors.blue}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon size={20} />
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-xs">{label}</p>
    </div>
  );
};

const getRoleLabel = (role) => {
  const map = {
    system_admin: 'مدير النظام',
    system_supervisor: 'مشرف النظام',
    hospital_head: 'رئيس قسم',
    labor_supervisor: 'مشرف عمالة',
    devices_supervisor: 'مشرف أجهزة',
    site_manager: 'مدير موقع',
  };
  return map[role] || '';
};

export default Dashboard;
