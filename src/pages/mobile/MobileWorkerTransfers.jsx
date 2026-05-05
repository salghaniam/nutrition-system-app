import { useState, useEffect } from 'react';
import { ArrowRightLeft, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  MobileSearchBar, MobileEmptyState, MobileLoadingState, MobileBadge 
} from '../../components/mobile/MobileUI';

const MobileWorkerTransfers = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const canApprove = ['system_admin', 'system_supervisor'].includes(user?.role);
  const canDelete = ['system_admin', 'system_supervisor'].includes(user?.role);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/worker-transfers');
      setTransfers(res.data.data || []);
    } catch (e) {
      toast.error('فشل التحميل');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('اعتماد طلب النقل؟')) return;
    try {
      await api.post(`/worker-transfers/${id}/approve`);
      toast.success('تم الاعتماد');
      load();
    } catch (e) {
      toast.error('فشل الاعتماد');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('سبب الرفض:');
    if (!reason) return;
    try {
      await api.post(`/worker-transfers/${id}/reject`, { reason });
      toast.success('تم الرفض');
      load();
    } catch (e) {
      toast.error('فشل الرفض');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف الطلب؟')) return;
    try {
      await api.delete(`/worker-transfers/${id}`);
      toast.success('تم الحذف');
      load();
    } catch (e) {
      toast.error('فشل الحذف');
    }
  };

  const filtered = transfers.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const name = t.worker?.fullName || t.worker?.name || '';
    return name.toLowerCase().includes(q) || t.worker?.idNumber?.includes(q);
  });

  const stats = {
    all: transfers.length,
    pending: transfers.filter(t => ['pending', 'pending_supervisor', 'pending_admin'].includes(t.status)).length,
    approved: transfers.filter(t => t.status === 'approved').length,
    rejected: transfers.filter(t => t.status === 'rejected').length,
  };

  const getStatusBadge = (status) => {
    const map = {
      approved: { color: 'green', label: 'معتمد' },
      rejected: { color: 'red', label: 'مرفوض' },
      pending_supervisor: { color: 'yellow', label: 'بانتظار المشرف' },
      pending_admin: { color: 'yellow', label: 'بانتظار المدير' },
      pending: { color: 'blue', label: 'قيد المعالجة' },
    };
    const info = map[status] || { color: 'gray', label: status };
    return <MobileBadge color={info.color}>{info.label}</MobileBadge>;
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('ar-SA') : '—';
  const isPending = (s) => ['pending', 'pending_supervisor', 'pending_admin'].includes(s);

  return (
    <div>
      <MobileSearchBar value={search} onChange={setSearch} placeholder="ابحث..." />

      <div className="flex gap-1 mb-3 bg-white rounded-xl p-1 overflow-x-auto">
        {[
          { key: 'all', label: `الكل (${stats.all})` },
          { key: 'pending', label: `بانتظار (${stats.pending})` },
          { key: 'approved', label: `معتمد (${stats.approved})` },
          { key: 'rejected', label: `مرفوض (${stats.rejected})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex-1 min-w-fit px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
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
        <MobileEmptyState icon={ArrowRightLeft} title="لا توجد طلبات نقل" />
      ) : (
        <div className="space-y-3">
          {filtered.map((transfer) => (
            <div key={transfer.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">
                      {transfer.worker?.fullName || transfer.worker?.name || 'بدون اسم'}
                    </h3>
                    <p className="text-xs text-gray-500">طلب #{transfer.id}</p>
                  </div>
                  {getStatusBadge(transfer.status)}
                </div>

                {/* تفاصيل النقل */}
                <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">من:</span>
                    <span className="font-medium">{transfer.fromHospital?.name || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">إلى:</span>
                    <span className="font-medium text-moh-primary">
                      {transfer.toHospital?.name || '—'}
                    </span>
                  </div>
                  {transfer.newJobTitle?.name && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">المسمى الجديد:</span>
                      <span className="font-medium">{transfer.newJobTitle.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">التاريخ:</span>
                    <span>{formatDate(transfer.createdAt)}</span>
                  </div>
                  {transfer.reason && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-gray-500">السبب:</span>
                      <p className="mt-1">{transfer.reason}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 bg-gray-50 px-2 py-1.5 flex gap-1">
                {canApprove && isPending(transfer.status) && (
                  <>
                    <button
                      onClick={() => handleApprove(transfer.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-green-100 text-green-700 text-xs font-medium active:bg-green-200"
                    >
                      <CheckCircle size={14} /> اعتماد
                    </button>
                    <button
                      onClick={() => handleReject(transfer.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-red-100 text-red-700 text-xs font-medium active:bg-red-200"
                    >
                      <XCircle size={14} /> رفض
                    </button>
                  </>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDelete(transfer.id)}
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

export default MobileWorkerTransfers;
