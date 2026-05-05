import { useState, useEffect, useMemo } from 'react';
import { X, ArrowRightLeft, Loader, AlertTriangle, Building2, Briefcase, CheckCircle, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const WorkerTransferModal = ({ worker, onClose, onSuccess }) => {
  const [hospitals, setHospitals] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [form, setForm] = useState({
    toHospitalId: '',
    toJobTitleId: '',
    reason: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [autoMatched, setAutoMatched] = useState(false);

  useEffect(() => { loadHospitals(); }, []);

  // تحميل مسميات المستشفى الجديد
  useEffect(() => {
    if (form.toHospitalId) {
      loadJobTitles(form.toHospitalId);
    } else {
      setJobTitles([]);
      setForm((prev) => ({ ...prev, toJobTitleId: '' }));
      setAutoMatched(false);
    }
  }, [form.toHospitalId]);

  // 🆕 v12: اقتراح تلقائي - ابحث في مسميات المستشفى الجديد عن نفس الاسم
  useEffect(() => {
    if (jobTitles.length > 0 && worker.jobTitle?.name && !form.toJobTitleId) {
      // المهم: نبحث في jobTitles المُحمّلة من المستشفى الجديد فقط
      // إذن أي مسمى نجده هو بالتأكيد ينتمي للمستشفى الجديد
      const matched = jobTitles.find(
        (j) => j.name?.trim() === worker.jobTitle?.name?.trim()
      );
      if (matched) {
        setForm((prev) => ({ ...prev, toJobTitleId: String(matched.id) }));
        setAutoMatched(true);
      }
    }
  }, [jobTitles, worker.jobTitle?.name]);

  const loadHospitals = async () => {
    try {
      const res = await api.get('/hospitals');
      const filtered = (res.data.data || []).filter(h => h.id !== worker.hospitalId);
      setHospitals(filtered);
    } catch (e) {
      toast.error('فشل تحميل قائمة المستشفيات');
    } finally {
      setLoadingHospitals(false);
    }
  };

  const loadJobTitles = async (hospitalId) => {
    setLoadingJobs(true);
    try {
      // 🆕 v12: نطلب فقط مسميات المستشفى الجديد
      const res = await api.get('/job-titles', { params: { hospitalId } });
      const allJobs = res.data.data || [];
      // 🛡️ Frontend safety: تأكد إضافي من أن كلها تنتمي للمستشفى المطلوب
      const safeJobs = allJobs.filter(j => 
        String(j.hospitalId) === String(hospitalId)
      );
      setJobTitles(safeJobs);
    } catch (e) {
      setJobTitles([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  // ترتيب: المطابق أولاً
  const sortedJobTitles = useMemo(() => {
    if (!worker.jobTitle?.name) return jobTitles;
    const matched = [];
    const others = [];
    jobTitles.forEach(j => {
      if (j.name?.trim() === worker.jobTitle?.name?.trim()) {
        matched.push(j);
      } else {
        others.push(j);
      }
    });
    return [...matched, ...others];
  }, [jobTitles, worker.jobTitle?.name]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.toHospitalId) {
      toast.error('يجب اختيار المستشفى');
      return;
    }
    if (!form.toJobTitleId) {
      toast.error('يجب اختيار المسمى الوظيفي الجديد');
      return;
    }

    // 🆕 v12: تأكد إضافي - المسمى المختار ينتمي للمستشفى المنقول إليه
    const selectedJob = jobTitles.find(j => String(j.id) === String(form.toJobTitleId));
    if (!selectedJob) {
      toast.error('المسمى المختار غير صالح');
      return;
    }
    if (String(selectedJob.hospitalId) !== String(form.toHospitalId)) {
      toast.error('خطأ: المسمى لا ينتمي للمستشفى المنقول إليه');
      return;
    }

    const sameJobName = selectedJob.name?.trim() === worker.jobTitle?.name?.trim();

    setLoading(true);
    try {
      const res = await api.post('/worker-transfers', {
        workerId: worker.id,
        toHospitalId: parseInt(form.toHospitalId),
        toJobTitleId: parseInt(form.toJobTitleId),
        // إن كان نفس الاسم → same_job، وإلا different_job
        // ملاحظة: حتى لو same_job، الـ ID سيكون من المستشفى الجديد (حماية)
        transferType: sameJobName ? 'same_job' : 'different_job',
        reason: form.reason,
        notes: form.notes,
      });
      toast.success(res.data.message || 'تم إنشاء طلب النقل');
      onSuccess?.();
      onClose();
    } catch (e) { /* معالج */ }
    finally { setLoading(false); }
  };

  const selectedHospital = hospitals.find(h => h.id === parseInt(form.toHospitalId));
  const selectedJob = jobTitles.find(j => String(j.id) === String(form.toJobTitleId));
  const isSameJobName = selectedJob?.name?.trim() === worker.jobTitle?.name?.trim();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b bg-orange-50 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <ArrowRightLeft size={22} className="text-orange-600" />
            <h2 className="font-bold text-lg text-orange-800">نقل العامل</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 bg-blue-50 border-b">
          <h3 className="font-semibold text-sm text-gray-700 mb-2">📋 الوضع الحالي:</h3>
          <div className="grid grid-cols-1 gap-1 text-sm">
            <div><strong>👤 الاسم:</strong> {worker.name}</div>
            <div><strong>🆔 رقم الهوية:</strong> {worker.idNumber}</div>
            <div><strong>🏥 المستشفى الحالي:</strong> {worker.hospital?.name || '-'}</div>
            <div><strong>💼 المسمى الحالي:</strong> {worker.jobTitle?.name || '-'}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          <div>
            <label className="label flex items-center gap-1">
              <Building2 size={14} />
              المستشفى المنقول إليه *
            </label>
            {loadingHospitals ? (
              <div className="text-center py-3"><Loader className="animate-spin inline" size={16} /></div>
            ) : hospitals.length === 0 ? (
              <div className="bg-orange-50 border border-orange-200 rounded p-2 text-sm text-orange-800">
                ⚠️ لا توجد مستشفيات أخرى متاحة
              </div>
            ) : (
              <select
                required
                className="input"
                value={form.toHospitalId}
                onChange={(e) => {
                  setForm({ ...form, toHospitalId: e.target.value, toJobTitleId: '' });
                  setAutoMatched(false);
                }}
              >
                <option value="">اختر المستشفى...</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            )}
          </div>

          {form.toHospitalId && (
            <div>
              <label className="label flex items-center gap-1">
                <Briefcase size={14} />
                المسمى الوظيفي في {selectedHospital?.name} *
              </label>

              {loadingJobs ? (
                <div className="text-center py-3"><Loader className="animate-spin inline" size={16} /></div>
              ) : jobTitles.length === 0 ? (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <strong>لا توجد مسميات وظيفية في {selectedHospital?.name}</strong>
                      <p className="mt-1">
                        لا يمكن إكمال النقل قبل إضافة مسميات وظيفية لهذا المستشفى.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/lookups"
                    onClick={onClose}
                    className="btn-primary w-full justify-center text-sm"
                  >
                    <Plus size={14} />
                    إضافة مسميات وظيفية للمستشفى
                  </Link>
                  <p className="text-xs text-gray-600 text-center">
                    بعد الإضافة، أعد فتح نافذة النقل لإكمال العملية
                  </p>
                </div>
              ) : (
                <>
                  <select
                    required
                    className="input"
                    value={form.toJobTitleId}
                    onChange={(e) => {
                      setForm({ ...form, toJobTitleId: e.target.value });
                      setAutoMatched(false);
                    }}
                  >
                    <option value="">اختر المسمى الوظيفي...</option>
                    {sortedJobTitles.map((j) => {
                      const isMatch = j.name?.trim() === worker.jobTitle?.name?.trim();
                      return (
                        <option key={j.id} value={j.id}>
                          {isMatch ? `✨ ${j.name} (مطابق للحالي)` : j.name}
                        </option>
                      );
                    })}
                  </select>

                  {autoMatched && (
                    <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded p-2 text-sm text-emerald-800 flex items-start gap-2">
                      <Sparkles size={14} className="mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>تم اختيار مسمى مطابق من {selectedHospital?.name}</strong>
                        <div className="text-xs mt-0.5">
                          العامل سيرتبط بمسمى مستقل في المستشفى الجديد - يمكن تعديله لاحقاً دون تأثير على المستشفى السابق
                        </div>
                      </div>
                    </div>
                  )}

                  {form.toJobTitleId && !isSameJobName && (
                    <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2 text-sm text-yellow-800 flex items-center gap-2">
                      <AlertTriangle size={14} />
                      المسمى الجديد <strong>"{selectedJob?.name}"</strong> مختلف عن الحالي <strong>"{worker.jobTitle?.name}"</strong>
                    </div>
                  )}

                  {form.toJobTitleId && isSameJobName && !autoMatched && (
                    <div className="mt-2 bg-green-50 border border-green-200 rounded p-2 text-sm text-green-800 flex items-center gap-2">
                      <CheckCircle size={14} />
                      المسمى الوظيفي بنفس الاسم - مرتبط بالمستشفى الجديد
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div>
            <label className="label">سبب النقل (اختياري)</label>
            <textarea
              className="input"
              rows={2}
              placeholder="مثال: نقل وظيفي حسب احتياج العمل..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          <div>
            <label className="label">ملاحظات (اختياري)</label>
            <textarea
              className="input"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded p-3 flex items-start gap-2 text-sm text-orange-800">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <strong>ملاحظة:</strong>
              <ul className="mt-1 list-disc list-inside text-xs">
                <li>سيتم نقل العامل بكل بياناته ومرفقاته</li>
                <li>سيتم نقل التقارير الطبية والشهادات الصحية</li>
                <li>الطلب يحتاج اعتماد مشرف النظام (إن لم تكن مشرف نظام)</li>
                <li>✨ المسمى الوظيفي سيرتبط بمستشفى الوجهة (مستقل عن المستشفى السابق)</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t">
            <button type="button" onClick={onClose} className="btn-secondary">إلغاء</button>
            <button
              type="submit"
              disabled={loading || !form.toHospitalId || !form.toJobTitleId || jobTitles.length === 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader size={16} className="animate-spin" /> جاري...</>
              ) : (
                <><ArrowRightLeft size={16} /> إرسال طلب النقل</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkerTransferModal;
