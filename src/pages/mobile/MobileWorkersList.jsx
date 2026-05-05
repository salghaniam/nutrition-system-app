import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Eye, Edit, Trash2, Filter, Users, FileHeart, Stethoscope, 
  ArrowRightLeft, X, Printer, FileText
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  MobileSearchBar, MobileEmptyState, MobileLoadingState, 
  MobileWorkerCard, MobileFAB, MobileBadge 
} from '../../components/mobile/MobileUI';
import HealthCertificateRequestModal from '../../components/HealthCertificateRequestModal';
import MedicalReportRequestModal from '../../components/MedicalReportRequestModal';
import WorkerTransferModal from '../../components/WorkerTransferModal';

const MobileWorkersList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    nationalityId: '',
    jobTitleId: '',
    hospitalId: '',
  });
  
  const [lookups, setLookups] = useState({
    nationalities: [],
    jobTitles: [],
    hospitals: [],
  });

  // 🆕 v22.2: حالة الشهادات والتقارير لكل عامل (مماثل WorkersList الديسكتوب)
  const [activeReports, setActiveReports] = useState({});
  const [activeCertificates, setActiveCertificates] = useState({});
  const [approvedReports, setApprovedReports] = useState({});
  const [approvedCertificates, setApprovedCertificates] = useState({});

  // Modals
  const [certModalWorker, setCertModalWorker] = useState(null);
  const [reportModalWorker, setReportModalWorker] = useState(null);
  const [transferModalWorker, setTransferModalWorker] = useState(null);

  // Permissions
  const canRequest = ['hospital_head', 'labor_supervisor', 'site_manager'].includes(user?.role);
  const canDelete = ['hospital_head', 'labor_supervisor', 'system_admin', 'system_supervisor'].includes(user?.role);
  const canTransfer = ['hospital_head', 'system_admin', 'system_supervisor'].includes(user?.role);
  const canAdd = ['hospital_head', 'labor_supervisor', 'system_admin'].includes(user?.role);

  useEffect(() => {
    loadWorkers();
    loadLookups();
    loadCertificatesAndReports();
  }, [filters]);

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.nationalityId) params.nationalityId = filters.nationalityId;
      if (filters.jobTitleId) params.jobTitleId = filters.jobTitleId;
      if (filters.hospitalId) params.hospitalId = filters.hospitalId;
      
      const res = await api.get('/workers', { params });
      setWorkers(res.data.data || []);
    } catch (e) {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const loadLookups = async () => {
    try {
      const [nats, jobs, hosps] = await Promise.all([
        api.get('/nationalities'),
        api.get('/job-titles'),
        api.get('/hospitals').catch(() => ({ data: { data: [] } })),
      ]);
      setLookups({
        nationalities: nats.data.data || [],
        jobTitles: jobs.data.data || [],
        hospitals: hosps.data.data || [],
      });
    } catch (e) {}
  };

  // 🆕 v22.2: تحميل الشهادات والتقارير لتحديد الأزرار المعروضة
  const loadCertificatesAndReports = async () => {
    try {
      // الشهادات الفعالة (pending/approved)
      const certs = await api.get('/health-certificates');
      const certsList = certs.data.data || [];
      
      const activeCs = {};
      const approvedCs = {};
      certsList.forEach(c => {
        if (c.status === 'approved') {
          if (!approvedCs[c.workerId]) approvedCs[c.workerId] = c;
        } else if (['pending', 'pending_approval'].includes(c.status)) {
          if (!activeCs[c.workerId]) activeCs[c.workerId] = c;
        }
      });
      setActiveCertificates(activeCs);
      setApprovedCertificates(approvedCs);

      // التقارير
      const reports = await api.get('/medical-reports').catch(() => ({ data: { data: [] } }));
      const reportsList = reports.data.data || [];
      
      const activeRs = {};
      const approvedRs = {};
      reportsList.forEach(r => {
        if (r.status === 'approved') {
          if (!approvedRs[r.workerId]) approvedRs[r.workerId] = r;
        } else if (['pending', 'pending_approval'].includes(r.status)) {
          if (!activeRs[r.workerId]) activeRs[r.workerId] = r;
        }
      });
      setActiveReports(activeRs);
      setApprovedReports(approvedRs);
    } catch (e) {}
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
    try {
      await api.delete(`/workers/${id}`);
      toast.success('تم الحذف');
      loadWorkers();
    } catch (e) {
      toast.error('فشل الحذف');
    }
  };

  // 🆕 v22.2: عرض الشهادة المعتمدة (نفس منطق WorkersList الديسكتوب)
  const handleViewApprovedCertificate = async (certId) => {
    try {
      const res = await api.get(`/health-certificates/${certId}/form`, {
        responseType: 'text'
      });
      const w = window.open('', '_blank', 'width=900,height=1200');
      if (w) {
        w.document.write(res.data);
        w.document.close();
      } else {
        toast.error('السماح للنوافذ المنبثقة مطلوب');
      }
    } catch (e) {
      toast.error('فشل عرض الشهادة');
    }
  };

  const handleViewApprovedReport = async (reportId) => {
    try {
      const res = await api.get(`/medical-reports/${reportId}/form`, {
        responseType: 'text'
      });
      const w = window.open('', '_blank', 'width=900,height=1100');
      if (w) {
        w.document.write(res.data);
        w.document.close();
      }
    } catch (e) {
      toast.error('فشل عرض التقرير');
    }
  };

  const filteredWorkers = workers.filter(w => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = w.fullName || w.name || '';
    return (
      name.toLowerCase().includes(q) ||
      w.idNumber?.includes(q) ||
      w.phone?.includes(q)
    );
  });

  // 🆕 v22.2: بناء الإجراءات بناءً على حالة الشهادات
  const getActions = (worker) => {
    const actions = [];
    
    actions.push({
      icon: Eye, label: 'عرض', color: 'blue',
      onClick: () => navigate(`/workers/${worker.id}`),
    });

    // الشهادة الصحية - منطق ذكي
    const approvedCert = approvedCertificates[worker.id];
    const activeCert = activeCertificates[worker.id];
    
    if (approvedCert) {
      // ✅ شهادة معتمدة → زر "عرض الشهادة"
      actions.push({
        icon: FileHeart, label: 'عرض الشهادة', color: 'green',
        onClick: () => handleViewApprovedCertificate(approvedCert.id),
      });
    } else if (activeCert) {
      // ⏳ طلب قيد المعالجة → معلومة فقط
      actions.push({
        icon: FileHeart, label: 'بانتظار الاعتماد', color: 'yellow',
        onClick: () => toast('الطلب قيد المراجعة', { icon: '⏳' }),
      });
    } else if (canRequest) {
      // ➕ لا توجد شهادة → زر "طلب شهادة"
      actions.push({
        icon: FileHeart, label: 'طلب شهادة', color: 'green',
        onClick: () => setCertModalWorker(worker),
      });
    }

    // التقرير الطبي - نفس المنطق
    const approvedReport = approvedReports[worker.id];
    const activeReport = activeReports[worker.id];
    
    if (approvedReport) {
      actions.push({
        icon: Stethoscope, label: 'عرض التقرير', color: 'yellow',
        onClick: () => handleViewApprovedReport(approvedReport.id),
      });
    } else if (activeReport) {
      actions.push({
        icon: Stethoscope, label: 'تقرير قيد المعالجة', color: 'yellow',
        onClick: () => toast('الطلب قيد المراجعة', { icon: '⏳' }),
      });
    } else if (canRequest) {
      actions.push({
        icon: Stethoscope, label: 'طلب تقرير', color: 'yellow',
        onClick: () => setReportModalWorker(worker),
      });
    }

    if (canTransfer) {
      actions.push({
        icon: ArrowRightLeft, label: 'نقل', color: 'blue',
        onClick: () => setTransferModalWorker(worker),
      });
    }
    
    if (canDelete) {
      actions.push({
        icon: Trash2, label: 'حذف', color: 'red',
        onClick: () => handleDelete(worker.id, worker.fullName || worker.name),
      });
    }
    
    return actions;
  };

  // Status badge
  const getStatusBadge = (worker) => {
    const cert = approvedCertificates[worker.id];
    if (!cert) return <MobileBadge color="gray">لا توجد شهادة</MobileBadge>;
    
    const expDate = cert.expiryDate ? new Date(cert.expiryDate) : null;
    if (!expDate) return <MobileBadge color="gray">—</MobileBadge>;
    
    const daysLeft = Math.floor((expDate - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return <MobileBadge color="red">منتهية</MobileBadge>;
    if (daysLeft < 30) return <MobileBadge color="yellow">قريبة الانتهاء</MobileBadge>;
    return <MobileBadge color="green">سارية</MobileBadge>;
  };

  const activeFiltersCount = Object.values(filters).filter(v => v).length;

  return (
    <div>
      <MobileSearchBar
        value={search}
        onChange={setSearch}
        placeholder="ابحث بالاسم، رقم الهوية..."
      />

      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
            activeFiltersCount > 0 ? 'bg-moh-primary text-white' : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          <Filter size={16} />
          فلترة
          {activeFiltersCount > 0 && (
            <span className="bg-white text-moh-primary rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>
        <div className="text-xs text-gray-500">{filteredWorkers.length} عامل</div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl p-3 mb-3 space-y-2 border border-gray-200">
          <select
            value={filters.nationalityId}
            onChange={(e) => setFilters({ ...filters, nationalityId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="">كل الجنسيات</option>
            {lookups.nationalities.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
          
          <select
            value={filters.jobTitleId}
            onChange={(e) => setFilters({ ...filters, jobTitleId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="">كل المسميات الوظيفية</option>
            {lookups.jobTitles.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>
          
          {['system_admin', 'system_supervisor'].includes(user?.role) && (
            <select
              value={filters.hospitalId}
              onChange={(e) => setFilters({ ...filters, hospitalId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">كل المستشفيات</option>
              {lookups.hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          )}
          
          {activeFiltersCount > 0 && (
            <button
              onClick={() => setFilters({ nationalityId: '', jobTitleId: '', hospitalId: '' })}
              className="w-full text-red-600 text-sm py-1 hover:bg-red-50 rounded-lg flex items-center justify-center gap-1"
            >
              <X size={14} /> مسح الفلاتر
            </button>
          )}
        </div>
      )}

      {loading ? (
        <MobileLoadingState />
      ) : filteredWorkers.length === 0 ? (
        <MobileEmptyState
          icon={Users}
          title={search ? 'لا توجد نتائج' : 'لا يوجد عمال'}
          message={search ? 'جرّب بحثاً مختلفاً' : 'ابدأ بإضافة عامل جديد'}
        />
      ) : (
        <div className="space-y-3">
          {filteredWorkers.map((worker) => (
            <MobileWorkerCard
              key={worker.id}
              worker={worker}
              onClick={() => navigate(`/workers/${worker.id}`)}
              actions={getActions(worker)}
              badge={getStatusBadge(worker)}
            />
          ))}
        </div>
      )}

      {canAdd && (
        <MobileFAB icon={Plus} label="إضافة عامل" onClick={() => navigate('/workers/new')} />
      )}

      {certModalWorker && (
        <HealthCertificateRequestModal
          worker={certModalWorker}
          onClose={() => setCertModalWorker(null)}
          onSuccess={() => { setCertModalWorker(null); loadWorkers(); loadCertificatesAndReports(); }}
        />
      )}
      {reportModalWorker && (
        <MedicalReportRequestModal
          worker={reportModalWorker}
          onClose={() => setReportModalWorker(null)}
          onSuccess={() => { setReportModalWorker(null); loadWorkers(); loadCertificatesAndReports(); }}
        />
      )}
      {transferModalWorker && (
        <WorkerTransferModal
          worker={transferModalWorker}
          onClose={() => setTransferModalWorker(null)}
          onSuccess={() => { setTransferModalWorker(null); loadWorkers(); }}
        />
      )}
    </div>
  );
};

export default MobileWorkersList;
