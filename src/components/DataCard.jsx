// ===================================================================
// 🆕 v21: DataCard - عرض البيانات كبطاقة على الموبايل
// ===================================================================
// مكون عام لتحويل صفوف الجداول إلى بطاقات واضحة على الجوال

import { ChevronLeft } from 'lucide-react';

/**
 * DataCard - بطاقة بيانات للموبايل
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.avatar - صورة أو أيقونة
 * @param {string} props.title - العنوان الرئيسي (الاسم مثلاً)
 * @param {string} props.subtitle - عنوان فرعي (المسمى الوظيفي)
 * @param {Array} props.fields - حقول إضافية [{label, value}]
 * @param {Array} props.actions - أزرار الإجراءات [{icon, label, onClick, color}]
 * @param {React.ReactNode} props.badge - شارة (مثل حالة)
 * @param {Function} props.onClick - عند الضغط على البطاقة
 */
export const DataCard = ({ avatar, title, subtitle, fields = [], actions = [], badge, onClick }) => {
  return (
    <div 
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${
        onClick ? 'cursor-pointer hover:shadow-md active:scale-[0.99] transition-all' : ''
      }`}
      onClick={onClick}
    >
      {/* Header بالأفاتار والاسم */}
      <div className="p-4 flex items-start gap-3">
        {avatar && (
          <div className="flex-shrink-0">
            {avatar}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base text-gray-900 truncate">{title}</h3>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
            {badge && (
              <div className="flex-shrink-0">{badge}</div>
            )}
          </div>
        </div>
      </div>

      {/* الحقول الإضافية */}
      {fields.length > 0 && (
        <div className="px-4 pb-3 space-y-1.5 border-t border-gray-100 pt-3">
          {fields.map((field, idx) => (
            <div key={idx} className="flex justify-between gap-2 text-sm">
              <span className="text-gray-500 flex-shrink-0">{field.label}:</span>
              <span className="text-gray-900 font-medium text-right truncate min-w-0">
                {field.value || '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* الأزرار */}
      {actions.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 flex flex-wrap gap-2">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick && action.onClick();
              }}
              className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition active:scale-95 ${
                action.color === 'red'
                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                  : action.color === 'green'
                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                  : action.color === 'blue'
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : action.color === 'yellow'
                  ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
              title={action.label}
            >
              {action.icon && <action.icon size={16} />}
              <span className="truncate">{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * MobileTable - حاوية الجداول للموبايل
 * يخفي الجدول العادي ويظهر cards
 */
export const MobileTable = ({ children }) => (
  <div className="md:hidden space-y-3">
    {children}
  </div>
);

/**
 * DesktopTable - حاوية الجداول للديسكتوب
 * يخفي على الموبايل
 */
export const DesktopTable = ({ children }) => (
  <div className="hidden md:block">
    {children}
  </div>
);

/**
 * ResponsiveContainer - حاوية responsive للجداول
 * تستخدم Cards على الموبايل و Table على الديسكتوب
 */
export const ResponsiveContainer = ({ mobileView, desktopView }) => (
  <>
    <MobileTable>{mobileView}</MobileTable>
    <DesktopTable>{desktopView}</DesktopTable>
  </>
);

export default DataCard;
