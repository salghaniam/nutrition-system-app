import { useState } from 'react';
import { X, FileHeart, Loader, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const HealthCertificateRequestModal = ({ worker, onClose, onSuccess }) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const hasMedicalReport = !!worker.medicalReportImage;
  const isMedicalReportValid = worker.medicalReportExpiryDate
    ? new Date(worker.medicalReportExpiryDate) > new Date()
    : false;

  const canIssue = hasMedicalReport && isMedicalReportValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canIssue) {
      toast.error('يجب وجود تقرير طبي ساري ومرفق');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/health-certificates', {
        workerId: worker.id,
        notes,
      });
      toast.success(res.data.message || 'تم إنشاء الطلب');
      onSuccess?.();
      onClose();
    } catch (err) {
      // معالجة من interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b bg-blue-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <FileHeart size={22} className="text-blue-600" />
            <h2 className="font-bold text-lg text-blue-800">طلب إصدار شهادة صحية</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 bg-blue-50 border-b">
          <h3 className="font-semibold text-sm text-gray-700 mb-2">بيانات العامل:</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>الاسم:</strong> {worker.name}</div>
            <div><strong>رقم الهوية:</strong> {worker.idNumber}</div>
            <div><strong>الجنسية:</strong> {worker.nationality?.name || '-'}</div>
            <div><strong>المهنة:</strong> {worker.jobTitle?.name || '-'}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {canIssue ? (
            <div className="bg-green-50 border border-green-200 rounded p-3 flex items-start gap-2">
              <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <strong>الشروط مستوفاة:</strong>
                <ul className="mt-1 space-y-0.5 list-disc list-inside">
                  <li>التقرير الطبي مرفق</li>
                  <li>التقرير الطبي ساري المفعول</li>
                  <li>صلاحية الشهادة 365 يوم بعد الاعتماد النهائي</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2">
              <AlertTriangle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <strong>لا يمكن إصدار الشهادة:</strong>
                <ul className="mt-1 space-y-0.5 list-disc list-inside">
                  {!hasMedicalReport && <li>لا يوجد تقرير طبي مرفق</li>}
                  {!isMedicalReportValid && hasMedicalReport && <li>التقرير الطبي منتهي</li>}
                </ul>
              </div>
            </div>
          )}

          <div>
            <label className="label">ملاحظات (اختياري)</label>
            <textarea
              className="input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
            <strong>📌 ملاحظة:</strong> سيمر الطلب عبر مراحل الاعتماد التالية:
            <ul className="mt-1 mr-4 list-disc list-inside text-xs">
              <li>اعتماد المراحل حسب دور المُنشئ</li>
              <li>الاعتماد النهائي من <strong>مشرف النظام</strong></li>
              <li>بعد الاعتماد النهائي يمكن طباعة الشهادة من النظام</li>
            </ul>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t">
            <button type="button" onClick={onClose} className="btn-secondary">إلغاء</button>
            <button
              type="submit"
              disabled={loading || !canIssue}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? (
                <><Loader size={16} className="animate-spin" /> جاري...</>
              ) : (
                <><FileHeart size={16} /> إرسال الطلب للاعتماد</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HealthCertificateRequestModal;
