// ===================================================================
// 🆕 v24.3: صفحة إرسال الإشعارات للموبايل
// ===================================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, Users, User, UserCog, Bell, Loader, ArrowLeft, CheckCircle 
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  MobileBackHeader, MobileLoadingState 
} from '../../components/mobile/MobileUI';

const ROLES = [
  { value: 'system_admin', label: 'مدراء النظام', icon: '👑' },
  { value: 'system_supervisor', label: 'مشرفي النظام', icon: '🛡️' },
  { value: 'hospital_head', label: 'رؤساء الأقسام', icon: '👨‍⚕️' },
  { value: 'labor_supervisor', label: 'مشرفي العمالة', icon: '👥' },
  { value: 'devices_supervisor', label: 'مشرفي الأجهزة', icon: '🔧' },
  { value: 'site_manager', label: 'مدراء المواقع', icon: '📍' },
];

const MobileSendNotification = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [target, setTarget] = useState('all');
  const [targetValue, setTargetValue] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [users, setUsers] = useState([]);
  const [sending, setSending] = useState(false);
  const [searchUser, setSearchUser] = useState('');

  const isAdmin = ['system_admin', 'system_supervisor'].includes(user?.role);

  useEffect(() => {
    if (!isAdmin) {
      toast.error('غير مصرح');
      navigate('/');
      return;
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get('/manual-notifications/users');
      setUsers(res.data.data || []);
    } catch (e) {}
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
    if (target === 'all') {
      if (!confirm(`إرسال لـ ${users.length} مستخدم؟`)) return;
    }

    setSending(true);
    try {
      const res = await api.post('/manual-notifications/send', {
        title, body, target,
        targetValue: target === 'all' ? null : targetValue,
      });
      toast.success(res.data.message);
      setTitle(''); setBody('');
      if (target !== 'all') setTargetValue('');
    } catch (e) {
      toast.error(e.response?.data?.message || 'فشل');
    } finally {
      setSending(false);
    }
  };

  const filtered = users.filter(u => {
    if (!searchUser) return true;
    const q = searchUser.toLowerCase();
    return u.fullName?.toLowerCase().includes(q) || 
           u.username?.toLowerCase().includes(q);
  });

  if (!isAdmin) return null;

  return (
    <div>
      <MobileBackHeader
        title="إرسال إشعار"
        onBack={() => navigate(-1)}
      />

      <form onSubmit={handleSend} className="space-y-4">
        {/* المستلمون */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-sm mb-3">المستلمون</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: 'all', icon: Users, label: 'الكل' },
              { v: 'role', icon: UserCog, label: 'دور' },
              { v: 'user', icon: User, label: 'محدد' },
            ].map(t => (
              <button
                key={t.v}
                type="button"
                onClick={() => { setTarget(t.v); setTargetValue(''); }}
                className={`p-3 rounded-lg border-2 transition text-center ${
                  target === t.v 
                    ? 'border-moh-primary bg-moh-primary/5 text-moh-primary' 
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                <t.icon size={18} className="mx-auto mb-1" />
                <div className="text-xs font-medium">{t.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* اختيار الدور */}
        {target === 'role' && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-bold text-sm mb-3">اختر الدور</h3>
            <div className="space-y-2">
              {ROLES.map(role => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setTargetValue(role.value)}
                  className={`w-full p-3 rounded-lg border-2 transition text-right text-sm ${
                    targetValue === role.value 
                      ? 'border-moh-primary bg-moh-primary/5 text-moh-primary' 
                      : 'border-gray-200'
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
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-bold text-sm mb-3">اختر المستخدم</h3>
            <input
              type="text"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              placeholder="ابحث..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2"
            />
            <div className="max-h-60 overflow-auto space-y-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-500 p-4 text-center">لا يوجد</p>
              ) : filtered.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setTargetValue(u.id)}
                  className={`w-full text-right p-2.5 rounded-lg border transition ${
                    String(targetValue) === String(u.id) 
                      ? 'border-moh-primary bg-moh-primary/5' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="font-medium text-sm">{u.fullName}</div>
                  <div className="text-xs text-gray-500">@{u.username}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* العنوان والمحتوى */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              العنوان <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان الإشعار"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
              maxLength={100}
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              المحتوى <span className="text-red-500">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="نص الإشعار"
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none"
              maxLength={500}
              required
            />
          </div>
        </div>

        {/* معاينة */}
        {(title || body) && (
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-3">
            <div className="text-xs text-gray-500 mb-2 text-center">📱 معاينة</div>
            <div className="bg-white rounded-xl p-3 shadow-md flex gap-2">
              <div className="w-10 h-10 bg-moh-primary text-white rounded-lg flex items-center justify-center flex-shrink-0">
                🥗
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500">نظام التغذية</div>
                <div className="font-bold text-sm">{title || 'العنوان'}</div>
                <div className="text-xs text-gray-700">{body || 'المحتوى'}</div>
              </div>
            </div>
          </div>
        )}

        {/* أزرار */}
        <div className="space-y-2 pb-4">
          <button
            type="submit"
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm bg-moh-primary text-white disabled:opacity-50"
          >
            {sending ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
            {sending ? 'جاري الإرسال...' : 'إرسال الإشعار'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm"
          >
            <ArrowLeft size={18} />
            رجوع
          </button>
        </div>
      </form>
    </div>
  );
};

export default MobileSendNotification;
