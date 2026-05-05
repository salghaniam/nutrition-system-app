// ===================================================================
// 🆕 v22.2: Mobile UI Components (مُحدّث)
// ===================================================================
import { Search, ChevronLeft, AlertCircle, Loader2, FileHeart, Eye } from 'lucide-react';

export const MobilePageHeader = ({ title, subtitle, onBack, actions }) => (
  <div className="bg-white shadow-sm sticky top-[60px] z-20 -mx-3 px-3 py-3 mb-3 flex items-center gap-3">
    {onBack && (
      <button onClick={onBack} className="p-2 -mr-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg">
        <ChevronLeft size={22} className="rotate-180" />
      </button>
    )}
    <div className="flex-1 min-w-0">
      <h1 className="font-bold text-base text-gray-900 truncate">{title}</h1>
      {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
    </div>
    {actions && <div className="flex gap-1">{actions}</div>}
  </div>
);

export const MobileSearchBar = ({ value, onChange, placeholder = 'بحث...' }) => (
  <div className="relative mb-3">
    <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pr-10 pl-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-moh-primary focus:ring-2 focus:ring-moh-primary/20"
    />
  </div>
);

export const MobileEmptyState = ({ icon: Icon = AlertCircle, title, message, action }) => (
  <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
      <Icon size={32} className="text-gray-400" />
    </div>
    <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
    {message && <p className="text-sm text-gray-500 mb-4">{message}</p>}
    {action}
  </div>
);

export const MobileLoadingState = ({ message = 'جاري التحميل...' }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <Loader2 size={40} className="text-moh-primary animate-spin mb-3" />
    <p className="text-sm text-gray-600">{message}</p>
  </div>
);

export const MobileStatCard = ({ icon: Icon, label, value, color = 'green', onClick }) => {
  const colors = {
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
  };
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${colors[color]} text-white rounded-2xl p-4 text-right shadow-sm active:scale-95 transition w-full`}
    >
      <Icon size={24} className="opacity-90 mb-2" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-90 mt-0.5">{label}</div>
    </button>
  );
};

export const MobileActionButton = ({ icon: Icon, label, onClick, color = 'primary', fullWidth = true }) => {
  const colors = {
    primary: 'bg-moh-primary hover:bg-moh-primary-dark text-white',
    secondary: 'bg-white text-moh-primary border-2 border-moh-primary',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition active:scale-95 ${colors[color]} ${fullWidth ? 'w-full' : ''}`}
    >
      {Icon && <Icon size={18} />}
      {label}
    </button>
  );
};

export const MobileBadge = ({ children, color = 'gray' }) => {
  const colors = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
};

/**
 * 🆕 MobileWorkerCard - مُصلح في v22.2
 * - يدعم حقول مختلفة للاسم: fullName, name
 * - يدعم حقول مختلفة للصورة: personalImage, image, photo
 * - يستخدم URL مطلق للصورة (يعمل في التطبيق)
 */
export const MobileWorkerCard = ({ worker, onClick, actions = [], badge }) => {
  // 🔧 v22.2: دعم حقول متعددة
  const name = worker.fullName || worker.name || 'بدون اسم';
  const imageField = worker.personalImage || worker.image || worker.photo;
  
  // 🔧 v22.2: URL مطلق للصورة (يعمل في التطبيق Capacitor)
  const getImageUrl = (filename) => {
    if (!filename) return null;
    if (filename.startsWith('http')) return filename;
    // استخدم origin للحصول على HTTPS كامل (https://hi-chat.com/uploads/...)
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    // في التطبيق، origin قد يكون "https://localhost" - نستخدم hi-chat.com مباشرة
    const isApp = window.Capacitor?.isNativePlatform?.();
    const baseUrl = isApp ? 'https://hi-chat.com' : origin;
    return `${baseUrl}/uploads/workers/${filename}`;
  };
  
  const imageUrl = getImageUrl(imageField);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.99] transition">
      <div className="p-4 flex items-start gap-3 cursor-pointer" onClick={onClick}>
        {/* صورة */}
        <div className="flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
              onError={(e) => {
                // عند فشل تحميل الصورة، نعرض الحرف الأول
                e.target.style.display = 'none';
                if (e.target.nextSibling) {
                  e.target.nextSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div 
            className={`w-14 h-14 rounded-full bg-moh-primary text-white flex items-center justify-center font-bold text-lg ${imageUrl ? 'hidden' : 'flex'}`}
            style={{ display: imageUrl ? 'none' : 'flex' }}
          >
            {name.charAt(0)}
          </div>
        </div>
        
        {/* بيانات */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900 truncate">{name}</h3>
              <p className="text-sm text-gray-600 truncate">
                {worker.jobTitle?.name || worker.jobTitleName || '—'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                رقم الهوية: {worker.idNumber || '—'}
              </p>
            </div>
            {badge}
          </div>
          
          {worker.hospital?.name && (
            <p className="text-xs text-gray-500 mt-1.5 truncate">
              🏥 {worker.hospital.name}
            </p>
          )}
        </div>
      </div>
      
      {/* أزرار */}
      {actions.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 px-2 py-1.5 flex flex-wrap gap-1">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); action.onClick(); }}
              className={`flex-1 min-w-[70px] flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition active:scale-95 ${
                action.color === 'red' ? 'bg-red-100 text-red-700 active:bg-red-200' :
                action.color === 'green' ? 'bg-green-100 text-green-700 active:bg-green-200' :
                action.color === 'blue' ? 'bg-blue-100 text-blue-700 active:bg-blue-200' :
                action.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 active:bg-yellow-200' :
                'bg-white text-gray-700 active:bg-gray-100'
              }`}
              title={action.label}
            >
              {action.icon && <action.icon size={14} />}
              <span className="truncate">{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const MobileFAB = ({ icon: Icon, onClick, label }) => (
  <button
    onClick={onClick}
    className="fixed bottom-20 left-4 z-30 bg-moh-primary text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-90 transition hover:shadow-xl"
    aria-label={label}
    title={label}
  >
    <Icon size={24} />
  </button>
);

export const MobileBackHeader = ({ title, onBack, action }) => (
  <div className="bg-white border-b border-gray-200 -mx-3 px-3 py-3 mb-3 flex items-center gap-3 sticky top-[60px] z-20">
    <button onClick={onBack} className="p-2 -mr-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg">
      <ChevronLeft size={22} className="rotate-180" />
    </button>
    <h2 className="flex-1 font-bold text-base truncate">{title}</h2>
    {action}
  </div>
);

/**
 * 🆕 v22.2: Helper لـ URL الكامل للصورة
 * يستخدم في كل الصفحات التي تعرض صور
 */
export const getFullImageUrl = (relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http')) return relativePath;
  const isApp = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
  const baseUrl = isApp ? 'https://hi-chat.com' : (typeof window !== 'undefined' ? window.location.origin : '');
  
  // إن لم يبدأ بـ /uploads/، نضيف /uploads/
  const path = relativePath.startsWith('/') ? relativePath : `/uploads/workers/${relativePath}`;
  return `${baseUrl}${path}`;
};
