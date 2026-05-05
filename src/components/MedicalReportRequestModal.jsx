import { useState, useEffect } from 'react';
import { X, Stethoscope, Loader, MapPin } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

/**
 * نافذة منبثقة لطلب تقرير طبي جديد
 * - تعرض اختيار المركز الطبي
 * - عند الموافقة: ينشئ الطلب ويفتح نموذج PDF في نافذة جديدة
 */
const MedicalReportRequestModal = ({ worker, onClose, onSuccess }) => {
  const [centers, setCenters] = useState([]);
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCenters, setLoadingCenters] = useState(true);

  useEffect(() => {
    loadCenters();
  }, []);

  const loadCenters = async () => {
    try {
      const res = await api.get('/medical-centers');
      setCenters(res.data.data || []);
    } catch (e) {
      toast.error('فشل في تحميل قائمة المراكز');
    } finally {
      setLoadingCenters(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCenterId) {
      toast.error('يجب اختيار مركز طبي');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/medical-reports', {
        workerId: worker.id,
        medicalCenterId: selectedCenterId,
        notes,
      });
      const reportId = res.data.data.id;
      toast.success('تم إنشاء طلب التقرير - سيتم فتح النموذج للطباعة');

      // فتح نافذة الطباعة مع التوكن في الـ URL (لأن الفتح في نافذة جديدة)
      const token = localStorage.getItem('token');
      const formUrl = `/api/medical-reports/${reportId}/form`;

      // طريقة 1: فتح في نافذة جديدة مع التوكن
      // نفتحها مع XHR ثم نحقن HTML
      const formRes = await api.get(`/medical-reports/${reportId}/form`, {
        responseType: 'text',
      });
      const newWindow = window.open('', '_blank', 'width=900,height=1100');
      if (newWindow) {
        newWindow.document.write(formRes.data);
        newWindow.document.close();
      } else {
        toast.error('يرجى السماح للنوافذ المنبثقة من إعدادات المتصفح');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      // الأخطاء مُعالجة من interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* الترويسة */}
        <div className="flex items-center justify-between p-4 border-b bg-moh-bg-light rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Stethoscope size={22} className="text-moh-primary" />
            <h2 className="font-bold text-lg text-moh-primary">طلب تقرير طبي جديد</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={20} />
          </button>
        </div>

        {/* بيانات العامل */}
        <div className="p-4 bg-blue-50 border-b">
          <h3 className="font-semibold text-sm text-gray-700 mb-2">بيانات العامل:</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>الاسم:</strong> {worker.name}</div>
            <div><strong>رقم الهوية:</strong> {worker.idNumber}</div>
            <div><strong>الجنسية:</strong> {worker.nationality?.name || '-'}</div>
            <div><strong>المهنة:</strong> {worker.jobTitle?.name || '-'}</div>
          </div>
        </div>

        {/* النموذج */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="label flex items-center gap-1">
              <MapPin size={14} />
              المركز الطبي للفحص *
            </label>
            {loadingCenters ? (
              <div className="text-center py-4">
                <Loader className="animate-spin inline" size={20} />
                <span className="mr-2 text-sm">جاري تحميل القائمة...</span>
              </div>
            ) : centers.length === 0 ? (
              <div className="bg-orange-50 border border-orange-200 rounded p-3 text-sm text-orange-800">
                لا توجد مراكز طبية مُضافة. يرجى إضافة مركز من شاشة "البيانات المرجعية" أولاً.
              </div>
            ) : (
              <select
                required
                className="input"
                value={selectedCenterId}
                onChange={(e) => setSelectedCenterId(e.target.value)}
              >
                <option value="">اختر المركز...</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="label">ملاحظات (اختياري)</label>
            <textarea
              className="input"
              rows={3}
              placeholder="أي ملاحظات إضافية..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
            <strong>ملاحظة:</strong> سيتم توليد نموذج التحويل للكشف الطبي تلقائياً وفتحه للطباعة.
            بعد إجراء الفحص في المركز، يمكن رفع التقرير المُعبَّأ من شاشة "التقارير الطبية".
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t">
            <button type="button" onClick={onClose} className="btn-secondary">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || !selectedCenterId || centers.length === 0}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? (
                <><Loader size={16} className="animate-spin" /> جاري الإنشاء...</>
              ) : (
                <><Stethoscope size={16} /> إنشاء وطباعة النموذج</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicalReportRequestModal;
