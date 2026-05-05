import { useState, useEffect } from 'react';
import { Stethoscope, Eye, Trash2, CheckCircle, Printer } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  MobileSearchBar, MobileEmptyState, MobileLoadingState, MobileBadge 
} from '../../components/mobile/MobileUI';

const MobileMedicalReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const canApprove = ['system_admin', 'system_supervisor'].includes(user?.role);
  const canDelete = ['system_admin', 'system_supervisor', 'hospital_head', 'labor_supervisor'].includes(user?.role);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/medical-reports');
      setReports(res.data.data || []);
    } catch (e) {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id) => {
    try {
      const res = await api.get(`/medical-reports/${id}/form`, { responseType: 'text' });
      const w = window.open('', '_blank', 'width=900,height=1100');
      if (w) { w.document.write(res.data); w.document.close(); }
    } catch (e) {
      toast.error('فشل عرض التقرير');
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('اعتماد هذا التقرير؟')) return;
    try {
      await api.post(`/medical-reports/${id}/approve`);
      toast.success('تم الاعتماد');
      load();
    } catch (e) {
      toast.error('فشل الاعتماد');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف الطلب؟')) return;
    try {
      await api.delete(`/medical-reports/${id}`);
      toast.success('تم الحذف');
      load();
    } catch (e) {
      toast.error('فشل الحذف');
    }
  };

  const filtered = reports.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const name = r.worker?.fullName || r.worker?.name || '';
    return name.toLowerCase().includes(q) || r.worker?.idNumber?.includes(q) || String(r.id).includes(q);
  });

  const stats = {
    all: reports.length,
    pending: reports.filter(r => ['pending', 'pending_approval'].includes(r.status)).length,
    approved: reports.filter(r => r.status === 'approved').length,
  };

  const getStatusBadge = (status) => {
    if (status === 'approved') return <MobileBadge color="green">معتمد</MobileBadge>;
    if (status === 'rejected') return <MobileBadge color="red">مرفوض</MobileBadge>;
    if (status === 'pending_approval') return <MobileBadge color="yellow">بانتظار الاعتماد</MobileBadge>;
    return <MobileBadge color="blue">قيد المعالجة</MobileBadge>;
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('ar-SA') : '—';

  return (
    <div>
      <MobileSearchBar value={search} onChange={setSearch} placeholder="ابحث..." />

      <div className="flex gap-1 mb-3 bg-white rounded-xl p-1 overflow-x-auto">
        {[
          { key: 'all', label: `الكل (${stats.all})` },
          { key: 'pending_approval', label: `بانتظار (${stats.pending})` },
          { key: 'approved', label: `معتمدة (${stats.approved})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex-1 min-w-fit px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              statusFilter === tab.key ? 'bg-moh-primary text-white' : 'text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <MobileLoadingState />
      ) : filtered.length === 0 ? (
        <MobileEmptyState icon={Stethoscope} title="لا توجد تقارير" />
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <div key={report.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">
                      {report.worker?.fullName || report.worker?.name || 'بدون اسم'}
                    </h3>
                    <p className="text-xs text-gray-500">رقم الطلب: #{report.id}</p>
                  </div>
                  {getStatusBadge(report.status)}
                </div>
                
                <div className="text-xs text-gray-500">
                  📅 {formatDate(report.createdAt)}
                </div>
              </div>

              <div className="border-t border-gray-100 bg-gray-50 px-2 py-1.5 flex gap-1">
                {report.status === 'approved' && (
                  <button
                    onClick={() => handleView(report.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-green-100 text-green-700 text-xs font-medium"
                  >
                    <Printer size={14} /> عرض التقرير
                  </button>
                )}
                {canApprove && report.status === 'pending_approval' && (
                  <button
                    onClick={() => handleApprove(report.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium"
                  >
                    <CheckCircle size={14} /> اعتماد
                  </button>
                )}
                {canDelete && report.status !== 'approved' && (
                  <button
                    onClick={() => handleDelete(report.id)}
                    className="px-3 py-2 rounded-lg bg-red-100 text-red-700"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileMedicalReports;
