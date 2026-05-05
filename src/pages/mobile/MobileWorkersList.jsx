import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Eye, Edit, Trash2, Filter, Users, FileHeart, Stethoscope, 
  ArrowRightLeft, X, Printer
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

  // Filter بحث
  const filteredWorkers = workers.filter(w => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      w.fullName?.toLowerCase().includes(q) ||
      w.idNumber?.includes(q) ||
      w.phone?.includes(q)
    );
  });

  // Build actions for each worker
  const getActions = (worker) => {
    const actions = [];
    
    actions.push({
      icon: Eye,
      label: 'عرض',
      color: 'blue',
      onClick: () => navigate(`/workers/${worker.id}`),
    });
    
    if (canRequest) {
      actions.push({
        icon: FileHeart,
        label: 'شهادة',
        color: 'green',
        onClick: () => setCertModalWorker(worker),
      });
      
      actions.push({
        icon: Stethoscope,
        label: 'تقرير',
        color: 'yellow',
        onClick: () => setReportModalWorker(worker),
      });
    }
    
    if (canTransfer) {
      actions.push({
        icon: ArrowRightLeft,
        label: 'نقل',
        color: 'blue',
        onClick: () => setTransferModalWorker(worker),
      });
    }
    
    if (canDelete) {
      actions.push({
        icon: Trash2,
        label: 'حذف',
        color: 'red',
        onClick: () => handleDelete(worker.id, worker.fullName),
      });
    }
    
    return actions;
  };

  // Get certificate status badge
  const getStatusBadge = (worker) => {
    const cert = worker.healthCertificates?.find(c => c.status === 'approved');
    if (!cert) return <MobileBadge color="gray">لا توجد شهادة</MobileBadge>;
    
    const expDate = cert.expiryDate ? new Date(cert.expiryDate) : null;
    if (!expDate) return <MobileBadge color="gray">—</MobileBadge>;
    
    const now = new Date();
    const daysLeft = Math.floor((expDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return <MobileBadge color="red">منتهية</MobileBadge>;
    if (daysLeft < 30) return <MobileBadge color="yellow">قريبة الانتهاء</MobileBadge>;
    return <MobileBadge color="green">سارية</MobileBadge>;
  };

  const activeFiltersCount = Object.values(filters).filter(v => v).length;

  return (
    <div>
      {/* Search bar */}
      <MobileSearchBar
        value={search}
        onChange={setSearch}
        placeholder="ابحث بالاسم، رقم الهوية، الهاتف..."
      />

      {/* Filter toggle + count */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
            activeFiltersCount > 0
              ? 'bg-moh-primary text-white'
              : 'bg-white text-gray-700 border border-gray-200'
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

        <div className="text-xs text-gray-500">
          {filteredWorkers.length} عامل
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white rounded-xl p-3 mb-3 space-y-2 border border-gray-200">
          <select
            value={filters.nationalityId}
            onChange={(e) => setFilters({ ...filters, nationalityId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="">كل الجنسيات</option>
            {lookups.nationalities.map(n => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
          
          <select
            value={filters.jobTitleId}
            onChange={(e) => setFilters({ ...filters, jobTitleId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="">كل المسميات الوظيفية</option>
            {lookups.jobTitles.map(j => (
              <option key={j.id} value={j.id}>{j.name}</option>
            ))}
          </select>
          
          {['system_admin', 'system_supervisor'].includes(user?.role) && (
            <select
              value={filters.hospitalId}
              onChange={(e) => setFilters({ ...filters, hospitalId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">كل المستشفيات</option>
              {lookups.hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          )}
          
          {activeFiltersCount > 0 && (
            <button
              onClick={() => setFilters({ nationalityId: '', jobTitleId: '', hospitalId: '' })}
              className="w-full text-red-600 text-sm py-1 hover:bg-red-50 rounded-lg flex items-center justify-center gap-1"
            >
              <X size={14} />
              مسح الفلاتر
            </button>
          )}
        </div>
      )}

      {/* List */}
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

      {/* FAB for add */}
      {canAdd && (
        <MobileFAB
          icon={Plus}
          label="إضافة عامل"
          onClick={() => navigate('/workers/new')}
        />
      )}

      {/* Modals */}
      {certModalWorker && (
        <HealthCertificateRequestModal
          worker={certModalWorker}
          onClose={() => setCertModalWorker(null)}
          onSuccess={() => { setCertModalWorker(null); loadWorkers(); }}
        />
      )}
      
      {reportModalWorker && (
        <MedicalReportRequestModal
          worker={reportModalWorker}
          onClose={() => setReportModalWorker(null)}
          onSuccess={() => { setReportModalWorker(null); loadWorkers(); }}
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
