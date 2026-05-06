// ===================================================================
// 🆕 v24.3: صفحة إرسال الإشعارات (للمدراء)
// ===================================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, Users, User, UserCog, Bell, Loader, ArrowLeft,
  CheckCircle, Smartphone
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'system_admin', label: 'مدراء النظام', icon: '👑' },
  { value: 'system_supervisor', label: 'مشرفي النظام', icon: '🛡️' },
  { value: 'hospital_head', label: 'رؤساء الأقسام', icon: '👨‍⚕️' },
  { value: 'labor_supervisor', label: 'مشرفي العمالة', icon: '👥' },
  { value: 'devices_supervisor', label: 'مشرفي الأجهزة', icon: '🔧' },
  { value: 'site_manager', label: 'مدراء المواقع', icon: '📍' },
];

const SendNotification = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [target, setTarget] = useState('all'); // all | role | user
  const [targetValue, setTargetValue] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [sending, setSending] = useState(false);
  const [searchUser, setSearchUser] = useState('');

  // التحقق من الصلاحية
  const isAdmin = ['system_admin', 'system_supervisor'].includes(user?.role);

  useEffect(() => {
    if (!isAdmin) {
      toast.error('غير مصرح');
      navigate('/');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get('/manual-notifications/users'),
        api.get('/manual-notifications/stats'),
      ]);
      setUsers(usersRes.data.data || []);
      setStats(statsRes.data.data);
    } catch (e) {
      toast.error('فشل تحميل البيانات');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !body.trim()) {
      toast.error('العنوان والمحتوى مطلوبان');
      return;
    }
    
    if (target !== 'all' && !targetValue) {
      toast.error('يجب اختيار المستلم');
      return;
    }
    
    // تأكيد قبل الإرسال للجميع
    if (target === 'all') {
      if (!confirm(`هل أنت متأكد من إرسال هذا الإشعار لكل المستخدمين (${users.length} مستخدم)؟`)) {
        return;
      }
    }
    
    setSending(true);
    try {
      const res = await api.post('/manual-notifications/send', {
        title,
        body,
        target,
        targetValue: target === 'all' ? null : targetValue,
      });
      
      toast.success(res.data.message);
      
      // تنظيف
      setTitle('');
      setBody('');
      if (target !== 'all') setTargetValue('');
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'فشل الإرسال');
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (!searchUser) return true;
    const q = searchUser.toLowerCase();
    return u.fullName?.toLowerCase().includes(q) || 
           u.username?.toLowerCase().includes(q);
  });

  if (!isAdmin) return null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-soft p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Send size={24} className="text-moh-primary" />
              إرسال إشعار
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              إرسال إشعارات تذكيرية أو توعوية للمستخدمين
            </p>
          </div>
        </div>

        {/* الإحصائيات */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mt-5">
            <StatCard 
              icon={Bell} 
              label="إجمالي الإشعارات" 
              value={stats.total} 
              color="blue" 
            />
            <StatCard 
              icon={Send} 
              label="اليوم" 
              value={stats.todayCount} 
              color="green" 
            />
            <StatCard 
              icon={Smartphone} 
              label="أجهزة متصلة" 
              value={stats.activeDevices} 
              color="purple" 
            />
          </div>
        )}
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <form onSubmit={handleSend} className="space-y-5">
          {/* اختيار المستلمين */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المستلمون <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <TargetButton
                active={target === 'all'}
                onClick={() => { setTarget('all'); setTargetValue(''); }}
                icon={Users}
                label="الكل"
                color="green"
              />
              <TargetButton
                active={target === 'role'}
                onClick={() => { setTarget('role'); setTargetValue(''); }}
                icon={UserCog}
                label="دور معين"
                color="blue"
              />
              <TargetButton
                active={target === 'user'}
                onClick={() => { setTarget('user'); setTargetValue(''); }}
                icon={User}
                label="مستخدم محدد"
                color="purple"
              />
            </div>
          </div>

          {/* اختيار الدور */}
          {target === 'role' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختر الدور
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(role => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setTargetValue(role.value)}
                    className={`p-3 rounded-lg text-sm font-medium border-2 transition text-right ${
                      targetValue === role.value 
                        ? 'border-moh-primary bg-moh-primary/5 text-moh-primary' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="ml-2">{role.icon}</span>
                    {role.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* اختيار المستخدم */}
          {target === 'user' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختر المستخدم
              </label>
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="ابحث بالاسم أو اليوزر..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:border-moh-primary focus:ring-2 focus:ring-moh-primary/20 focus:outline-none"
              />
              <div className="max-h-60 overflow-auto border border-gray-200 rounded-lg">
                {filteredUsers.length === 0 ? (
                  <p className="text-sm text-gray-500 p-4 text-center">لا يوجد مستخدمون</p>
                ) : filteredUsers.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setTargetValue(u.id)}
                    className={`w-full text-right p-3 hover:bg-gray-50 border-b last:border-b-0 transition flex items-center justify-between ${
                      String(targetValue) === String(u.id) ? 'bg-moh-primary/5 border-r-4 border-r-moh-primary' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{u.fullName}</div>
                      <div className="text-xs text-gray-500">@{u.username} · {u.hospital?.name || 'بدون مستشفى'}</div>
                    </div>
                    {String(targetValue) === String(u.id) && (
                      <CheckCircle size={20} className="text-moh-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* العنوان */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              عنوان الإشعار <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تذكير: تحديث الشهادات الصحية"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-moh-primary focus:ring-2 focus:ring-moh-primary/20 focus:outline-none"
              maxLength={100}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100 حرف</p>
          </div>

          {/* المحتوى */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              محتوى الإشعار <span className="text-red-500">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="اكتب نص الإشعار..."
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-moh-primary focus:ring-2 focus:ring-moh-primary/20 focus:outline-none resize-none"
              maxLength={500}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{body.length}/500 حرف</p>
          </div>

          {/* معاينة */}
          {(title || body) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                معاينة الإشعار
              </label>
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-4">
                <div className="bg-white rounded-xl p-3 shadow-md flex gap-3">
                  <div className="w-10 h-10 bg-moh-primary text-white rounded-lg flex items-center justify-center flex-shrink-0">
                    🥗
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-0.5">نظام التغذية</div>
                    <div className="font-bold text-sm">{title || 'عنوان الإشعار'}</div>
                    <div className="text-xs text-gray-700 mt-0.5">{body || 'محتوى الإشعار'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* الأزرار */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={sending || !title.trim() || !body.trim() || (target !== 'all' && !targetValue)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-moh-primary hover:bg-moh-primary-dark disabled:bg-gray-300 text-white rounded-lg font-medium transition"
            >
              {sending ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send size={18} />
                  إرسال الإشعار
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              رجوع
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className={`${colors[color]} rounded-xl p-3 text-center`}>
      <Icon size={20} className="mx-auto mb-1" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
};

const TargetButton = ({ active, onClick, icon: Icon, label, color }) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-3 rounded-lg border-2 transition text-center ${
      active 
        ? 'border-moh-primary bg-moh-primary/5 text-moh-primary' 
        : 'border-gray-200 hover:border-gray-300 text-gray-700'
    }`}
  >
    <Icon size={20} className="mx-auto mb-1" />
    <div className="text-sm font-medium">{label}</div>
  </button>
);

export default SendNotification;
