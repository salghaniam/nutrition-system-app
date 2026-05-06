// ===================================================================
// 🆕 v24: Notifications - صفحة الإشعارات للديسكتوب
// ===================================================================
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, BellOff, Trash2, CheckCheck, FileHeart, Stethoscope, 
  ArrowRightLeft, Upload
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Notifications = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { 
    notifications, loading, fetchNotifications, 
    markAsRead, markAllAsRead, deleteNotification, unreadCount 
  } = useNotifications();
  
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications(100, filter === 'unread');
  }, [filter]);

  const getIcon = (type) => {
    if (type.startsWith('health_certificate')) return { Icon: FileHeart, color: 'green' };
    if (type.startsWith('medical_report')) return { Icon: Stethoscope, color: 'purple' };
    if (type.startsWith('worker_transfer')) return { Icon: ArrowRightLeft, color: 'blue' };
    if (type.startsWith('attachment_update')) return { Icon: Upload, color: 'yellow' };
    return { Icon: Bell, color: 'gray' };
  };

  const handleClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    const data = notification.data || {};
    if (data.screen) {
      navigate(`/${data.screen}`);
    }
  };

  const sendTest = async () => {
    try {
      await api.post('/notifications/test');
      toast.success('تم إرسال إشعار تجريبي');
      setTimeout(() => fetchNotifications(100, filter === 'unread'), 1000);
    } catch (e) {
      toast.error('فشل');
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'الآن';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
    if (diff < 86400 * 7) return `منذ ${Math.floor(diff / 86400)} يوم`;
    return d.toLocaleDateString('ar-SA');
  };

  const colorClasses = {
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    gray: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-soft p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell size={24} className="text-moh-primary" />
              الإشعارات
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : 'لا توجد إشعارات جديدة'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={sendTest}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-2"
            >
              🧪 اختبار
            </button>
            {['system_admin', 'system_supervisor'].includes(currentUser?.role) && (
              <button
                onClick={() => navigate('/send-notification')}
                className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm flex items-center gap-2"
              >
                ✉️ إرسال إشعار
              </button>
            )}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-3 py-2 bg-moh-primary hover:bg-moh-primary-dark text-white rounded-lg text-sm flex items-center gap-2"
              >
                <CheckCheck size={16} />
                قراءة الكل
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all' ? 'bg-moh-primary text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            الكل ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'unread' ? 'bg-moh-primary text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            غير مقروء ({unreadCount})
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-soft p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-moh-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-soft p-12 text-center">
          <BellOff size={48} className="text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-700">لا توجد إشعارات</h3>
          <p className="text-sm text-gray-500 mt-1">
            {filter === 'unread' ? 'لقد قرأت كل الإشعارات' : 'ستظهر الإشعارات هنا'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          {notifications.map((notif, idx) => {
            const { Icon, color } = getIcon(notif.type);
            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition ${
                  idx > 0 ? 'border-t border-gray-100' : ''
                } ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`}>
                  <Icon size={22} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className={`${!notif.isRead ? 'font-bold' : 'font-medium'}`}>
                      {notif.title}
                    </h3>
                    {!notif.isRead && (
                      <span className="w-2.5 h-2.5 bg-moh-primary rounded-full flex-shrink-0 mt-2"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{notif.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatTime(notif.createdAt)}</p>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('حذف الإشعار؟')) deleteNotification(notif.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
