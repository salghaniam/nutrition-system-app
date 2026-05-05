import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, UserCog, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth, ROLE_NAMES } from '../context/AuthContext';

const Users = () => {
  const { user, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { load(); loadHospitals(); }, []);

  const load = async () => {
    const res = await api.get('/users');
    setUsers(res.data.data);
  };

  const loadHospitals = async () => {
    const res = await api.get('/hospitals');
    setHospitals(res.data.data);
  };

  const openModal = (item = null) => {
    setEditing(item);
    setForm(item ? { ...item, password: '' } : { isActive: true, role: 'site_manager' });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form };
      if (editing && !data.password) delete data.password;
      if (editing) await api.put(`/users/${editing.id}`, data);
      else await api.post('/users', data);
      toast.success('تم الحفظ');
      setShowModal(false);
      load();
    } catch (e) {}
  };

  const del = async (id) => {
    if (!confirm('هل تريد تعطيل هذا المستخدم؟')) return;
    await api.delete(`/users/${id}`);
    toast.success('تم التعطيل');
    load();
  };

  // الأدوار المتاحة حسب الدور الحالي
  const availableRoles = hasRole('hospital_head')
    ? ['labor_supervisor', 'devices_supervisor', 'site_manager']
    : Object.keys(ROLE_NAMES);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><UserCog size={28} />إدارة المستخدمين</h1>
        <button onClick={() => openModal()} className="btn-primary"><Plus size={18} />إضافة مستخدم</button>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-moh-bg-light">
            <tr>
              <th className="p-3 text-right text-sm font-semibold text-moh-primary">الاسم</th>
              <th className="p-3 text-right text-sm font-semibold text-moh-primary">اسم المستخدم</th>
              <th className="p-3 text-right text-sm font-semibold text-moh-primary">البريد</th>
              <th className="p-3 text-right text-sm font-semibold text-moh-primary">الدور</th>
              <th className="p-3 text-right text-sm font-semibold text-moh-primary">المستشفى</th>
              <th className="p-3 text-right text-sm font-semibold text-moh-primary">الحالة</th>
              <th className="p-3 text-right text-sm font-semibold text-moh-primary">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-moh-primary text-white flex items-center justify-center text-xs font-bold">
                      {u.fullName?.charAt(0)}
                    </div>
                    <span className="font-medium">{u.fullName}</span>
                  </div>
                </td>
                <td className="p-3 text-sm font-mono">{u.username}</td>
                <td className="p-3 text-sm">{u.email}</td>
                <td className="p-3"><span className="badge-info">{ROLE_NAMES[u.role]}</span></td>
                <td className="p-3 text-sm">{u.hospital?.name || '-'}</td>
                <td className="p-3">
                  {u.isActive
                    ? <span className="badge-success">نشط</span>
                    : <span className="badge-danger">معطل</span>}
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <button onClick={() => openModal(u)} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Edit size={14} /></button>
                    {u.id !== user?.id && (
                      <button onClick={() => del(u.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={save} className="bg-white rounded-2xl p-6 w-full max-w-xl space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck size={22} />
              {editing ? 'تعديل' : 'إضافة'} مستخدم
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="label">الاسم الكامل *</label><input required className="input" value={form.fullName || ''} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
              <div><label className="label">اسم المستخدم *</label><input required className="input" value={form.username || ''} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
              <div><label className="label">البريد الإلكتروني *</label><input required type="email" className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="label">رقم الهاتف</label><input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div>
                <label className="label">كلمة المرور {editing && '(اتركها فارغة لعدم التغيير)'}</label>
                <input type="password" required={!editing} className="input" value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <label className="label">الدور *</label>
                <select required className="input" value={form.role || ''} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {availableRoles.map((r) => <option key={r} value={r}>{ROLE_NAMES[r]}</option>)}
                </select>
              </div>
              {!['system_admin', 'system_supervisor'].includes(form.role) && (
                <div className="md:col-span-2">
                  <label className="label">المستشفى</label>
                  <select className="input" value={form.hospitalId || ''} onChange={(e) => setForm({ ...form, hospitalId: e.target.value })}>
                    <option value="">اختر...</option>
                    {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
              )}
              <label className="flex items-center gap-2 col-span-2 p-3 border rounded">
                <input type="checkbox" checked={form.isActive ?? true} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
                الحساب نشط
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">إلغاء</button>
              <button type="submit" className="btn-primary">حفظ</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Users;
