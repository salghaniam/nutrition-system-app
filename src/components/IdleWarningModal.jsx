// ===================================================================
// 🆕 v19: IdleWarningModal - تحذير قبل انتهاء الجلسة
// ===================================================================
import { Clock, AlertTriangle, LogOut, RefreshCw } from 'lucide-react';

const IdleWarningModal = ({ secondsLeft, onExtend, onLogout }) => {
  // تنسيق الوقت بصيغة mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // اللون يتغير مع اقتراب الانتهاء
  const isUrgent = secondsLeft <= 30;
  const isCritical = secondsLeft <= 10;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-pulse-slow">
        {/* Header */}
        <div className={`p-5 rounded-t-2xl text-white ${
          isCritical ? 'bg-red-600' : isUrgent ? 'bg-orange-500' : 'bg-yellow-500'
        }`}>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h2 className="font-bold text-lg">تحذير - انتهاء الجلسة</h2>
              <p className="text-sm opacity-90 mt-0.5">سيتم تسجيل خروجك تلقائياً</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          <div className="mb-4">
            <Clock size={56} className={`mx-auto mb-3 ${
              isCritical ? 'text-red-600' : isUrgent ? 'text-orange-500' : 'text-yellow-500'
            }`} />
            <p className="text-gray-600 mb-3">الوقت المتبقي قبل تسجيل الخروج:</p>
            <div className={`text-5xl font-bold font-mono ${
              isCritical ? 'text-red-600' : isUrgent ? 'text-orange-500' : 'text-yellow-600'
            }`}>
              {formatTime(secondsLeft)}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 mb-4">
            <p>اضغط "تمديد الجلسة" للاستمرار في استخدام النظام</p>
            <p className="text-xs text-gray-500 mt-1">
              أو سيتم تسجيل خروجك تلقائياً لحماية حسابك
            </p>
          </div>

          {/* الأزرار */}
          <div className="flex gap-2">
            <button
              onClick={onLogout}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              تسجيل خروج
            </button>
            <button
              onClick={onExtend}
              autoFocus
              className="flex-1 bg-moh-primary hover:bg-moh-primary-dark text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              تمديد الجلسة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdleWarningModal;
