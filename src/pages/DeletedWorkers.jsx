import { useEffect, useState } from 'react';
import { Trash2, RotateCcw, Search, Users, Calendar, Building2, Briefcase, AlertTriangle, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DeletedWorkers = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [processing, setProcessing] = useState(false);

  // التحقق من الصلاحية - ننتظر تحميل user أولاً
  useEffect(() => {
    if (authLoading) return; // ننتظر التحميل
    if (!user) return;       // لم يتم تحميل user بعد
    
    if (user.role !== 'system_admin') {
      toast.error('هذه الصفحة متاحة لمدير النظام فقط');
      navigate('/');
      return;
    }
    
    // مدير نظام - نُحمّل البيانات
    load();
  }, [user, authLoading, navigate]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/workers/deleted');
      setWorkers(res.data.data || []);
    } catch (e) {
      toast.error('فشل تحميل القائمة');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (worker) => {
    if (!confirm(`هل تريد استرجاع العامل "${worker.name}"؟\n\nسيُعاد تفعيله بكل بياناته.`)) return;
    
    setProcessing(true);
    try {
      const res = await api.post(`/workers/${worker.id}/restore`, {
        hospitalId: worker.hospitalId,
        jobTitleId: worker.jobTitleId,
      });
      toast.success(res.data.message);
      load();
    } catch (e) { /* معالج */ }
    finally { setProcessing(false); }
  };

  const openConfirmDelete = (worker) => {
    setConfirmingDelete(worker);
    setConfirmText('');
  };

  const handlePermanentDelete = async () => {
    if (!confirmingDelete) return;
    
    // تأكيد بكتابة اسم العامل
    if (confirmText.trim() !== confirmingDelete.name.trim()) {
      toast.error('اسم العامل غير مطابق');
      return;
    }
    
    setProcessing(true);
    try {
      const res = await api.delete(`/workers/${confirmingDelete.id}/permanent`);
      toast.success(res.data.message);
      setConfirmingDelete(null);
      setConfirmText('');
      load();
    } catch (e) { /* معالج */ }
    finally { setProcessing(false); }
  };

  const filteredWorkers = workers.filter((w) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      w.name?.toLowerCase().includes(s) ||
      w.idNumber?.includes(s) ||
      w.phone?.includes(s) ||
      w.hospital?.name?.toLowerCase().includes(s)
    );
  });

  const formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  // شاشة التحميل أثناء التحقق من الصلاحية
  if (authLoading || !user) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-moh-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="text-sm text-gray-500 mt-3">جاري التحقق من الصلاحية...</p>
      </div>
    );
  }
  
  if (user.role !== 'system_admin') return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-700">
            <Trash2 size={28} className="text-red-600" />
            العمال المحذوفون
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {workers.length} ملف محذوف - يمكن استرجاعه أو حذفه نهائياً
          </p>
        </div>
      </div>

      {/* تنبيه أمني */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start gap-2">
        <AlertTriangle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-red-900">
          <p className="font-bold mb-1">⚠️ تحذير:</p>
          <ul className="list-disc list-inside text-xs space-y-0.5">
            <li><strong>الاسترجاع</strong>: يُعيد تفعيل العامل بكل بياناته القديمة</li>
            <li><strong>الحذف النهائي</strong>: يحذف العامل وكل سجلاته من قاعدة البيانات - لا يمكن التراجع</li>
            <li>الحذف النهائي يحذف: التقارير الطبية، الشهادات الصحية، طلبات النقل، تحديثات المرفقات</li>
          </ul>
        </div>
      </div>

      {/* شريط البحث */}
      <div className="card">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="بحث بالاسم، رقم الهوية، الجوال..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pr-10"
          />
        </div>
      </div>

      {/* القائمة */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-moh-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <Trash2 size={48} className="mx-auto mb-3 opacity-50" />
          <p>{search ? 'لا توجد نتائج' : 'لا توجد ملفات محذوفة'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredWorkers.map((w) => (
            <div key={w.id} className="card hover:shadow-md transition">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold flex-shrink-0">
                      {w.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{w.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">{w.idNumber}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-600">
                    {w.phone && (
                      <p>📱 {w.phone}</p>
                    )}
                    <p className="flex items-center gap-1">
                      <Building2 size={12} />
                      {w.hospital?.name || 'غير محدد'}
                    </p>
                    <p className="flex items-center gap-1">
                      <Briefcase size={12} />
                      {w.jobTitle?.name || 'غير محدد'}
                    </p>
                    <p className="flex items-center gap-1">
                      <Calendar size={12} />
                      تاريخ الحذف: {formatDate(w.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* الأزرار */}
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <button
                  onClick={() => handleRestore(w)}
                  disabled={processing}
                  className="flex-1 bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1.5 rounded text-xs font-semibold transition flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <RotateCcw size={14} />
                  استرجاع
                </button>
                <button
                  onClick={() => openConfirmDelete(w)}
                  disabled={processing}
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1.5 rounded text-xs font-semibold transition flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  حذف نهائي
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal التأكيد */}
      {confirmingDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b bg-red-50">
              <h2 className="font-bold text-red-900 flex items-center gap-2">
                <AlertTriangle size={22} />
                تأكيد الحذف النهائي
              </h2>
              <button onClick={() => setConfirmingDelete(null)} className="p-1 hover:bg-red-100 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
                <p className="font-bold text-red-900 mb-2">⛔ هذا الإجراء لا يمكن التراجع عنه!</p>
                <p className="text-sm text-red-800">
                  سيتم حذف العامل <strong>"{confirmingDelete.name}"</strong> وكل سجلاته نهائياً من قاعدة البيانات.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <p>📋 سيُحذف:</p>
                <ul className="list-disc list-inside text-xs text-gray-600 mr-3">
                  <li>ملف العامل وبياناته</li>
                  <li>جميع التقارير الطبية المرتبطة</li>
                  <li>جميع الشهادات الصحية المرتبطة</li>
                  <li>سجل طلبات النقل</li>
                  <li>سجل تحديث المرفقات</li>
                  <li>الملفات المرفقة</li>
                </ul>
              </div>

              <div>
                <label className="label text-red-900">
                  للتأكيد، اكتب اسم العامل بالضبط:
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  المطلوب: <strong className="font-mono">{confirmingDelete.name}</strong>
                </p>
                <input
                  type="text"
                  className="input"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="اكتب الاسم هنا..."
                  autoFocus
                />
              </div>
            </div>

            <div className="border-t p-4 flex gap-2 justify-end">
              <button
                onClick={() => setConfirmingDelete(null)}
                disabled={processing}
                className="btn-secondary"
              >
                إلغاء
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={processing || confirmText.trim() !== confirmingDelete.name.trim()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Trash2 size={14} />
                {processing ? 'جاري الحذف...' : 'تأكيد الحذف النهائي'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeletedWorkers;
