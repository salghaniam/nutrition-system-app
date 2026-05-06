// ===================================================================
// 🆕 v24: NotificationBell Component
// أيقونة الجرس مع بادج عدد غير المقروء (في Header)
// ===================================================================
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';

const NotificationBell = ({ className = '' }) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications({ pollInterval: 30000 });

  return (
    <button
      onClick={() => navigate('/notifications')}
      className={`relative p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition ${className}`}
      aria-label="الإشعارات"
      title="الإشعارات"
    >
      <Bell size={22} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-sm">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
