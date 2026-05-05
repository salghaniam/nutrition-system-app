import { useEffect, useState } from 'react';
import { Upload, CheckCircle, XCircle, Eye } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const AttachmentUpdates = () => {
  const { hasRole } = useAuth();
  const [updates, setUpdates] = useState([]);

  const canApprove = hasRole('labor_supervisor', 'system_admin', 'system_supervisor');

  useEffect(() => {
    if (canApprove) load();
  }, []);

  const load = async () => {
    try {
      const res = await api.get('/worker-auth/pending-updates');
      setUpdates(res.data.data);
    } catch (e) {}
  };

  const approve = async (id) => {
    if (!confirm('اعتماد التحديث؟')) return;
    try {
      await api.post(`/worker-auth/updates/${id}/approve`);
      toast.success('تم الاعتماد');
      load();
    } catch (e) {}
  };

  const reject = async (id) => {
    const reason = prompt('سبب الرفض:');
    if (!reason) return;
    try {
      await api.post(`/worker-auth/updates/${id}/reject`, { rejectionReason: reason });
      toast.success('تم الرفض');
      load();
    } catch (e) {}
  };

  if (!canApprove) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">هذه الصفحة لمشرف العمالة فقط</p>
      </div>
    );
  }

  const formatDate = (d) => {
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Upload size={28} />طلبات تحديث المرفقات
      </h1>

      <div className="space-y-3">
        {updates.map((u) => (
          <div key={u.id} className="card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[250px]">
                <h3 className="font-bold text-lg">{u.worker?.name}</h3>
                <p className="text-sm text-gray-500">رقم الهوية: {u.worker?.idNumber}</p>
                <div className="mt-2 space-y-1 text-sm">
                  <p>
                    <strong>المرفق:</strong>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded mr-2">
                      {u.attachmentLabel || u.attachmentField}
                    </span>
                  </p>
                  <p>📅 تاريخ الطلب: {formatDate(u.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {u.oldImagePath && (
                  <a href={u.oldImagePath} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
                    <Eye size={14} />
                    القديم
                  </a>
                )}
                <a href={u.newImagePath} target="_blank" rel="noreferrer" className="btn-primary text-sm">
                  <Eye size={14} />
                  الجديد
                </a>
                <button onClick={() => approve(u.id)} className="btn-success text-sm">
                  <CheckCircle size={14} />
                  اعتماد
                </button>
                <button onClick={() => reject(u.id)} className="btn-danger text-sm">
                  <XCircle size={14} />
                  رفض
                </button>
              </div>
            </div>
          </div>
        ))}

        {updates.length === 0 && (
          <div className="text-center py-12 text-gray-400 card">
            <Upload size={48} className="mx-auto mb-3 opacity-50" />
            <p>لا توجد طلبات تحديث معلقة</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttachmentUpdates;
