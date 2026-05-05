import { useState, useEffect } from 'react';
import { 
  FileHeart, Eye, Trash2, CheckCircle, XCircle, Clock, Filter, X, Printer 
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  MobileSearchBar, MobileEmptyState, MobileLoadingState, MobileBadge 
} from '../../components/mobile/MobileUI';
import CertificateApprovalModal from '../../components/CertificateApprovalModal';

const MobileHealthCertificates = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvalCertId, setApprovalCertId] = useState(null);

  const canApprove = ['system_admin', 'system_supervisor'].includes(user?.role);
  const canDelete = ['system_admin', 'system_supervisor', 'hospital_head', 'labor_supervisor'].includes(user?.role);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/health-certificates');
      setCertificates(res.data.data || []);
    } catch (e) {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id) => {
    try {
      const res = await api.get(`/health-certificates/${id}/form`, { responseType: 'text' });
      const w = window.open('', '_blank', 'width=900,height=1200');
      if (w) { w.document.write(res.data); w.document.close(); }
      else toast.error('السماح للنوافذ مطلوب');
    } catch (e) {
      toast.error('فشل عرض الشهادة');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف الطلب؟')) return;
    try {
      await api.delete(`/health-certificates/${id}`);
      toast.success('تم الحذف');
      load();
    } catch (e) {
      toast.error('فشل الحذف');
    }
  };

  // Filter
  const filtered = certificates.filter(c => {
    // Status filter
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    
    // Search
    if (search) {
      const q = search.toLowerCase();
      const name = c.worker?.fullName || c.worker?.name || '';
      return (
        name.toLowerCase().includes(q) ||
        c.worker?.idNumber?.includes(q) ||
        String(c.id).includes(q)
      );
    }
    return true;
  });

  // Stats
  const stats = {
    all: certificates.length,
    pending: certificates.filter(c => ['pending', 'pending_approval'].includes(c.status)).length,
    approved: certificates.filter(c => c.status === 'approved').length,
    rejected: certificates.filter(c => c.status === 'rejected').length,
  };

  const getStatusBadge = (status) => {
    if (status === 'approved') return <MobileBadge color="green">معتمدة</MobileBadge>;
    if (status === 'rejected') return <MobileBadge color="red">مرفوضة</MobileBadge>;
    if (status === 'pending_approval') return <MobileBadge color="yellow">بانتظار الاعتماد</MobileBadge>;
    return <MobileBadge color="blue">قيد المعالجة</MobileBadge>;
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('ar-SA') : '—';

  return (
    <div>
      <MobileSearchBar value={search} onChange={setSearch} placeholder="ابحث بالاسم أو رقم الطلب..." />

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-3 bg-white rounded-xl p-1 overflow-x-auto">
        {[
          { key: 'all', label: `الكل (${stats.all})`, color: 'gray' },
          { key: 'pending_approval', label: `بانتظار (${stats.pending})`, color: 'yellow' },
          { key: 'approved', label: `معتمدة (${stats.approved})`, color: 'green' },
          { key: 'rejected', label: `مرفوضة (${stats.rejected})`, color: 'red' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex-1 min-w-fit px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              statusFilter === tab.key
                ? 'bg-moh-primary text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <MobileLoadingState />
      ) : filtered.length === 0 ? (
        <MobileEmptyState
          icon={FileHeart}
          title="لا توجد شهادات"
          message={search ? 'جرّب بحثاً مختلفاً' : 'لم يتم تقديم أي طلبات بعد'}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((cert) => (
            <div key={cert.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">
                      {cert.worker?.fullName || cert.worker?.name || 'بدون اسم'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      رقم الطلب: #{cert.id}
                    </p>
                  </div>
                  {getStatusBadge(cert.status)}
                </div>

                {cert.worker?.idNumber && (
                  <p className="text-xs text-gray-500 mb-2">
                    🆔 {cert.worker.idNumber}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 rounded-lg p-2">
                  <div>
                    <span className="text-gray-500">تاريخ الطلب: </span>
                    <span className="font-medium">{formatDate(cert.createdAt)}</span>
                  </div>
                  {cert.expiryDate && (
                    <div>
                      <span className="text-gray-500">الانتهاء: </span>
                      <span className="font-medium">{formatDate(cert.expiryDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-100 bg-gray-50 px-2 py-1.5 flex flex-wrap gap-1">
                {cert.status === 'approved' && (
                  <button
                    onClick={() => handleView(cert.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-green-100 text-green-700 text-xs font-medium active:bg-green-200"
                  >
                    <Printer size={14} />
                    عرض الشهادة
                  </button>
                )}
                
                {canApprove && cert.status === 'pending_approval' && (
                  <button
                    onClick={() => setApprovalCertId(cert.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium active:bg-blue-200"
                  >
                    <CheckCircle size={14} />
                    اعتماد
                  </button>
                )}
                
                {canDelete && cert.status !== 'approved' && (
                  <button
                    onClick={() => handleDelete(cert.id)}
                    className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-red-100 text-red-700 text-xs font-medium active:bg-red-200"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {approvalCertId && (
        <CertificateApprovalModal
          certId={approvalCertId}
          onClose={() => setApprovalCertId(null)}
          onSuccess={() => { setApprovalCertId(null); load(); }}
        />
      )}
    </div>
  );
};

export default MobileHealthCertificates;
