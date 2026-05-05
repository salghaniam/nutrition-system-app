import { useEffect, useState } from 'react';
import { Plus, Eye, CheckCircle, XCircle, Upload, Stethoscope, Clock, FileText, Printer, Trash } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  pending_site_manager: { label: 'تم إصدار التقرير - بانتظار الفحص', color: 'bg-blue-100 text-blue-800', icon: FileText },
  pending_labor_supervisor: { label: 'بانتظار اعتماد مشرف العمالة', color: 'bg-purple-100 text-purple-800', icon: Clock },
  pending_hospital_head: { label: 'بانتظار اعتماد رئيس القسم', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  pending_system_supervisor: { label: 'بانتظار مشرف النظام', color: 'bg-orange-100 text-orange-800', icon: Clock },
  approved: { label: 'معتمد', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const MedicalReports = () => {
  const { user, hasRole } = useAuth();
  const [reports, setReports] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [centers, setCenters] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({});
  const [uploadingFor, setUploadingFor] = useState(null);
  const [reportImage, setReportImage] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, approved

  const canRequest = hasRole('hospital_head', 'labor_supervisor', 'site_manager');
  const canDelete = hasRole('hospital_head', 'labor_supervisor', 'system_admin', 'system_supervisor');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [r, w, c] = await Promise.all([
        api.get('/medical-reports'),
        api.get('/workers'),
        api.get('/medical-centers'),
      ]);
      setReports(r.data.data);
      setWorkers(w.data.data);
      setCenters(c.data.data);
    } catch (e) {}
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/medical-reports', form);
      toast.success('تم إصدار التقرير - يمكن طباعته الآن');
      setShowCreate(false);
      setForm({});
      load();
      
      // فتح النموذج للطباعة فوراً
      const reportId = res.data.data.id;
      setTimeout(() => viewReport(reportId), 500);
    } catch (e) {}
  };

  // عرض/طباعة النموذج
  const viewReport = async (reportId) => {
    try {
      const res = await api.get(`/medical-reports/${reportId}/form`, {
        responseType: 'text',
      });
      const newWindow = window.open('', '_blank', 'width=900,height=1100');
      if (newWindow) {
        newWindow.document.write(res.data);
        newWindow.document.close();
      } else {
        toast.error('يرجى السماح للنوافذ المنبثقة');
      }
    } catch (e) { console.error(e); }
  };

  // حذف التقرير (لإعادة الإصدار)
  const deleteReport = async (id) => {
    if (!confirm('هل تريد حذف هذا التقرير؟ يمكن بعدها إصدار طلب جديد بمركز آخر.')) return;
    try {
      await api.delete(`/medical-reports/${id}`);
      toast.success('تم حذف التقرير');
      load();
    } catch (e) {}
  };

  const upload = async (id) => {
    if (!reportImage) return toast.error('يجب اختيار صورة التقرير');
    try {
      const fd = new FormData();
      fd.append('reportImage', reportImage);
      await api.post(`/medical-reports/${id}/upload`, fd);
      toast.success('تم رفع التقرير');
      setUploadingFor(null);
      setReportImage(null);
      load();
    } catch (e) {}
  };

  const approve = async (id) => {
    if (!confirm('هل أنت متأكد من اعتماد التقرير؟')) return;
    try {
      await api.post(`/medical-reports/${id}/approve`);
      toast.success('تم الاعتماد');
      load();
    } catch (e) {}
  };

  const reject = async (id) => {
    const reason = prompt('سبب الرفض:');
    if (!reason) return;
    try {
      await api.post(`/medical-reports/${id}/reject`, { rejectionReason: reason });
      toast.success('تم الرفض');
      load();
    } catch (e) {}
  };

  // الإجراءات المتاحة لكل تقرير
  const getActions = (report) => {
    const actions = [];
    
    // عرض/طباعة - متاح دائماً للأدوار الثلاثة
    if (canRequest) {
      actions.push({
        label: report.status === 'pending_site_manager' ? 'طباعة النموذج' : 'عرض النموذج',
        icon: Printer,
        color: 'btn-secondary',
        onClick: () => viewReport(report.id),
      });
    }

    // المرحلة 1: تم الإصدار - بانتظار الفحص
    if (report.status === 'pending_site_manager') {
      // رفع التقرير المعبأ - الأدوار الثلاثة
      if (canRequest) {
        actions.push({
          label: 'رفع التقرير بعد الفحص',
          icon: Upload,
          color: 'btn-primary',
          onClick: () => setUploadingFor(report.id),
        });
      }
      // حذف الطلب - مشرف العمالة + رئيس القسم
      if (canDelete && !report.reportImage) {
        actions.push({
          label: 'حذف الطلب',
          icon: Trash,
          color: 'btn-danger',
          onClick: () => deleteReport(report.id),
        });
      }
    }

    // مرحلة 2: مدير الموقع رفع - بانتظار مشرف العمالة
    if (report.status === 'pending_labor_supervisor' && hasRole('labor_supervisor')) {
      actions.push({ label: 'اعتماد', icon: CheckCircle, color: 'btn-success', onClick: () => approve(report.id) });
      actions.push({ label: 'رفض', icon: XCircle, color: 'btn-danger', onClick: () => reject(report.id) });
    }

    // مرحلة 3: مشرف العمالة رفع - بانتظار رئيس القسم
    if (report.status === 'pending_hospital_head' && hasRole('hospital_head')) {
      actions.push({ label: 'اعتماد نهائي', icon: CheckCircle, color: 'btn-success', onClick: () => approve(report.id) });
      actions.push({ label: 'رفض', icon: XCircle, color: 'btn-danger', onClick: () => reject(report.id) });
    }

    // اعتماد سابق (للحفاظ على التوافق)
    if (report.status === 'pending_system_supervisor' && hasRole('system_admin', 'system_supervisor')) {
      actions.push({ label: 'اعتماد نهائي', icon: CheckCircle, color: 'btn-success', onClick: () => approve(report.id) });
      actions.push({ label: 'رفض', icon: XCircle, color: 'btn-danger', onClick: () => reject(report.id) });
    }

    return actions;
  };

  // فلترة التقارير
  const filteredReports = reports.filter((r) => {
    if (filter === 'active') return r.status !== 'approved' && r.status !== 'rejected';
    if (filter === 'approved') return r.status === 'approved';
    if (filter === 'rejected') return r.status === 'rejected';
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Stethoscope size={28} />التقارير الطبية
        </h1>
        {canRequest && (
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={18} />طلب تقرير طبي جديد
          </button>
        )}
      </div>

      {/* فلترة */}
      <div className="flex gap-2 bg-white rounded-xl shadow-soft p-2">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'active', label: 'نشطة' },
          { id: 'approved', label: 'معتمدة' },
          { id: 'rejected', label: 'مرفوضة' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === t.id ? 'bg-moh-primary text-white' : 'text-gray-600 hover:bg-moh-bg-light'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* قائمة التقارير */}
      <div className="space-y-3">
        {filteredReports.map((r) => {
          const cfg = STATUS_CONFIG[r.status] || {};
          const StatusIcon = cfg.icon || FileText;
          return (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono text-xs text-gray-500">#{r.id}</span>
                    <span className="font-mono text-xs text-gray-400">{r.reportNumber}</span>
                    <span className={`badge ${cfg.color}`}>
                      <StatusIcon size={12} className="ml-1 inline" />
                      {cfg.label}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg">{r.worker?.name}</h3>
                  <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                    <p>🏥 المركز الطبي: <strong>{r.medicalCenter?.name}</strong></p>
                    <p>📍 المستشفى: {r.hospital?.name}</p>
                    <p>📅 تاريخ الإصدار: {new Date(r.createdAt).toLocaleDateString('ar-SA-u-nu-latn')}</p>
                    {r.expiryDate && <p className="text-green-700">✅ التقرير ينتهي: {new Date(r.expiryDate).toLocaleDateString('ar-SA-u-nu-latn')}</p>}
                    {r.healthCertificateNumber && (
                      <p className="text-green-700 font-medium">
                        🎫 شهادة صحية: {r.healthCertificateNumber}
                      </p>
                    )}
                  </div>
                  {r.reportImage && (
                    <div className="mt-2">
                      <a href={r.reportImage} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline">
                        📎 التقرير المرفق بعد الفحص
                      </a>
                    </div>
                  )}
                  {r.rejectionReason && (
                    <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded">
                      <strong>سبب الرفض:</strong> {r.rejectionReason}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 min-w-[180px]">
                  {getActions(r).map((a, i) => (
                    <button key={i} onClick={a.onClick} className={`${a.color} text-sm`}>
                      <a.icon size={14} />
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {filteredReports.length === 0 && (
          <div className="text-center py-12 text-gray-400 card">
            <Stethoscope size={48} className="mx-auto mb-3 opacity-50" />
            <p>لا توجد تقارير طبية</p>
          </div>
        )}
      </div>

      {/* Modal إنشاء طلب */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={create} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold">طلب تقرير طبي جديد</h2>
            <div>
              <label className="label">العامل *</label>
              <select required className="input" value={form.workerId || ''} onChange={(e) => setForm({ ...form, workerId: e.target.value })}>
                <option value="">اختر...</option>
                {workers.map((w) => <option key={w.id} value={w.id}>{w.name} - {w.idNumber}</option>)}
              </select>
            </div>
            <div>
              <label className="label">المركز الطبي للفحص *</label>
              <select required className="input" value={form.medicalCenterId || ''} onChange={(e) => setForm({ ...form, medicalCenterId: e.target.value })}>
                <option value="">اختر...</option>
                {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">ملاحظات</label>
              <textarea className="input" rows={3} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">إلغاء</button>
              <button type="submit" className="btn-primary">إنشاء وطباعة النموذج</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal رفع التقرير */}
      {uploadingFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold">رفع التقرير الطبي بعد الفحص</h2>
            <p className="text-sm text-gray-600">
              ارفق صورة التقرير الموقّع والمختوم من المركز الطبي.
            </p>
            <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-moh-primary">
              <Upload size={20} />
              {reportImage ? reportImage.name : 'اختر صورة التقرير'}
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setReportImage(e.target.files[0])} />
            </label>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setUploadingFor(null); setReportImage(null); }} className="btn-secondary">إلغاء</button>
              <button onClick={() => upload(uploadingFor)} className="btn-primary">رفع</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalReports;
