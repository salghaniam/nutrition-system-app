import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, FileHeart, Clock, FileText, Printer, Trash } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import CertificateApprovalModal from '../components/CertificateApprovalModal';

const STATUS_CONFIG = {
  pending_labor_supervisor: { label: 'بانتظار اعتماد مشرف العمالة', color: 'bg-purple-100 text-purple-800', icon: Clock },
  pending_hospital_head: { label: 'بانتظار اعتماد رئيس القسم', color: 'bg-orange-100 text-orange-800', icon: Clock },
  pending_system_supervisor: { label: 'بانتظار الاعتماد النهائي من مشرف النظام', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'معتمدة وسارية', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'مرفوضة', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const HealthCertificates = () => {
  const { hasRole } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [filter, setFilter] = useState('all');
  const [approvalModalCertId, setApprovalModalCertId] = useState(null);

  const canRequest = hasRole('hospital_head', 'labor_supervisor', 'site_manager');
  const canDelete = hasRole('hospital_head', 'labor_supervisor', 'system_admin', 'system_supervisor');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get('/health-certificates');
      setCertificates(res.data.data);
    } catch (e) {}
  };

  const viewCertificate = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/health-certificates/${id}/form`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        toast.error('فشل عرض الشهادة');
        return;
      }
      const html = await res.text();
      const w = window.open('', '_blank', 'width=900,height=1200');
      if (w) { w.document.write(html); w.document.close(); }
    } catch (e) {
      toast.error('فشل عرض الشهادة');
    }
  };

  const deleteCertificate = async (id) => {
    if (!confirm('حذف الطلب؟')) return;
    try {
      await api.delete(`/health-certificates/${id}`);
      toast.success('تم الحذف');
      load();
    } catch (e) {}
  };

  // 🆕 v8: فتح نافذة الاعتماد المحسّنة بدلاً من الاعتماد المباشر
  const openApprovalModal = (id) => {
    setApprovalModalCertId(id);
  };

  // الإجراءات المتاحة لكل حالة
  const getActions = (cert) => {
    const actions = [];

    // طباعة (بعد الاعتماد فقط)
    if (cert.status === 'approved' && (canRequest || hasRole('system_admin', 'system_supervisor'))) {
      actions.push({
        label: 'طباعة الشهادة',
        icon: Printer,
        color: 'btn-primary',
        onClick: () => viewCertificate(cert.id),
      });
    }

    // حذف الطلب
    if (cert.status !== 'approved' && cert.status !== 'rejected' && canDelete) {
      actions.push({
        label: 'حذف الطلب',
        icon: Trash,
        color: 'btn-danger',
        onClick: () => deleteCertificate(cert.id),
      });
    }

    // 🆕 الاعتماد عبر النافذة الجديدة (تعرض التقرير أولاً)
    if (cert.status === 'pending_labor_supervisor' && hasRole('labor_supervisor')) {
      actions.push({
        label: 'مراجعة واعتماد',
        icon: CheckCircle,
        color: 'btn-success',
        onClick: () => openApprovalModal(cert.id),
      });
    }
    if (cert.status === 'pending_hospital_head' && hasRole('hospital_head')) {
      actions.push({
        label: 'مراجعة واعتماد',
        icon: CheckCircle,
        color: 'btn-success',
        onClick: () => openApprovalModal(cert.id),
      });
    }
    if (cert.status === 'pending_system_supervisor' && hasRole('system_admin', 'system_supervisor')) {
      actions.push({
        label: 'مراجعة واعتماد نهائي',
        icon: CheckCircle,
        color: 'btn-success',
        onClick: () => openApprovalModal(cert.id),
      });
    }

    return actions;
  };

  const filtered = certificates.filter((c) => {
    if (filter === 'active') return c.status !== 'approved' && c.status !== 'rejected';
    if (filter === 'approved') return c.status === 'approved';
    if (filter === 'rejected') return c.status === 'rejected';
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
          <FileHeart size={28} />الشهادات الصحية
        </h1>
      </div>

      <div className="flex gap-2 bg-white rounded-xl shadow-soft p-2">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'active', label: 'قيد الاعتماد' },
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
        {filtered.map((c) => {
          const cfg = STATUS_CONFIG[c.status] || {};
          const StatusIcon = cfg.icon || FileText;
          return (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono text-xs text-gray-500">#{c.id}</span>
                    <span className="font-mono text-xs text-gray-400">رقم: {c.certificateNumber}</span>
                    <span className={`badge ${cfg.color}`}>
                      <StatusIcon size={12} className="ml-1 inline" />
                      {cfg.label}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg">{c.worker?.name}</h3>
                  <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                    <p>📍 المستشفى: {c.hospital?.name}</p>
                    <p>📅 تاريخ الطلب: {formatDate(c.requestDate)}</p>
                    {c.issueDate && <p>📅 تاريخ الإصدار: {formatDate(c.issueDate)}</p>}
                    {c.expiryDate && <p className="text-green-700">✅ تنتهي: {formatDate(c.expiryDate)}</p>}
                  </div>
                  {c.rejectionReason && (
                    <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded">
                      <strong>سبب الرفض:</strong> {c.rejectionReason}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 min-w-[180px]">
                  {getActions(c).map((a, i) => (
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

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 card">
            <FileHeart size={48} className="mx-auto mb-3 opacity-50" />
            <p>لا توجد شهادات صحية</p>
          </div>
        )}
      </div>

      {/* 🆕 نافذة الاعتماد المحسّنة */}
      {approvalModalCertId && (
        <CertificateApprovalModal
          certId={approvalModalCertId}
          onClose={() => setApprovalModalCertId(null)}
          onSuccess={() => {
            load();
            setApprovalModalCertId(null);
          }}
        />
      )}
    </div>
  );
};

export default HealthCertificates;
