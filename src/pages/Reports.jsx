import { useEffect, useState } from 'react';
import { BarChart3, Download, Filter, FileText, Stethoscope, Wrench, Users } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const REPORT_TYPES = [
  { id: 'comprehensive', label: 'التقرير الشامل', icon: FileText, endpoint: '/filtered-reports/comprehensive' },
  { id: 'certs-and-reports', label: 'الشهادات والتقارير', icon: Stethoscope, endpoint: '/filtered-reports/certs-and-reports' },
  { id: 'devices', label: 'تقرير الأجهزة', icon: Wrench, endpoint: '/filtered-reports/devices' },
];

const Reports = () => {
  const { hasRole } = useAuth();
  const [activeReport, setActiveReport] = useState('comprehensive');
  const [filters, setFilters] = useState({
    hospitalId: '', jobTitleId: '', nationalityId: '', religionId: '', qualificationId: '', status: '',
  });
  const [lookups, setLookups] = useState({ hospitals: [], jobTitles: [], nationalities: [], religions: [], qualifications: [] });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isAdmin = hasRole('system_admin', 'system_supervisor');

  useEffect(() => { loadLookups(); }, []);
  useEffect(() => { runReport(); }, [activeReport, filters]);

  useEffect(() => {
    if (filters.hospitalId) loadJobTitles(filters.hospitalId);
  }, [filters.hospitalId]);

  const loadLookups = async () => {
    try {
      const [h, n, r, q, j] = await Promise.all([
        api.get('/hospitals'),
        api.get('/nationalities'),
        api.get('/religions'),
        api.get('/qualifications'),
        api.get('/job-titles'),
      ]);
      setLookups({
        hospitals: h.data?.data || [],
        nationalities: n.data?.data || [],
        religions: r.data?.data || [],
        qualifications: q.data?.data || [],
        jobTitles: j.data?.data || [],
      });
    } catch (e) { console.error('loadLookups:', e); }
  };

  const loadJobTitles = async (hospitalId) => {
    try {
      const res = await api.get('/job-titles', { params: { hospitalId } });
      setLookups((prev) => ({ ...prev, jobTitles: res.data?.data || [] }));
    } catch (e) {}
  };

  const runReport = async () => {
    setLoading(true);
    try {
      const reportConfig = REPORT_TYPES.find(r => r.id === activeReport);
      if (!reportConfig) { setLoading(false); return; }
      
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v));
      const res = await api.get(reportConfig.endpoint, { params });
      
      // 🔧 إصلاح: التعامل مع كل صيغ الاستجابة
      let resultData = res.data?.data;
      if (resultData === undefined || resultData === null) resultData = [];
      setData(resultData);
    } catch (e) {
      console.error('runReport:', e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v));
      const res = await api.get(`/filtered-reports/export/${activeReport}`, {
        params, responseType: 'blob',
      });
      
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${activeReport}-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('تم تصدير التقرير');
    } catch (e) {
      toast.error('فشل التصدير');
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      hospitalId: '', jobTitleId: '', nationalityId: '', religionId: '', qualificationId: '', status: '',
    });
  };

  const formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const isExpired = (d) => d && new Date(d) < new Date();

  const visibleJobTitles = filters.hospitalId
    ? lookups.jobTitles.filter(j => String(j.hospitalId) === String(filters.hospitalId))
    : lookups.jobTitles;

  // 🔧 إصلاح: استخراج البيانات حسب نوع التقرير
  const getWorkers = () => {
    if (!data) return [];
    if (activeReport === 'comprehensive') {
      // قد يكون { workers, stats } أو array
      if (Array.isArray(data)) return data;
      return data.workers || [];
    }
    if (activeReport === 'certs-and-reports') {
      return Array.isArray(data) ? data : [];
    }
    return [];
  };

  const getDevices = () => {
    if (!data) return [];
    return Array.isArray(data) ? data : [];
  };

  const getStats = () => {
    if (activeReport !== 'comprehensive') return null;
    if (!data || Array.isArray(data)) return null;
    return data.stats || null;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 size={28} className="text-moh-primary" />التقارير الإحصائية
      </h1>

      {/* اختيار نوع التقرير */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {REPORT_TYPES.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.id}
              onClick={() => { setActiveReport(r.id); resetFilters(); }}
              className={`p-4 rounded-xl text-right transition-all ${
                activeReport === r.id
                  ? 'bg-moh-primary text-white shadow-lg scale-[1.02]'
                  : 'bg-white hover:bg-moh-bg-light shadow-soft'
              }`}
            >
              <Icon size={24} className="mb-2" />
              <div className="font-bold">{r.label}</div>
            </button>
          );
        })}
      </div>

      {/* الفلاتر */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-moh-primary" />
          <h3 className="font-bold">الفلاتر</h3>
          <button onClick={resetFilters} className="text-xs text-moh-primary hover:underline mr-auto">
            إعادة تعيين
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {isAdmin && (
            <div>
              <label className="label">المستشفى</label>
              <select className="input" value={filters.hospitalId} onChange={(e) => setFilters({ ...filters, hospitalId: e.target.value, jobTitleId: '' })}>
                <option value="">الكل</option>
                {lookups.hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          )}

          {activeReport !== 'devices' && (
            <>
              <div>
                <label className="label">المسمى الوظيفي</label>
                <select className="input" value={filters.jobTitleId} onChange={(e) => setFilters({ ...filters, jobTitleId: e.target.value })}>
                  <option value="">الكل</option>
                  {visibleJobTitles.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">الجنسية</label>
                <select className="input" value={filters.nationalityId} onChange={(e) => setFilters({ ...filters, nationalityId: e.target.value })}>
                  <option value="">الكل</option>
                  {lookups.nationalities.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">الديانة</label>
                <select className="input" value={filters.religionId} onChange={(e) => setFilters({ ...filters, religionId: e.target.value })}>
                  <option value="">الكل</option>
                  {lookups.religions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </>
          )}

          {activeReport === 'certs-and-reports' && (
            <div>
              <label className="label">الحالة</label>
              <select className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">الكل</option>
                <optgroup label="التقرير الطبي">
                  <option value="valid_report">ساري</option>
                  <option value="expiring_report">قريب الانتهاء</option>
                  <option value="expired_report">منتهي</option>
                  <option value="no_report">لم يصدر</option>
                </optgroup>
                <optgroup label="الشهادة الصحية">
                  <option value="valid_cert">سارية</option>
                  <option value="expiring_cert">قريبة الانتهاء</option>
                  <option value="expired_cert">منتهية</option>
                  <option value="no_cert">لم تصدر</option>
                </optgroup>
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
          <button onClick={() => window.print()} className="btn-secondary">
            <FileText size={16} />طباعة
          </button>
          <button onClick={exportToExcel} disabled={exporting} className="btn-primary disabled:opacity-50">
            <Download size={16} />{exporting ? 'جاري...' : 'تصدير Excel'}
          </button>
        </div>
      </div>

      {/* النتائج */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-moh-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : (
        <>
          {/* إحصائيات (للتقرير الشامل فقط) */}
          {activeReport === 'comprehensive' && getStats() && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBox label="إجمالي العمال" value={getStats().total} color="blue" />
              <StatBox label="في إجازة" value={getStats().onVacation} color="orange" />
              <StatBox label="تقارير سارية" value={getStats().reportsValid} color="green" />
              <StatBox label="تقارير منتهية" value={getStats().reportsExpired} color="red" />
              <StatBox label="شهادات سارية" value={getStats().certsValid} color="green" />
              <StatBox label="شهادات منتهية" value={getStats().certsExpired} color="red" />
              <StatBox label="بدون تقرير" value={getStats().reportsNone} color="gray" />
              <StatBox label="بدون شهادة" value={getStats().certsNone} color="gray" />
            </div>
          )}

          {/* جدول النتائج */}
          {activeReport === 'devices' ? (
            <DevicesTable devices={getDevices()} />
          ) : (
            <WorkersTable workers={getWorkers()} formatDate={formatDate} isExpired={isExpired} />
          )}
        </>
      )}
    </div>
  );
};

const StatBox = ({ label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <div className={`p-3 rounded-lg border ${colors[color] || colors.blue}`}>
      <div className="text-2xl font-bold">{value || 0}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
};

const WorkersTable = ({ workers, formatDate, isExpired }) => {
  if (!workers || workers.length === 0) {
    return (
      <div className="card text-center py-12 text-gray-400">
        <Users size={48} className="mx-auto mb-3 opacity-50" />
        <p>لا توجد نتائج</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="p-3 bg-moh-bg-light border-b text-sm font-semibold text-moh-primary">
        النتائج: {workers.length} عامل
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-right">#</th>
              <th className="p-2 text-right">الاسم</th>
              <th className="p-2 text-right">رقم الهوية</th>
              <th className="p-2 text-right">الجنسية</th>
              <th className="p-2 text-right">المسمى</th>
              <th className="p-2 text-right">المستشفى</th>
              <th className="p-2 text-right">التقرير الطبي</th>
              <th className="p-2 text-right">الشهادة الصحية</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w, idx) => (
              <tr key={w.id} className="border-t hover:bg-gray-50">
                <td className="p-2">{idx + 1}</td>
                <td className="p-2 font-medium">{w.name}</td>
                <td className="p-2 font-mono text-xs">{w.idNumber}</td>
                <td className="p-2">{w.nationality?.name || '-'}</td>
                <td className="p-2">{w.jobTitle?.name || '-'}</td>
                <td className="p-2">{w.hospital?.name || '-'}</td>
                <td className="p-2">
                  {w.medicalReportExpiryDate ? (
                    <span className={isExpired(w.medicalReportExpiryDate) ? 'text-red-600' : 'text-green-600'}>
                      {formatDate(w.medicalReportExpiryDate)}
                    </span>
                  ) : <span className="text-gray-400">-</span>}
                </td>
                <td className="p-2">
                  {w.healthCertificateExpiryDate ? (
                    <span className={isExpired(w.healthCertificateExpiryDate) ? 'text-red-600' : 'text-green-600'}>
                      {formatDate(w.healthCertificateExpiryDate)}
                    </span>
                  ) : <span className="text-gray-400">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DevicesTable = ({ devices }) => {
  if (!devices || devices.length === 0) {
    return (
      <div className="card text-center py-12 text-gray-400">
        <Wrench size={48} className="mx-auto mb-3 opacity-50" />
        <p>لا توجد أجهزة</p>
      </div>
    );
  }

  const statusLabel = (s) => ({ working: 'يعمل', maintenance: 'صيانة', stopped: 'متوقف' }[s] || s || '-');
  const statusColor = (s) => ({ working: 'text-green-600', maintenance: 'text-orange-600', stopped: 'text-red-600' }[s] || '');

  return (
    <div className="card overflow-hidden p-0">
      <div className="p-3 bg-moh-bg-light border-b text-sm font-semibold text-moh-primary">
        النتائج: {devices.length} جهاز
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-right">#</th>
              <th className="p-2 text-right">الاسم</th>
              <th className="p-2 text-right">النوع</th>
              <th className="p-2 text-right">الرقم التسلسلي</th>
              <th className="p-2 text-right">المستشفى</th>
              <th className="p-2 text-right">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d, idx) => (
              <tr key={d.id} className="border-t hover:bg-gray-50">
                <td className="p-2">{idx + 1}</td>
                <td className="p-2 font-medium">{d.name}</td>
                <td className="p-2">{d.type || '-'}</td>
                <td className="p-2 font-mono text-xs">{d.serialNumber || '-'}</td>
                <td className="p-2">{d.hospital?.name || '-'}</td>
                <td className={`p-2 font-semibold ${statusColor(d.status)}`}>{statusLabel(d.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
