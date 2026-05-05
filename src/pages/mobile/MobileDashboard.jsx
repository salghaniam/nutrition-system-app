import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, FileHeart, Stethoscope, ArrowRightLeft, Activity, Plus,
  TrendingUp, Clock, AlertCircle, CheckCircle2
} from 'lucide-react';
import api from '../../services/api';
import { useAuth, ROLE_NAMES } from '../../context/AuthContext';
import { MobileStatCard, MobileLoadingState, MobileBadge } from '../../components/mobile/MobileUI';

const MobileDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data.data);
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <MobileLoadingState />;
  }

  // ساعة اليوم لتحديد التحية
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'مساء الخير';

  return (
    <div className="space-y-4">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-moh-primary to-moh-primary-dark text-white rounded-2xl p-5 shadow-md">
        <p className="text-sm opacity-90">{greeting} 👋</p>
        <h2 className="text-xl font-bold mt-1">{user?.fullName}</h2>
        <p className="text-xs opacity-90 mt-1">{ROLE_NAMES[user?.role]}</p>
        {user?.hospital && (
          <div className="mt-3 inline-flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-1.5 rounded-lg text-xs">
            🏥 {user.hospital.name}
          </div>
        )}
      </div>

      {/* الإحصائيات الرئيسية */}
      <div>
        <h3 className="font-bold text-sm text-gray-700 mb-2 px-1">📊 إحصائيات</h3>
        <div className="grid grid-cols-2 gap-3">
          <MobileStatCard
            icon={Users}
            label="إجمالي العمالة"
            value={stats?.totalWorkers || 0}
            color="green"
            onClick={() => navigate('/workers')}
          />
          <MobileStatCard
            icon={FileHeart}
            label="الشهادات الصحية"
            value={stats?.activeCertificates || 0}
            color="blue"
            onClick={() => navigate('/health-certificates')}
          />
          <MobileStatCard
            icon={Stethoscope}
            label="التقارير الطبية"
            value={stats?.totalReports || 0}
            color="purple"
            onClick={() => navigate('/medical-reports')}
          />
          <MobileStatCard
            icon={ArrowRightLeft}
            label="طلبات النقل"
            value={stats?.pendingTransfers || 0}
            color="yellow"
            onClick={() => navigate('/worker-transfers')}
          />
        </div>
      </div>

      {/* تنبيهات الشهادات */}
      {stats?.certificateAlerts && (
        <div>
          <h3 className="font-bold text-sm text-gray-700 mb-2 px-1">⚠️ تنبيهات الشهادات</h3>
          <div className="space-y-2">
            <AlertCard
              icon={CheckCircle2}
              color="green"
              label="سارية"
              count={stats.certificateAlerts.active || 0}
              percent={stats.certificateAlerts.activePercent}
            />
            <AlertCard
              icon={Clock}
              color="yellow"
              label="قريبة الانتهاء (30 يوم)"
              count={stats.certificateAlerts.expiringSoon || 0}
              percent={stats.certificateAlerts.expiringSoonPercent}
            />
            <AlertCard
              icon={AlertCircle}
              color="red"
              label="منتهية"
              count={stats.certificateAlerts.expired || 0}
              percent={stats.certificateAlerts.expiredPercent}
            />
          </div>
        </div>
      )}

      {/* إجراءات سريعة */}
      <div>
        <h3 className="font-bold text-sm text-gray-700 mb-2 px-1">⚡ إجراءات سريعة</h3>
        <div className="space-y-2">
          {(['hospital_head', 'labor_supervisor', 'system_admin'].includes(user?.role)) && (
            <QuickAction
              icon={Plus}
              label="إضافة عامل جديد"
              onClick={() => navigate('/workers/new')}
              color="green"
            />
          )}
          <QuickAction
            icon={Users}
            label="عرض كل العمال"
            onClick={() => navigate('/workers')}
            color="blue"
          />
          <QuickAction
            icon={FileHeart}
            label="إدارة الشهادات الصحية"
            onClick={() => navigate('/health-certificates')}
            color="purple"
          />
          {(['system_admin', 'system_supervisor'].includes(user?.role)) && (
            <QuickAction
              icon={ArrowRightLeft}
              label="مراجعة طلبات النقل"
              onClick={() => navigate('/worker-transfers')}
              color="yellow"
            />
          )}
        </div>
      </div>
    </div>
  );
};

const AlertCard = ({ icon: Icon, color, label, count, percent }) => {
  const colors = {
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };
  
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${colors[color]}`}>
      <Icon size={20} className="flex-shrink-0" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <div className="text-right">
        <div className="font-bold text-lg">{count}</div>
        {percent !== undefined && (
          <div className="text-xs opacity-75">{percent}%</div>
        )}
      </div>
    </div>
  );
};

const QuickAction = ({ icon: Icon, label, onClick, color = 'blue' }) => {
  const iconColors = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };
  
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 active:scale-[0.98] transition shadow-sm"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColors[color]}`}>
        <Icon size={20} />
      </div>
      <span className="flex-1 text-right font-medium text-gray-700 text-sm">{label}</span>
      <span className="text-gray-400">←</span>
    </button>
  );
};

export default MobileDashboard;
