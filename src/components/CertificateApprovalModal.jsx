import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Loader, FileText, AlertTriangle, Eye, Calendar, User, Briefcase, Building2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

/**
 * نافذة اعتماد الشهادة الصحية
 * - تعرض التقرير الطبي المرفق (PDF/صورة) للمراجعة
 * - زر اعتماد + زر رفض
 */
const CertificateApprovalModal = ({ certId, onClose, onSuccess }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (certId) loadData();
  }, [certId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/health-certificates/${certId}/approval-info`);
      setData(res.data.data);
    } catch (e) {
      toast.error('فشل تحميل بيانات الطلب');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('هل أنت متأكد من اعتماد الشهادة؟')) return;
    setSubmitting(true);
    try {
      await api.post(`/health-certificates/${certId}/approve`);
      toast.success('تم الاعتماد بنجاح');
      onSuccess?.();
      onClose();
    } catch (e) {
      // معالج
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('يرجى كتابة سبب الرفض');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/health-certificates/${certId}/reject`, { rejectionReason: rejectReason });
      toast.success('تم الرفض');
      onSuccess?.();
      onClose();
    } catch (e) {
      // معالج
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const isExpired = (d) => d && new Date(d) < new Date();

  if (!certId) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* الترويسة */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-l from-blue-50 to-white">
          <div className="flex items-center gap-2">
            <CheckCircle size={22} className="text-blue-600" />
            <h2 className="font-bold text-lg text-blue-900">اعتماد الشهادة الصحية</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={20} />
          </button>
        </div>

        {/* محتوى النافذة */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {loading ? (
            <div className="text-center py-12">
              <Loader size={32} className="animate-spin mx-auto text-moh-primary" />
              <p className="text-sm text-gray-500 mt-2">جاري تحميل التقرير...</p>
            </div>
          ) : !data ? (
            <div className="text-center py-12 text-gray-400">
              <p>لا توجد بيانات</p>
            </div>
          ) : (
            <>
              {/* بيانات العامل */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <User size={18} />بيانات العامل
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" />
                    <span className="text-gray-600">الاسم:</span>
                    <strong>{data.worker?.name}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">رقم الهوية:</span>
                    <strong className="font-mono">{data.worker?.idNumber}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} className="text-gray-400" />
                    <span className="text-gray-600">المسمى:</span>
                    <strong>{data.worker?.jobTitle?.name || '-'}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-gray-400" />
                    <span className="text-gray-600">المستشفى:</span>
                    <strong>{data.worker?.hospital?.name || data.certificate?.hospital?.name || '-'}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">الجنسية:</span>
                    <strong>{data.worker?.nationality?.name || '-'}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">رقم الشهادة:</span>
                    <strong className="font-mono text-blue-700">{data.certificate?.certificateNumber}</strong>
                  </div>
                </div>
              </div>

              {/* تنبيه إذا التقرير منتهي */}
              {data.reportExpiryDate && isExpired(data.reportExpiryDate) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <strong>⚠️ تنبيه:</strong> التقرير الطبي للعامل منتهي الصلاحية ({formatDate(data.reportExpiryDate)}).
                    لا يجب اعتماد شهادة بناءً على تقرير منتهي.
                  </div>
                </div>
              )}

              {/* عرض التقرير الطبي */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={20} className="text-emerald-700" />
                    <h3 className="font-bold text-emerald-900">التقرير الطبي بعد الفحص</h3>
                  </div>
                  {data.reportExpiryDate && (
                    <div className="flex items-center gap-1 text-xs">
                      <Calendar size={12} className="text-gray-400" />
                      <span className="text-gray-600">ينتهي:</span>
                      <strong className={isExpired(data.reportExpiryDate) ? 'text-red-600' : 'text-green-700'}>
                        {formatDate(data.reportExpiryDate)}
                      </strong>
                    </div>
                  )}
                </div>

                {data.reportImagePath ? (
                  <ReportViewer path={data.reportImagePath} />
                ) : (
                  <div className="p-12 text-center text-gray-400">
                    <FileText size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="font-medium">لا يوجد ملف تقرير مرفق</p>
                    <p className="text-xs mt-1">لا يمكن الاعتماد بدون مراجعة التقرير الطبي</p>
                  </div>
                )}
              </div>

              {/* نموذج رفض */}
              {showRejectReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <label className="label text-red-900">سبب الرفض *</label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="اكتب سبب رفض الشهادة..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* أزرار الإجراءات */}
        <div className="border-t bg-gray-50 p-4 flex flex-wrap gap-2 justify-end">
          {!loading && data && (
            <>
              {!showRejectReason ? (
                <>
                  <button
                    onClick={onClose}
                    disabled={submitting}
                    className="btn-secondary"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => setShowRejectReason(true)}
                    disabled={submitting}
                    className="btn-danger"
                  >
                    <XCircle size={16} />رفض
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={submitting || !data.reportImagePath}
                    className="btn-success disabled:opacity-50"
                    title={!data.reportImagePath ? 'لا يمكن الاعتماد بدون تقرير' : ''}
                  >
                    {submitting ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    اعتماد الشهادة
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setShowRejectReason(false); setRejectReason(''); }}
                    className="btn-secondary"
                  >
                    عودة
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={submitting || !rejectReason.trim()}
                    className="btn-danger disabled:opacity-50"
                  >
                    {submitting ? <Loader size={16} className="animate-spin" /> : <XCircle size={16} />}
                    تأكيد الرفض
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ============ مكون عرض التقرير (PDF أو صورة) ============
const ReportViewer = ({ path }) => {
  const url = path.startsWith('http') ? path : window.location.origin + path;
  const isPdf = path.toLowerCase().endsWith('.pdf');

  return (
    <div className="bg-gray-100">
      {isPdf ? (
        <div className="relative">
          <iframe
            src={url}
            className="w-full bg-white"
            style={{ height: '500px' }}
            title="التقرير الطبي"
          />
          <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-2 text-xs text-yellow-800 flex items-center justify-between">
            <span>📄 تقرير PDF - يمكنك التمرير لقراءة كامل المحتوى</span>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-700 hover:underline flex items-center gap-1"
            >
              <Eye size={12} />فتح في تبويب جديد
            </a>
          </div>
        </div>
      ) : (
        <div className="relative">
          <img
            src={url}
            alt="التقرير الطبي"
            className="w-full max-h-[500px] object-contain bg-white"
          />
          <div className="bg-blue-50 border-t border-blue-200 px-4 py-2 text-xs text-blue-800 flex items-center justify-between">
            <span>🖼️ صورة التقرير الطبي</span>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-700 hover:underline flex items-center gap-1"
            >
              <Eye size={12} />فتح في تبويب جديد
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateApprovalModal;
