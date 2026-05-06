// ===================================================================
// 🆕 v24: MobileNotifications - صفحة الإشعارات للموبايل
// ===================================================================
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, BellOff, Trash2, CheckCheck, FileHeart, Stethoscope, 
  ArrowRightLeft, Upload, AlertCircle, Check
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { 
  MobileLoadingState, MobileEmptyState, MobileBackHeader 
} from '../../components/mobile/MobileUI';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const MobileNotifications = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { 
    notifications, loading, fetchNotifications, 
    markAsRead, markAllAsRead, deleteNotification, unreadCount 
  } = useNotifications();
  
  const [filter, setFilter] = useState('all'); // all | unread

  useEffect(() => {
    fetchNotifications(50, filter === 'unread');
  }, [filter]);

  // تحديد أيقونة كل إشعار
  const getIcon = (type) => {
    if (type.startsWith('health_certificate')) return { Icon: FileHeart, color: 'green' };
    if (type.startsWith('medical_report')) return { Icon: Stethoscope, color: 'purple' };
    if (type.startsWith('worker_transfer')) return { Icon: ArrowRightLeft, color: 'blue' };
    if (type.startsWith('attachment_update')) return { Icon: Upload, color: 'yellow' };
    if (type === 'test') return { Icon: Bell, color: 'gray' };
    return { Icon: Bell, color: 'gray' };
  };

  // عند الضغط على الإشعار - توجيه + قراءة
  const handleClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    const data = notification.data || {};
    if (data.screen) {
      navigate(`/${data.screen}`);
    }
  };

  // اختبار - إرسال إشعار تجريبي
  const sendTest = async () => {
    try {
      await api.post('/notifications/test');
      toast.success('تم إرسال إشعار تجريبي');
      setTimeout(() => fetchNotifications(50, filter === 'unread'), 1000);
    } catch (e) {
      toast.error('فشل الإرسال');
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = (now - d) / 1000; // ثواني
    
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
    red: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-700',
  };

  return (
    <div>
      <MobileBackHeader
        title="الإشعارات"
        onBack={() => navigate(-1)}
        action={
          unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs px-3 py-1.5 bg-moh-primary text-white rounded-lg flex items-center gap-1"
            >
              <CheckCheck size={14} />
              قراءة الكل
            </button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-3 bg-white rounded-xl p-1">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'all' ? 'bg-moh-primary text-white' : 'text-gray-600'
          }`}
        >
          الكل ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'unread' ? 'bg-moh-primary text-white' : 'text-gray-600'
          }`}
        >
          غير مقروء ({unreadCount})
        </button>
      </div>

      {loading ? (
        <MobileLoadingState />
      ) : notifications.length === 0 ? (
        <MobileEmptyState
          icon={BellOff}
          title="لا توجد إشعارات"
          message={filter === 'unread' ? 'لقد قرأت كل الإشعارات' : 'ستظهر الإشعارات هنا'}
        />
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => {
            const { Icon, color } = getIcon(notif.type);
            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`bg-white rounded-2xl shadow-sm border overflow-hidden cursor-pointer active:scale-[0.99] transition ${
                  !notif.isRead ? 'border-r-4 border-r-moh-primary border-gray-100' : 'border-gray-100'
                }`}
              >
                <div className="p-3 flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`}>
                    <Icon size={20} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`text-sm truncate ${!notif.isRead ? 'font-bold' : 'font-medium'}`}>
                        {notif.title}
                      </h3>
                      {!notif.isRead && (
                        <span className="w-2 h-2 bg-moh-primary rounded-full flex-shrink-0 mt-1.5"></span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {notif.body}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(notif.createdAt)}
                    </p>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('حذف الإشعار؟')) deleteNotification(notif.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0"
                    aria-label="حذف"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* زر الاختبار */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        {['system_admin', 'system_supervisor'].includes(currentUser?.role) && (
          <button
            onClick={() => navigate('/send-notification')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl text-sm font-medium mb-2"
          >
            ✉️ إرسال إشعار
          </button>
        )}
        <button
          onClick={sendTest}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium"
        >
          🧪 إرسال إشعار تجريبي
        </button>
      </div>
    </div>
  );
};

export default MobileNotifications;
