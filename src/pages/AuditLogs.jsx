import { useEffect, useState } from 'react';
import {
  Activity, Search, Filter, Calendar, User, Building2, ChevronLeft, ChevronRight,
  Plus, Edit, Trash2, CheckCircle, LogIn, LogOut, RotateCcw, ArrowRightLeft,
  XCircle, ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuditLogs = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [actions, setActions] = useState([]);
  const [stats, setStats] = useState(null);
  
  // الفلاتر
  const [filters, setFilters] = useState({
    username: '',
    action: '',
    workerIdNumber: '',
    hospitalId: '',
    dateFrom: '',
    dateTo: '',
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  
  const [showFilters, setShowFilters] = useState(true);

  // التحقق من الصلاحية
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    
    if (user.role !== 'system_admin') {
      toast.error('سجل الأحداث متاح لمدير النظام فقط');
      navigate('/');
      return;
    }
    
    loadOptions();
    loadHospitals();
    loadStats();
    loadLogs();
  }, [user, authLoading]);

  const loadOptions = async () => {
    try {
      const res = await api.get('/audit-logs/options');
      setActions(res.data.data.actions || []);
    } catch (e) { /* ignore */ }
  };

  const loadHospitals = async () => {
    try {
      const res = await api.get('/hospitals');
      setHospitals(res.data.data || []);
    } catch (e) { /* ignore */ }
  };

  const loadStats = async () => {
    try {
      const res = await api.get('/audit-logs/stats');
      setStats(res.data.data);
    } catch (e) { /* ignore */ }
  };

  const loadLogs = async (pageNum = 1) => {
    setLoading(true);
    try {
      const params = { page: pageNum, limit: pagination.limit };
      Object.entries(filters).forEach(([k, v]) => {
        if (v && String(v).trim()) params[k] = v;
      });
      
      const res = await api.get('/audit-logs', { params });
      setLogs(res.data.data || []);
      setPagination((prev) => ({
        ...prev,
        page: pageNum,
        total: res.data.pagination.total,
        totalPages: res.data.pagination.totalPages,
      }));
    } catch (e) {
      toast.error('فشل تحميل السجل');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => loadLogs(1);

  const resetFilters = () => {
    setFilters({
      username: '',
      action: '',
      workerIdNumber: '',
      hospitalId: '',
      dateFrom: '',
      dateTo: '',
    });
    setTimeout(() => loadLogs(1), 50);
  };

  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    loadLogs(newPage);
  };

  // أيقونة لكل نوع إجراء
  const getActionIcon = (action) => {
    const map = {
      create: <Plus size={14} />,
      update: <Edit size={14} />,
      delete: <Trash2 size={14} />,
      permanent_delete: <Trash2 size={14} />,
      approve: <CheckCircle size={14} />,
      reject: <XCircle size={14} />,
      login: <LogIn size={14} />,
      logout: <LogOut size={14} />,
      restore: <RotateCcw size={14} />,
      transfer: <ArrowRightLeft size={14} />,
    };
    return map[action] || <Activity size={14} />;
  };

  // لون لكل نوع إجراء
  const getActionColor = (action) => {
    const map = {
      create: 'bg-green-100 text-green-700 border-green-200',
      update: 'bg-blue-100 text-blue-700 border-blue-200',
      delete: 'bg-orange-100 text-orange-700 border-orange-200',
      permanent_delete: 'bg-red-100 text-red-700 border-red-200',
      approve: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      reject: 'bg-rose-100 text-rose-700 border-rose-200',
      login: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      logout: 'bg-gray-100 text-gray-700 border-gray-200',
      restore: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      transfer: 'bg-purple-100 text-purple-700 border-purple-200',
    };
    return map[action] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const ROLE_LABELS = {
    system_admin: 'مدير النظام',
    system_supervisor: 'مشرف النظام',
    hospital_head: 'رئيس قسم',
    site_manager: 'مدير موقع',
    labor_supervisor: 'مشرف عمالة',
    devices_supervisor: 'مشرف أجهزة',
  };

  const formatDateTime = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-700">
            <Activity size={28} className="text-moh-primary" />
            سجل الأحداث
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            توثيق كامل لجميع إجراءات النظام
          </p>
        </div>
        <button
          onClick={() => loadLogs(pagination.page)}
          disabled={loading}
          className="btn-secondary text-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          تحديث
        </button>
      </div>

      {/* الإحصائيات */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center py-3">
            <p className="text-xs text-gray-500">إجمالي الأحداث</p>
            <p className="text-2xl font-bold text-moh-primary mt-1">{stats.total.toLocaleString('en')}</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-xs text-gray-500">آخر 7 أيام</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.last7Days.toLocaleString('en')}</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-xs text-gray-500">اليوم</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.today.toLocaleString('en')}</p>
          </div>
        </div>
      )}

      {/* الفلاتر */}
      <div className="card">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between text-right mb-3"
        >
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-moh-primary" />
            <h3 className="font-semibold">الفلاتر المتقدمة</h3>
          </div>
          {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showFilters && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* اسم المستخدم */}
              <div>
                <label className="label flex items-center gap-1">
                  <User size={12} />
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="بحث بالاسم..."
                  value={filters.username}
                  onChange={(e) => setFilters({ ...filters, username: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                />
              </div>

              {/* العملية */}
              <div>
                <label className="label">العملية / الإجراء</label>
                <select
                  className="input"
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                >
                  <option value="">جميع العمليات</option>
                  {actions.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>

              {/* المستشفى */}
              <div>
                <label className="label flex items-center gap-1">
                  <Building2 size={12} />
                  المستشفى
                </label>
                <select
                  className="input"
                  value={filters.hospitalId}
                  onChange={(e) => setFilters({ ...filters, hospitalId: e.target.value })}
                >
                  <option value="">جميع المستشفيات</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              {/* رقم الهوية */}
              <div>
                <label className="label">رقم هوية العامل</label>
                <input
                  type="text"
                  className="input font-mono"
                  placeholder="مثلاً: 1234567890"
                  value={filters.workerIdNumber}
                  onChange={(e) => setFilters({ ...filters, workerIdNumber: e.target.value.replace(/\D/g, '') })}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                />
              </div>

              {/* من تاريخ */}
              <div>
                <label className="label flex items-center gap-1">
                  <Calendar size={12} />
                  من تاريخ
                </label>
                <input
                  type="date"
                  className="input"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>

              {/* إلى تاريخ */}
              <div>
                <label className="label flex items-center gap-1">
                  <Calendar size={12} />
                  إلى تاريخ
                </label>
                <input
                  type="date"
                  className="input"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t">
              <button onClick={resetFilters} className="btn-secondary text-sm">
                إعادة تعيين
              </button>
              <button onClick={applyFilters} className="btn-primary text-sm" disabled={loading}>
                <Search size={14} />
                تطبيق الفلاتر
              </button>
            </div>
          </div>
        )}
      </div>

      {/* النتائج */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-moh-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">جاري تحميل السجلات...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Activity size={48} className="mx-auto mb-3 opacity-50" />
            <p>لا توجد أحداث مطابقة للبحث</p>
            <p className="text-xs mt-1">جرّب تعديل الفلاتر</p>
          </div>
        ) : (
          <>
            {/* عداد النتائج */}
            <div className="bg-gray-50 px-4 py-2 border-b text-xs text-gray-600 flex items-center justify-between">
              <span>
                إجمالي: <strong className="text-moh-primary">{pagination.total.toLocaleString('en')}</strong> حدث
              </span>
              <span>
                صفحة <strong>{pagination.page}</strong> من <strong>{pagination.totalPages}</strong>
              </span>
            </div>

            {/* جدول السجل */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-right font-semibold">التاريخ والوقت</th>
                    <th className="px-3 py-2 text-right font-semibold">المستخدم</th>
                    <th className="px-3 py-2 text-right font-semibold">الدور</th>
                    <th className="px-3 py-2 text-right font-semibold">المستشفى</th>
                    <th className="px-3 py-2 text-right font-semibold">الإجراء</th>
                    <th className="px-3 py-2 text-right font-semibold">الكائن</th>
                    <th className="px-3 py-2 text-right font-semibold">التفاصيل</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs whitespace-nowrap text-gray-600">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{log.userFullName || log.username}</div>
                        {log.username && log.userFullName && (
                          <div className="text-xs text-gray-500">@{log.username}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {ROLE_LABELS[log.userRole] || log.userRole}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {log.hospitalName || '-'}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${getActionColor(log.action)}`}>
                          {getActionIcon(log.action)}
                          {log.actionLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <div className="text-gray-700">{log.entityTypeLabel || '-'}</div>
                        {log.entityName && (
                          <div className="text-gray-500 text-xs">{log.entityName}</div>
                        )}
                        {log.workerIdNumber && (
                          <div className="text-gray-500 font-mono text-xs">🆔 {log.workerIdNumber}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 max-w-xs">
                        {log.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 border-t flex items-center justify-center gap-2">
                <button
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                  className="btn-secondary text-sm px-3 py-1 disabled:opacity-50"
                >
                  <ChevronRight size={14} />
                  السابق
                </button>
                
                <div className="flex items-center gap-1 text-sm">
                  {/* أرقام الصفحات */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        disabled={loading}
                        className={`px-3 py-1 rounded text-sm font-medium transition ${
                          pageNum === pagination.page
                            ? 'bg-moh-primary text-white'
                            : 'hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || loading}
                  className="btn-secondary text-sm px-3 py-1 disabled:opacity-50"
                >
                  التالي
                  <ChevronLeft size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
