import { useEffect, useState } from 'react';
import { ArrowRightLeft, CheckCircle, XCircle, Clock, Trash } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  pending_supervisor: { label: 'بانتظار اعتماد مشرف النظام', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'معتمد ومُنفّذ', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const WorkerTransfers = () => {
  const { hasRole } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [filter, setFilter] = useState('all');

  const canApprove = hasRole('system_admin', 'system_supervisor');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get('/worker-transfers');
      setTransfers(res.data.data);
    } catch (e) {}
  };

  const approve = async (id) => {
    if (!confirm('اعتماد طلب النقل؟ سيتم نقل العامل بكل بياناته فوراً.')) return;
    try {
      await api.post(`/worker-transfers/${id}/approve`);
      toast.success('تم الاعتماد - تم نقل العامل');
      load();
    } catch (e) {}
  };

  const reject = async (id) => {
    const reason = prompt('سبب الرفض:');
    if (!reason) return;
    try {
      await api.post(`/worker-transfers/${id}/reject`, { rejectionReason: reason });
      toast.success('تم الرفض');
      load();
    } catch (e) {}
  };

  const remove = async (id) => {
    if (!confirm('حذف الطلب؟')) return;
    try {
      await api.delete(`/worker-transfers/${id}`);
      toast.success('تم الحذف');
      load();
    } catch (e) {}
  };

  const filtered = transfers.filter((t) => {
    if (filter === 'pending') return t.status === 'pending_supervisor';
    if (filter === 'approved') return t.status === 'approved';
    if (filter === 'rejected') return t.status === 'rejected';
    return true;
  });

  const formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ArrowRightLeft size={28} />طلبات نقل العمالة
        </h1>
      </div>

      <div className="flex gap-2 bg-white rounded-xl shadow-soft p-2">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'pending', label: 'بانتظار الاعتماد' },
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

      <div className="space-y-3">
        {filtered.map((t) => {
          const cfg = STATUS_CONFIG[t.status] || {};
          const StatusIcon = cfg.icon || Clock;
          return (
            <div key={t.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono text-xs text-gray-500">#{t.id}</span>
                    <span className={`badge ${cfg.color}`}>
                      <StatusIcon size={12} className="ml-1 inline" />
                      {cfg.label}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg">{t.worker?.name}</h3>
                  
                  <div className="bg-blue-50 border border-blue-100 rounded p-3 mt-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <strong className="text-blue-900">من:</strong>
                        <div className="text-blue-700">
                          🏥 {t.fromHospital?.name || '-'}<br />
                          💼 {t.fromJobTitle?.name || '-'}
                        </div>
                      </div>
                      <div>
                        <strong className="text-green-900">إلى:</strong>
                        <div className="text-green-700">
                          🏥 {t.toHospital?.name || '-'}<br />
                          💼 {t.toJobTitle?.name || t.fromJobTitle?.name || '-'}
                          {t.transferType === 'different_job' && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-1 mr-1 rounded">مسمى جديد</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mt-2 space-y-0.5">
                    <p>📅 تاريخ الطلب: {formatDate(t.createdAt)}</p>
                    {t.createdBy && <p>👤 طُلب من: {t.createdBy.fullName}</p>}
                    {t.approvedAt && <p>✅ تم الاعتماد: {formatDate(t.approvedAt)} بواسطة {t.approvedBy?.fullName}</p>}
                    {t.reason && <p>📝 السبب: {t.reason}</p>}
                  </div>

                  {t.rejectionReason && (
                    <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded">
                      <strong>سبب الرفض:</strong> {t.rejectionReason}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 min-w-[160px]">
                  {t.status === 'pending_supervisor' && canApprove && (
                    <>
                      <button onClick={() => approve(t.id)} className="btn-success text-sm">
                        <CheckCircle size={14} />
                        اعتماد
                      </button>
                      <button onClick={() => reject(t.id)} className="btn-danger text-sm">
                        <XCircle size={14} />
                        رفض
                      </button>
                    </>
                  )}
                  {t.status === 'pending_supervisor' && (
                    <button onClick={() => remove(t.id)} className="btn-secondary text-sm">
                      <Trash size={14} />
                      حذف الطلب
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 card">
            <ArrowRightLeft size={48} className="mx-auto mb-3 opacity-50" />
            <p>لا توجد طلبات نقل</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerTransfers;
