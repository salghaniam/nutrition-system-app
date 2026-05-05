// ===================================================================
// 🆕 v23: صفحات إدارية مع إصلاحات
// ===================================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserCog, Building2, ClipboardList, FileSearch, FileText, Settings,
  Trash2, Upload, Monitor, AlertCircle, Plus, Edit, Eye 
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  MobileSearchBar, MobileEmptyState, MobileLoadingState, MobileBadge,
  MobileActionButton, MobileFAB 
} from '../../components/mobile/MobileUI';

// ─── MobileUsers (مع زر إضافة) ────────────────────────────────────
export const MobileUsers = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const canAdd = currentUser?.role === 'system_admin';

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data || []);
    } catch (e) { toast.error('فشل التحميل'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`حذف المستخدم "${name}"؟`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('تم الحذف');
      load();
    } catch (e) { toast.error('فشل الحذف'); }
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.fullName?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
  });

  const ROLE_NAMES = {
    system_admin: 'مدير النظام',
    system_supervisor: 'مشرف نظام',
    hospital_head: 'رئيس قسم تغذية',
    labor_supervisor: 'مشرف عمالة',
    devices_supervisor: 'مشرف أجهزة',
    site_manager: 'مدير موقع',
  };

  if (loading) return <MobileLoadingState />;

  return (
    <div>
      <MobileSearchBar value={search} onChange={setSearch} placeholder="ابحث..." />
      
      {filtered.length === 0 ? (
        <MobileEmptyState 
          icon={UserCog} 
          title="لا توجد مستخدمين"
          message={search ? 'جرّب بحثاً مختلفاً' : 'ابدأ بإضافة مستخدم جديد'}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(user => (
            <div key={user.id} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-moh-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {user.fullName?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{user.fullName}</h3>
                  <p className="text-xs text-gray-500" dir="ltr">@{user.username}</p>
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    <MobileBadge color="blue">{ROLE_NAMES[user.role]}</MobileBadge>
                    {!user.isActive && <MobileBadge color="red">معطّل</MobileBadge>}
                  </div>
                </div>
              </div>
              {user.hospital?.name && (
                <p className="text-xs text-gray-500 mt-2">🏥 {user.hospital.name}</p>
              )}
              
              {canAdd && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={() => navigate(`/users/${user.id}/edit`)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                  >
                    <Edit size={14} /> تعديل
                  </button>
                  {user.id !== currentUser.id && (
                    <button
                      onClick={() => handleDelete(user.id, user.fullName)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {canAdd && (
        <MobileFAB 
          icon={Plus} 
          label="إضافة مستخدم"
          onClick={() => navigate('/users/new')}
        />
      )}
    </div>
  );
};

// ─── MobileHospitals (مع زر إضافة + تفاصيل) ────────────────────────────────────
export const MobileHospitals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const canManage = user?.role === 'system_admin';

  useEffect(() => {
    api.get('/hospitals').then(r => {
      setHospitals(r.data.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`حذف المستشفى "${name}"؟`)) return;
    try {
      await api.delete(`/hospitals/${id}`);
      toast.success('تم الحذف');
      const res = await api.get('/hospitals');
      setHospitals(res.data.data || []);
    } catch (e) { toast.error('فشل الحذف'); }
  };

  const filtered = hospitals.filter(h => 
    !search || h.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <MobileLoadingState />;

  return (
    <div>
      <MobileSearchBar value={search} onChange={setSearch} placeholder="ابحث..." />
      
      {filtered.length === 0 ? (
        <MobileEmptyState icon={Building2} title="لا توجد مستشفيات" />
      ) : (
        <div className="space-y-3">
          {filtered.map(h => (
            <div 
              key={h.id} 
              className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 cursor-pointer active:scale-[0.99] transition"
              onClick={() => canManage && navigate(`/hospitals/${h.id}/edit`)}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-moh-primary/10 text-moh-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold">{h.name}</h3>
                  {h.address && <p className="text-xs text-gray-500 mt-1">📍 {h.address}</p>}
                  
                  <div className="mt-2 flex flex-wrap gap-1">
                    {h.bedsCount > 0 && (
                      <MobileBadge color="blue">🛏 {h.bedsCount} سرير</MobileBadge>
                    )}
                    {h.hasClinic && <MobileBadge color="green">🏥 يحتوي عيادة</MobileBadge>}
                    {!h.isActive && <MobileBadge color="red">معطّل</MobileBadge>}
                  </div>
                  
                  {h.contactNumber && (
                    <p className="text-xs text-gray-500 mt-2" dir="ltr">📞 {h.contactNumber}</p>
                  )}
                </div>
              </div>
              
              {canManage && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/hospitals/${h.id}/edit`); }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                  >
                    <Edit size={14} /> تعديل
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(h.id, h.name); }}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {canManage && (
        <MobileFAB 
          icon={Plus} 
          label="إضافة مستشفى"
          onClick={() => navigate('/hospitals/new')}
        />
      )}
    </div>
  );
};

// ─── MobileDeletedWorkers ────────────────────────────────────
export const MobileDeletedWorkers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/workers/deleted').then(r => {
      setWorkers(r.data.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleRestore = async (id) => {
    if (!confirm('استرجاع هذا العامل؟')) return;
    try {
      await api.post(`/workers/${id}/restore`);
      toast.success('تم الاسترجاع');
      setWorkers(workers.filter(w => w.id !== id));
    } catch (e) { toast.error('فشل الاسترجاع'); }
  };

  const handlePermDelete = async (id) => {
    if (!confirm('حذف نهائي؟ لا يمكن التراجع!')) return;
    try {
      await api.delete(`/workers/${id}/permanent`);
      toast.success('تم الحذف نهائياً');
      setWorkers(workers.filter(w => w.id !== id));
    } catch (e) { toast.error('فشل الحذف'); }
  };

  if (loading) return <MobileLoadingState />;
  if (workers.length === 0) return <MobileEmptyState icon={Trash2} title="لا يوجد عمال محذوفون" />;

  return (
    <div className="space-y-3">
      {workers.map(w => (
        <div key={w.id} className="bg-white rounded-2xl shadow-sm p-4 border border-red-100 border-r-4 border-r-red-400">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold truncate">{w.name}</h3>
              <p className="text-xs text-gray-500">{w.idNumber}</p>
              <p className="text-xs text-red-600 mt-1">
                حُذف: {w.deletedAt ? new Date(w.deletedAt).toLocaleDateString('ar-SA') : '—'}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => handleRestore(w.id)}
              className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium"
            >
              استرجاع
            </button>
            <button
              onClick={() => handlePermDelete(w.id)}
              className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium"
            >
              حذف نهائي
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── ComingSoon ────────────────────────────────────
export const MobileComingSoon = ({ pageName, message }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
      <div className="w-20 h-20 bg-moh-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Monitor size={40} className="text-moh-primary" />
      </div>
      <h3 className="font-bold text-lg mb-2">{pageName}</h3>
      <p className="text-sm text-gray-600 mb-4">
        {message || 'هذه الصفحة معقدة، يفضّل استخدامها من المتصفح على الكمبيوتر'}
      </p>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-right">
        <div className="flex items-start gap-2">
          <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700">
            للوصول الكامل، استخدم المتصفح على الكمبيوتر.
          </p>
        </div>
      </div>
      <MobileActionButton 
        label="العودة للرئيسية" 
        onClick={() => navigate('/')}
        color="primary"
      />
    </div>
  );
};

export const MobileLookups = () => (
  <MobileComingSoon pageName="البيانات المرجعية" />
);

// ─── 🔧 v23: MobileAuditLogs - إصلاح الحقول ────────────────────────────────────
export const MobileAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/audit-logs', { params: { limit: 50 } })
      .then(r => { 
        setLogs(r.data.data?.items || r.data.data || []); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, []);

  const ACTION_LABELS = {
    create: { label: 'إضافة', color: 'green' },
    update: { label: 'تعديل', color: 'blue' },
    delete: { label: 'حذف', color: 'red' },
    approve: { label: 'اعتماد', color: 'green' },
    reject: { label: 'رفض', color: 'red' },
    login: { label: 'تسجيل دخول', color: 'gray' },
    logout: { label: 'تسجيل خروج', color: 'gray' },
    transfer: { label: 'نقل', color: 'yellow' },
    restore: { label: 'استرجاع', color: 'green' },
  };

  const ENTITY_LABELS = {
    Worker: 'عامل',
    User: 'مستخدم',
    Hospital: 'مستشفى',
    HealthCertificate: 'شهادة صحية',
    MedicalReport: 'تقرير طبي',
    WorkerTransfer: 'طلب نقل',
    Device: 'جهاز',
  };

  const filtered = logs.filter(log => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.userFullName?.toLowerCase().includes(q) ||
      log.username?.toLowerCase().includes(q) ||
      log.entityName?.toLowerCase().includes(q) ||
      log.workerIdNumber?.includes(q)
    );
  });

  if (loading) return <MobileLoadingState />;

  return (
    <div>
      <MobileSearchBar value={search} onChange={setSearch} placeholder="ابحث..." />
      
      {filtered.length === 0 ? (
        <MobileEmptyState icon={FileSearch} title="لا توجد سجلات" />
      ) : (
        <div className="space-y-2">
          {filtered.map(log => {
            const action = ACTION_LABELS[log.action] || { label: log.action, color: 'gray' };
            const entityType = ENTITY_LABELS[log.entityType] || log.entityType;
            
            return (
              <div key={log.id} className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    {/* 🔧 v23: استخدام userFullName/username من DB مباشرة */}
                    <p className="font-medium text-sm truncate">
                      {log.userFullName || 'غير محدد'}
                    </p>
                    {log.username && (
                      <p className="text-xs text-gray-500 truncate" dir="ltr">
                        @{log.username}
                      </p>
                    )}
                  </div>
                  <MobileBadge color={action.color}>{action.label}</MobileBadge>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                  {entityType && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">النوع:</span>
                      <span className="font-medium">{entityType}</span>
                    </div>
                  )}
                  {log.entityName && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">العنصر:</span>
                      <span className="font-medium truncate">{log.entityName}</span>
                    </div>
                  )}
                  {log.hospitalName && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">المستشفى:</span>
                      <span className="font-medium truncate">{log.hospitalName}</span>
                    </div>
                  )}
                  {log.workerIdNumber && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">رقم الهوية:</span>
                      <span className="font-medium" dir="ltr">{log.workerIdNumber}</span>
                    </div>
                  )}
                </div>
                
                {log.description && (
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">{log.description}</p>
                )}
                
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(log.createdAt).toLocaleString('ar-SA')}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const MobileReports = () => (
  <MobileComingSoon pageName="التقارير الإحصائية" />
);

export const MobileSettings = () => (
  <MobileComingSoon pageName="الإعدادات" />
);

// ─── MobileAttachmentUpdates ────────────────────────────────────
export const MobileAttachmentUpdates = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/attachment-updates')
      .then(r => { setUpdates(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <MobileLoadingState />;
  if (updates.length === 0) return <MobileEmptyState icon={Upload} title="لا توجد تحديثات" />;

  return (
    <div className="space-y-3">
      {updates.map(u => (
        <div key={u.id} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="flex justify-between items-start gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold truncate">{u.worker?.name || '—'}</h3>
              <p className="text-xs text-gray-500">{u.attachmentType}</p>
            </div>
            <MobileBadge color={
              u.status === 'approved' ? 'green' : 
              u.status === 'rejected' ? 'red' : 'yellow'
            }>
              {u.status === 'approved' ? 'معتمد' : 
               u.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
            </MobileBadge>
          </div>
          <p className="text-xs text-gray-400">
            {new Date(u.createdAt).toLocaleDateString('ar-SA')}
          </p>
        </div>
      ))}
    </div>
  );
};
