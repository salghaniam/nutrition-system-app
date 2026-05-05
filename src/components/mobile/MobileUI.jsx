// ===================================================================
// 🆕 v22: Mobile UI Components
// مكونات مشتركة للصفحات الموبايل
// ===================================================================
import { Search, ChevronLeft, AlertCircle, Loader2 } from 'lucide-react';

/**
 * MobilePageHeader - رأس صفحة موبايل مع زر رجوع
 */
export const MobilePageHeader = ({ title, subtitle, onBack, actions }) => (
  <div className="bg-white shadow-sm sticky top-[60px] z-20 -mx-3 px-3 py-3 mb-3 flex items-center gap-3">
    {onBack && (
      <button 
        onClick={onBack}
        className="p-2 -mr-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition"
      >
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

/**
 * MobileSearchBar - شريط بحث للموبايل
 */
export const MobileSearchBar = ({ value, onChange, placeholder = 'بحث...' }) => (
  <div className="relative mb-3">
    <Search 
      size={18} 
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
    />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pr-10 pl-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-moh-primary focus:ring-2 focus:ring-moh-primary/20"
    />
  </div>
);

/**
 * MobileEmptyState - حالة عدم وجود بيانات
 */
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

/**
 * MobileLoadingState - مؤشر تحميل للموبايل
 */
export const MobileLoadingState = ({ message = 'جاري التحميل...' }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <Loader2 size={40} className="text-moh-primary animate-spin mb-3" />
    <p className="text-sm text-gray-600">{message}</p>
  </div>
);

/**
 * MobileStatCard - بطاقة إحصائية
 */
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

/**
 * MobileActionButton - زر إجراء كبير
 */
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

/**
 * MobileBadge - شارة حالة
 */
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
 * MobileWorkerCard - بطاقة عامل
 */
export const MobileWorkerCard = ({ worker, onClick, actions = [], badge }) => {
  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.99] transition"
    >
      {/* Header - معلومات العامل */}
      <div 
        className="p-4 flex items-start gap-3 cursor-pointer"
        onClick={onClick}
      >
        {/* صورة */}
        <div className="flex-shrink-0">
          {worker.personalImage ? (
            <img
              src={`/uploads/workers/${worker.personalImage}`}
              alt={worker.fullName}
              className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-moh-primary text-white flex items-center justify-center font-bold text-lg">
              {worker.fullName?.charAt(0)}
            </div>
          )}
        </div>
        
        {/* بيانات */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900 truncate">{worker.fullName}</h3>
              <p className="text-sm text-gray-600 truncate">{worker.jobTitle?.name || '—'}</p>
              <p className="text-xs text-gray-400 mt-0.5">رقم الهوية: {worker.idNumber}</p>
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
      
      {/* أزرار الإجراءات */}
      {actions.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 px-2 py-1.5 flex flex-wrap gap-1">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
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

/**
 * MobileFAB - Floating Action Button
 */
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

/**
 * MobileBackHeader - Header مع زر رجوع للصفحات الفرعية
 */
export const MobileBackHeader = ({ title, onBack, action }) => (
  <div className="bg-white border-b border-gray-200 -mx-3 px-3 py-3 mb-3 flex items-center gap-3 sticky top-[60px] z-20">
    <button 
      onClick={onBack}
      className="p-2 -mr-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg"
    >
      <ChevronLeft size={22} className="rotate-180" />
    </button>
    <h2 className="flex-1 font-bold text-base truncate">{title}</h2>
    {action}
  </div>
);
