import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, Filter, Users, FileHeart, Stethoscope, Printer, Trash, ArrowRightLeft, FileText } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import MedicalReportRequestModal from '../components/MedicalReportRequestModal';
import HealthCertificateRequestModal from '../components/HealthCertificateRequestModal';
import WorkerTransferModal from '../components/WorkerTransferModal';

const WorkersList = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '', nationalityId: '', jobTitleId: '', religionId: '', idNumber: '', hospitalId: '',
  });
  const [lookups, setLookups] = useState({ nationalities: [], jobTitles: [], religions: [], hospitals: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [reportModalWorker, setReportModalWorker] = useState(null);
  const [certModalWorker, setCertModalWorker] = useState(null);
  const [transferModalWorker, setTransferModalWorker] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeReports, setActiveReports] = useState({});
  const [activeCertificates, setActiveCertificates] = useState({});
  const [approvedReports, setApprovedReports] = useState({});
  const [approvedCertificates, setApprovedCertificates] = useState({});

  const canRequest = ['hospital_head', 'labor_supervisor', 'site_manager'].includes(currentUser?.role);
  const canDelete = ['hospital_head', 'labor_supervisor', 'system_admin', 'system_supervisor'].includes(currentUser?.role);
  const canTransfer = ['hospital_head', 'system_admin', 'system_supervisor'].includes(currentUser?.role);

  useEffect(() => { loadCurrentUser(); loadLookups(); }, []);
  useEffect(() => { loadWorkers(); }, [filters]);

  const loadCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setCurrentUser(res.data.data || res.data.user);
    } catch (e) {}
  };

  const loadLookups = async () => {
    try {
      const [n, j, r, h] = await Promise.all([
        api.get('/nationalities'), api.get('/job-titles'),
        api.get('/religions'), api.get('/hospitals'),
      ]);
      setLookups({
        nationalities: n.data.data, jobTitles: j.data.data,
        religions: r.data.data, hospitals: h.data.data,
      });
    } catch (e) {}
  };

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v));
      const res = await api.get('/workers', { params });
      setWorkers(res.data.data);

      // التقارير
      try {
        const r = await api.get('/medical-reports');
        const active = {};
        const approved = {};
        (r.data.data || []).forEach((rep) => {
          if (rep.status !== 'approved' && rep.status !== 'rejected') {
            active[rep.workerId] = rep;
          } else if (rep.status === 'approved') {
            if (!approved[rep.workerId] || new Date(rep.createdAt) > new Date(approved[rep.workerId].createdAt)) {
              approved[rep.workerId] = rep;
            }
          }
        });
        setActiveReports(active);
        setApprovedReports(approved);
      } catch (e) {}

      // الشهادات
      try {
        const c = await api.get('/health-certificates');
        const active = {};
        const approved = {};
        (c.data.data || []).forEach((cert) => {
          if (cert.status !== 'approved' && cert.status !== 'rejected') {
            active[cert.workerId] = cert;
          } else if (cert.status === 'approved') {
            if (!approved[cert.workerId] || new Date(cert.createdAt) > new Date(approved[cert.workerId].createdAt)) {
              approved[cert.workerId] = cert;
            }
          }
        });
        setActiveCertificates(active);
        setApprovedCertificates(approved);
      } catch (e) {}
    } catch (e) {}
    finally { setLoading(false); }
  };

  // ============ دوال العرض - داخل المكون ✅ ============
  
  // عرض التقرير الطبي المعتمد (الملف المرفق بعد الفحص)
  const handleViewApprovedReport = (worker) => {
    const path = worker?.medicalReportImage;
    if (!path) {
      toast.error('لا يوجد ملف مرفق للتقرير');
      return;
    }
    const url = path.startsWith('http') ? path : window.location.origin + path;
    window.open(url, '_blank');
  };

  // عرض الشهادة الصحية المعتمدة (نموذج النظام)
  const handleViewApprovedCertificate = async (certId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/health-certificates/${certId}/form`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        toast.error('فشل عرض الشهادة');
        return;
      }
      const html = await res.text();
      const w = window.open('', '_blank', 'width=900,height=1200');
      if (w) {
        w.document.write(html);
        w.document.close();
      } else {
        toast.error('تأكد من السماح للنوافذ المنبثقة');
      }
    } catch (e) {
      toast.error('فشل عرض الشهادة');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا العامل؟')) return;
    try {
      await api.delete(`/workers/${id}`);
      toast.success('تم الحذف');
      loadWorkers();
    } catch (e) {}
  };

  // عرض التقرير النشط (يستخدم /form للنماذج قبل الفحص)
  const handleViewReport = async (reportId) => {
    try {
      const res = await api.get(`/medical-reports/${reportId}/form`, { responseType: 'text' });
      const w = window.open('', '_blank', 'width=900,height=1100');
      if (w) { w.document.write(res.data); w.document.close(); }
    } catch (e) {}
  };

  const handleViewCertificate = async (certId) => {
    try {
      const res = await api.get(`/health-certificates/${certId}/form`, { responseType: 'text' });
      const w = window.open('', '_blank', 'width=900,height=1200');
      if (w) { w.document.write(res.data); w.document.close(); }
    } catch (e) {}
  };

  const handleDeleteReport = async (id) => {
    if (!confirm('حذف التقرير؟')) return;
    try {
      await api.delete(`/medical-reports/${id}`);
      toast.success('تم الحذف');
      loadWorkers();
    } catch (e) {}
  };

  const handleDeleteCertificate = async (id) => {
    if (!confirm('حذف طلب الشهادة؟')) return;
    try {
      await api.delete(`/health-certificates/${id}`);
      toast.success('تم الحذف');
      loadWorkers();
    } catch (e) {}
  };

  const isExpired = (date) => date && new Date(date) < new Date();
  const isExpiringSoon = (date) => {
    if (!date) return false;
    const days = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
    return days > 0 && days < 30;
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const getMedicalStatus = (w) => {
    const active = activeReports[w.id];
    if (active) {
      const map = {
        pending_site_manager: { label: 'تم إصدار التقرير', class: 'bg-blue-100 text-blue-800', stage: 'issued' },
        pending_labor_supervisor: { label: 'بانتظار مشرف العمالة', class: 'bg-purple-100 text-purple-800', stage: 'awaiting_labor' },
        pending_hospital_head: { label: 'بانتظار رئيس القسم', class: 'bg-orange-100 text-orange-800', stage: 'awaiting_head' },
      };
      return { ...(map[active.status] || {}), report: active };
    }
    if (!w.medicalReportExpiryDate) return { label: 'لم يُصدر', class: 'bg-gray-100 text-gray-600', stage: 'none' };
    if (isExpired(w.medicalReportExpiryDate)) return { label: 'منتهي', class: 'badge-danger', stage: 'expired', date: w.medicalReportExpiryDate };
    if (isExpiringSoon(w.medicalReportExpiryDate)) return { label: 'قريب الانتهاء', class: 'badge-warning', stage: 'expiring', date: w.medicalReportExpiryDate };
    return { label: 'ساري', class: 'badge-success', stage: 'valid', date: w.medicalReportExpiryDate };
  };

  const getHealthStatus = (w) => {
    const active = activeCertificates[w.id];
    if (active) {
      const map = {
        pending_labor_supervisor: { label: 'بانتظار مشرف العمالة', class: 'bg-purple-100 text-purple-800', stage: 'awaiting' },
        pending_hospital_head: { label: 'بانتظار رئيس القسم', class: 'bg-orange-100 text-orange-800', stage: 'awaiting' },
        pending_system_supervisor: { label: 'بانتظار مشرف النظام', class: 'bg-yellow-100 text-yellow-800', stage: 'awaiting' },
      };
      return { ...(map[active.status] || {}), cert: active };
    }
    if (!w.healthCertificateExpiryDate) return { label: 'لم تُصدر', class: 'bg-gray-100 text-gray-600', stage: 'none' };
    if (isExpired(w.healthCertificateExpiryDate)) return { label: 'منتهية', class: 'badge-danger', stage: 'expired', date: w.healthCertificateExpiryDate };
    if (isExpiringSoon(w.healthCertificateExpiryDate)) return { label: 'قريبة الانتهاء', class: 'badge-warning', stage: 'expiring', date: w.healthCertificateExpiryDate };
    return { label: 'سارية', class: 'badge-success', stage: 'valid', date: w.healthCertificateExpiryDate };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users size={28} />إدارة العمالة
          </h1>
          <p className="text-gray-500 text-sm mt-1">{workers.length} عامل</p>
        </div>
        <Link to="/workers/new" className="btn-primary">
          <Plus size={18} />إضافة عامل جديد
        </Link>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text" placeholder="البحث بالاسم..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input pr-10"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary">
            <Filter size={18} />تصفية
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-gray-100">
            <input placeholder="رقم الهوية" value={filters.idNumber} onChange={(e) => setFilters({ ...filters, idNumber: e.target.value })} className="input" />
            <select className="input" value={filters.nationalityId} onChange={(e) => setFilters({ ...filters, nationalityId: e.target.value })}>
              <option value="">الجنسية</option>
              {lookups.nationalities.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
            <select className="input" value={filters.jobTitleId} onChange={(e) => setFilters({ ...filters, jobTitleId: e.target.value })}>
              <option value="">المسمى</option>
              {lookups.jobTitles.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
            <select className="input" value={filters.religionId} onChange={(e) => setFilters({ ...filters, religionId: e.target.value })}>
              <option value="">الديانة</option>
              {lookups.religions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select className="input" value={filters.hospitalId} onChange={(e) => setFilters({ ...filters, hospitalId: e.target.value })}>
              <option value="">المستشفى</option>
              {lookups.hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-moh-primary border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : workers.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users size={48} className="mx-auto mb-3 opacity-50" />
            <p>لا يوجد عمالة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-moh-bg-light text-right">
                <tr>
                  <th className="p-3 text-sm font-semibold text-moh-primary">الاسم</th>
                  <th className="p-3 text-sm font-semibold text-moh-primary">رقم الهوية</th>
                  <th className="p-3 text-sm font-semibold text-moh-primary">الجنسية</th>
                  <th className="p-3 text-sm font-semibold text-moh-primary">المسمى</th>
                  <th className="p-3 text-sm font-semibold text-moh-primary">المستشفى</th>
                  <th className="p-3 text-sm font-semibold text-moh-primary">التقرير الطبي</th>
                  <th className="p-3 text-sm font-semibold text-moh-primary">الشهادة الصحية</th>
                  <th className="p-3 text-sm font-semibold text-moh-primary">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => {
                  const ms = getMedicalStatus(w);
                  const hs = getHealthStatus(w);
                  const hasActiveReport = !!ms.report;
                  const hasActiveCert = !!hs.cert;
                  const approvedReport = approvedReports[w.id];
                  const approvedCert = approvedCertificates[w.id];
                  const canRequestNewReport = canRequest && !hasActiveReport && (ms.stage === 'none' || ms.stage === 'expired' || ms.stage === 'expiring');
                  const canRequestNewCert = canRequest && !hasActiveCert && (hs.stage === 'none' || hs.stage === 'expired' || hs.stage === 'expiring');

                  return (
                    <tr key={w.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {w.personalImage ? (
                            <img src={w.personalImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-moh-primary text-white flex items-center justify-center text-xs">
                              {w.name?.charAt(0)}
                            </div>
                          )}
                          <span className="font-medium">{w.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm font-mono">{w.idNumber}</td>
                      <td className="p-3 text-sm">{w.nationality?.name || '-'}</td>
                      <td className="p-3 text-sm">{w.jobTitle?.name || '-'}</td>
                      <td className="p-3 text-sm">{w.hospital?.name || '-'}</td>
                      <td className="p-3 text-sm">
                        <div>
                          <span className={`${ms.class} px-2 py-0.5 rounded text-xs font-semibold inline-block`}>
                            {ms.label}
                          </span>
                          {ms.date && (ms.stage === 'valid' || ms.stage === 'expiring' || ms.stage === 'expired') && (
                            <div className="text-xs text-gray-500 mt-1">ينتهي: {formatDate(ms.date)}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        <div>
                          <span className={`${hs.class} px-2 py-0.5 rounded text-xs font-semibold inline-block`}>
                            {hs.label}
                          </span>
                          {hs.date && (hs.stage === 'valid' || hs.stage === 'expiring' || hs.stage === 'expired') && (
                            <div className="text-xs text-gray-500 mt-1">تنتهي: {formatDate(hs.date)}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          <Link to={`/workers/${w.id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="عرض">
                            <Eye size={16} />
                          </Link>
                          <Link to={`/workers/${w.id}/edit`} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="تعديل">
                            <Edit size={16} />
                          </Link>

                          {/* عرض التقرير الطبي المعتمد - الملف المرفق بعد الفحص */}
                          {approvedReport && (
                            <button
                              onClick={() => handleViewApprovedReport(w)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="عرض التقرير الطبي المعتمد"
                            >
                              <FileText size={16} />
                            </button>
                          )}

                          {/* عرض الشهادة الصحية المعتمدة */}
                          {approvedCert && (
                            <button
                              onClick={() => handleViewApprovedCertificate(approvedCert.id)}
                              className="p-1.5 text-blue-700 hover:bg-blue-50 rounded"
                              title="عرض الشهادة الصحية المعتمدة"
                            >
                              <FileHeart size={16} />
                            </button>
                          )}

                          {/* التقرير - الحالة النشطة */}
                          {hasActiveReport && canRequest && (
                            <button onClick={() => handleViewReport(ms.report.id)} className="p-1.5 text-blue-700 hover:bg-blue-50 rounded" title="طباعة التقرير">
                              <Printer size={16} />
                            </button>
                          )}
                          {hasActiveReport && canDelete && ms.stage === 'issued' && (
                            <button onClick={() => handleDeleteReport(ms.report.id)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="حذف التقرير">
                              <Trash size={16} />
                            </button>
                          )}
                          {canRequestNewReport && (
                            <button
                              onClick={() => setReportModalWorker(w)}
                              className={`p-1.5 rounded ${ms.stage === 'expired' || ms.stage === 'expiring' ? 'text-orange-600 hover:bg-orange-50 animate-pulse' : 'text-purple-600 hover:bg-purple-50'}`}
                              title="طلب تقرير طبي"
                            >
                              <Stethoscope size={16} />
                            </button>
                          )}

                          {/* الشهادة - الحالة النشطة */}
                          {hasActiveCert && canDelete && (
                            <button onClick={() => handleDeleteCertificate(hs.cert.id)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="حذف طلب الشهادة">
                              <Trash size={16} />
                            </button>
                          )}
                          {canRequestNewCert && (
                            <button
                              onClick={() => setCertModalWorker(w)}
                              className="p-1.5 text-pink-600 hover:bg-pink-50 rounded"
                              title="طلب شهادة صحية"
                            >
                              <FileHeart size={16} />
                            </button>
                          )}

                          {/* نقل العامل */}
                          {canTransfer && (
                            <button
                              onClick={() => setTransferModalWorker(w)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                              title="نقل العامل"
                            >
                              <ArrowRightLeft size={16} />
                            </button>
                          )}

                          <button onClick={() => handleDelete(w.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="حذف">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reportModalWorker && (
        <MedicalReportRequestModal
          worker={reportModalWorker}
          onClose={() => setReportModalWorker(null)}
          onSuccess={loadWorkers}
        />
      )}
      {certModalWorker && (
        <HealthCertificateRequestModal
          worker={certModalWorker}
          onClose={() => setCertModalWorker(null)}
          onSuccess={loadWorkers}
        />
      )}
      {transferModalWorker && (
        <WorkerTransferModal
          worker={transferModalWorker}
          onClose={() => setTransferModalWorker(null)}
          onSuccess={loadWorkers}
        />
      )}
    </div>
  );
};

export default WorkersList;
