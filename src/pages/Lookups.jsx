import { useEffect, useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Filter, X, Save, Building2, Users } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'job-titles', label: 'المسميات الوظيفية', endpoint: '/job-titles' },
  { id: 'nationalities', label: 'الجنسيات', endpoint: '/nationalities' },
  { id: 'qualifications', label: 'المؤهلات', endpoint: '/qualifications' },
  { id: 'religions', label: 'الديانات', endpoint: '/religions' },
  { id: 'medical-centers', label: 'المراكز الطبية', endpoint: '/medical-centers' },
];

const Lookups = () => {
  const { hasRole, user } = useAuth();
  const [activeTab, setActiveTab] = useState('job-titles');
  const [items, setItems] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterHospital, setFilterHospital] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', hospitalId: '', targetCount: '' });

  const isAdmin = hasRole('system_admin', 'system_supervisor');
  const isHospitalHead = hasRole('hospital_head');

  const canEdit = (item) => {
    if (activeTab === 'job-titles') {
      return isAdmin || (isHospitalHead && item?.hospitalId === user?.hospitalId);
    }
    return isAdmin;
  };
  const canAdd = activeTab === 'job-titles' ? (isAdmin || isHospitalHead) : isAdmin;

  const currentTab = TABS.find((t) => t.id === activeTab);
  const isJobTitles = activeTab === 'job-titles';

  useEffect(() => { loadData(); setSearch(''); }, [activeTab]);
  useEffect(() => { loadHospitals(); }, []);

  useEffect(() => {
    if (isJobTitles && isHospitalHead && user?.hospitalId) {
      setFilterHospital(String(user.hospitalId));
    }
  }, [isJobTitles, isHospitalHead, user]);

  const loadHospitals = async () => {
    try {
      const res = await api.get('/hospitals');
      setHospitals(res.data.data || []);
    } catch (e) {}
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get(currentTab.endpoint);
      setItems(res.data.data || []);
    } catch (e) {}
    finally { setLoading(false); }
  };

  const filteredItems = useMemo(() => {
    let result = items;
    if (search) {
      result = result.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()));
    }
    if (isJobTitles && filterHospital) {
      result = result.filter(i => String(i.hospitalId) === String(filterHospital));
    }
    return result;
  }, [items, search, filterHospital, isJobTitles]);

  const groupedByHospital = useMemo(() => {
    if (!isJobTitles) return null;
    const groups = {};
    filteredItems.forEach(item => {
      const hosp = hospitals.find(h => h.id === item.hospitalId);
      const hospName = hosp?.name || 'غير محدد';
      if (!groups[hospName]) groups[hospName] = [];
      groups[hospName].push(item);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [isJobTitles, filteredItems, hospitals]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '',
      hospitalId: isJobTitles && isHospitalHead ? user.hospitalId : (filterHospital || ''),
      targetCount: '',
    });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || '',
      hospitalId: item.hospitalId || '',
      targetCount: item.count || item.targetCount || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ name: '', hospitalId: '', targetCount: '' });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('الاسم مطلوب'); return; }
    if (isJobTitles && !form.hospitalId) { toast.error('يجب اختيار المستشفى'); return; }

    try {
      const payload = { name: form.name.trim() };
      if (isJobTitles) {
        payload.hospitalId = parseInt(form.hospitalId);
        if (form.targetCount) payload.count = parseInt(form.targetCount);
      }
      if (editing) {
        await api.put(`${currentTab.endpoint}/${editing.id}`, payload);
        toast.success('تم التحديث');
      } else {
        await api.post(currentTab.endpoint, payload);
        toast.success('تمت الإضافة');
      }
      closeModal();
      loadData();
    } catch (e) {}
  };

  const remove = async (id) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await api.delete(`${currentTab.endpoint}/${id}`);
      toast.success('تم الحذف');
      loadData();
    } catch (e) {}
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Users size={28} className="text-moh-primary" />البيانات المرجعية
      </h1>

      <div className="bg-white rounded-xl shadow-soft p-2 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              activeTab === t.id ? 'bg-moh-primary text-white' : 'text-gray-600 hover:bg-moh-bg-light'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text" placeholder="بحث بالاسم..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="input pr-10"
            />
          </div>

          {isJobTitles && isAdmin && (
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                className="input"
                value={filterHospital}
                onChange={(e) => setFilterHospital(e.target.value)}
                style={{ minWidth: '200px' }}
              >
                <option value="">كل المستشفيات</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          )}

          {canAdd && (
            <button onClick={openAdd} className="btn-primary">
              <Plus size={18} />إضافة
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-moh-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : isJobTitles && groupedByHospital ? (
        <div className="space-y-3">
          {groupedByHospital.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <Users size={48} className="mx-auto mb-3 opacity-50" />
              <p>لا توجد مسميات</p>
            </div>
          ) : (
            groupedByHospital.map(([hospName, hospItems]) => (
              <div key={hospName} className="card">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                  <Building2 size={20} className="text-moh-primary" />
                  <h3 className="font-bold text-moh-primary">{hospName}</h3>
                  <span className="text-xs bg-moh-bg-light text-moh-primary px-2 py-0.5 rounded-full">
                    {hospItems.length} مسمى
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {hospItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.name}</div>
                        {(item.count || item.targetCount) && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            العدد المطلوب: {item.count || item.targetCount}
                          </div>
                        )}
                      </div>
                      {canEdit(item) && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => remove(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>لا توجد بيانات</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-moh-bg-light text-right">
                <tr>
                  <th className="p-3 text-sm font-semibold text-moh-primary">#</th>
                  <th className="p-3 text-sm font-semibold text-moh-primary">الاسم</th>
                  {isAdmin && <th className="p-3 text-sm font-semibold text-moh-primary">إجراءات</th>}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => (
                  <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-500">{idx + 1}</td>
                    <td className="p-3 font-medium">{item.name}</td>
                    {isAdmin && (
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => remove(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-lg">
                {editing ? 'تعديل' : 'إضافة'} - {currentTab.label}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-200 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={save} className="p-4 space-y-4">
              <div>
                <label className="label">الاسم *</label>
                <input
                  required type="text" className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {isJobTitles && (
                <>
                  <div>
                    <label className="label">المستشفى *</label>
                    <select
                      required className="input"
                      value={form.hospitalId}
                      onChange={(e) => setForm({ ...form, hospitalId: e.target.value })}
                      disabled={isHospitalHead && !isAdmin}
                    >
                      <option value="">اختر...</option>
                      {hospitals
                        .filter(h => isAdmin || h.id === user?.hospitalId)
                        .map(h => <option key={h.id} value={h.id}>{h.name}</option>)
                      }
                    </select>
                    {isHospitalHead && !isAdmin && (
                      <p className="text-xs text-gray-500 mt-1">يمكنك الإضافة لمستشفاك فقط</p>
                    )}
                  </div>
                  <div>
                    <label className="label">العدد المطلوب</label>
                    <input
                      type="number" min="0" className="input"
                      placeholder="اتركه فارغاً لعدم تحديد سقف"
                      value={form.targetCount}
                      onChange={(e) => setForm({ ...form, targetCount: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      📊 عند تحديده، النظام يمنع إضافة عمال أكثر من هذا العدد
                    </p>
                  </div>
                </>
              )}

              <div className="flex gap-2 justify-end pt-2 border-t">
                <button type="button" onClick={closeModal} className="btn-secondary">إلغاء</button>
                <button type="submit" className="btn-primary">
                  <Save size={16} />{editing ? 'تحديث' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lookups;
