import { useState } from 'react';
import { X, RotateCcw, UserPlus, AlertTriangle, Loader, Building2, Calendar, CreditCard, Briefcase, CheckCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

/**
 * نافذة استرجاع عامل محذوف
 * تظهر عند إدخال idNumber لعامل موجود محذوف
 * تخير المستخدم: استرجاع البيانات السابقة أو إضافة بيانات جديدة
 */
const RestoreWorkerModal = ({ existingWorker, currentForm, onRestore, onCreateNew, onClose }) => {
  const [restoring, setRestoring] = useState(false);

  const handleRestore = async () => {
    if (!confirm(`سيتم استرجاع ملف العامل "${existingWorker.name}" بكل بياناته السابقة.\n\nهل أنت متأكد؟`)) return;
    
    setRestoring(true);
    try {
      // نمرر بيانات النموذج الحالي (مثل المستشفى الجديد) للاسترجاع
      const restoreData = {};
      if (currentForm?.hospitalId) restoreData.hospitalId = parseInt(currentForm.hospitalId);
      if (currentForm?.jobTitleId) restoreData.jobTitleId = parseInt(currentForm.jobTitleId);
      if (currentForm?.workStartDate) restoreData.workStartDate = currentForm.workStartDate;
      if (currentForm?.phone) restoreData.phone = currentForm.phone;
      
      const res = await api.post(`/workers/${existingWorker.id}/restore`, restoreData);
      toast.success(res.data.message);
      onRestore?.(res.data.data);
    } catch (e) {
      // معالج
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">
        
        {/* الترويسة */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-l from-yellow-50 to-white">
          <div className="flex items-center gap-2">
            <AlertTriangle size={22} className="text-yellow-600" />
            <h2 className="font-bold text-lg text-yellow-900">ملف العامل موجود مسبقاً</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={20} />
          </button>
        </div>

        {/* محتوى النافذة */}
        <div className="p-4 space-y-4">
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <p className="font-semibold mb-1">📂 وُجد ملف عامل محذوف بنفس رقم الهوية</p>
            <p className="text-xs">يمكنك استرجاع الملف القديم بكل بياناته أو إنشاء ملف جديد.</p>
          </div>

          {/* بيانات العامل المحذوف */}
          <div className="border-2 border-blue-200 rounded-lg overflow-hidden">
            <div className="bg-blue-50 px-4 py-2 border-b border-blue-200 flex items-center gap-2">
              <CreditCard size={16} className="text-blue-700" />
              <h3 className="font-bold text-blue-900 text-sm">بيانات العامل المحذوف</h3>
            </div>
            <div className="p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-32">الاسم:</span>
                <strong className="text-gray-900">{existingWorker.name}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-32">رقم الهوية:</span>
                <strong className="text-gray-900 font-mono">{existingWorker.idNumber}</strong>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-gray-400" />
                <span className="text-gray-500 w-32">المستشفى السابق:</span>
                <strong className="text-gray-900">{existingWorker.hospitalName}</strong>
              </div>
              {existingWorker.updatedAt && (
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-gray-500 w-32">تاريخ آخر تحديث:</span>
                  <strong className="text-gray-900">{formatDate(existingWorker.updatedAt)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* الخيارات */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-700">اختر الإجراء:</h3>

            {/* خيار 1: استرجاع */}
            <button
              onClick={handleRestore}
              disabled={restoring}
              className="w-full text-right border-2 border-green-200 hover:border-green-400 hover:bg-green-50 rounded-lg p-4 transition disabled:opacity-50"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                  {restoring ? (
                    <Loader size={20} className="text-green-700 animate-spin" />
                  ) : (
                    <RotateCcw size={20} className="text-green-700" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-green-900">
                    {restoring ? 'جاري الاسترجاع...' : '🔄 استرجاع البيانات السابقة'}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    إعادة تفعيل ملف العامل بكل بياناته القديمة (المرفقات، الشهادات، التقارير)
                  </p>
                  {currentForm?.hospitalId && (
                    <p className="text-xs text-blue-700 mt-1">
                      ℹ️ سيُنقل للمستشفى المختار في النموذج
                    </p>
                  )}
                </div>
              </div>
            </button>

            {/* خيار 2: إضافة جديد - مفعّل مع تحذير */}
            <button
              onClick={() => {
                if (confirm('⚠️ تحذير مهم:\n\nسيتم إنشاء ملف جديد بنفس رقم الهوية، وسيبقى الملف القديم محذوفاً.\n\nاستخدم هذا الخيار فقط إذا كنت متأكداً أن العامل الجديد شخص مختلف (مثلاً: تم إعادة إصدار رقم الإقامة لشخص آخر).\n\nهل أنت متأكد؟')) {
                  onCreateNew?.();
                }
              }}
              disabled={restoring}
              className="w-full text-right border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-lg p-4 transition disabled:opacity-50"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <UserPlus size={20} className="text-blue-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-blue-900">
                    ➕ إضافة كملف جديد
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    إنشاء ملف جديد منفصل بنفس رقم الهوية - يبقى الملف القديم محذوفاً
                  </p>
                  <p className="text-xs text-orange-700 mt-1 font-medium">
                    ⚠️ استخدم فقط إذا كان شخصاً مختلفاً (مثل إعادة إصدار رقم إقامة)
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* أزرار الإجراءات */}
          <div className="border-t pt-3 flex gap-2 justify-end">
            <button
              onClick={onClose}
              disabled={restoring}
              className="btn-secondary"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestoreWorkerModal;
