import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Activity, Upload } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Devices = () => {
  const { user, hasRole } = useAuth();
  const [items, setItems] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => { load(); loadHospitals(); }, []);

  const load = async () => {
    const res = await api.get('/devices');
    setItems(res.data.data);
  };

  const loadHospitals = async () => {
    const res = await api.get('/hospitals');
    setHospitals(res.data.data);
  };

  const openModal = (item = null) => {
    setEditing(item);
    setForm(item || {});
    setImageFile(null);
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined && k !== 'image' && k !== 'hospital') fd.append(k, v);
      });
      if (imageFile) fd.append('image', imageFile);

      if (editing) await api.put(`/devices/${editing.id}`, fd);
      else await api.post('/devices', fd);
      toast.success('تم الحفظ');
      setShowModal(false);
      load();
    } catch (e) {}
  };

  const del = async (id) => {
    if (!confirm('حذف الجهاز؟')) return;
    await api.delete(`/devices/${id}`);
    toast.success('تم الحذف');
    load();
  };

  const canManage = hasRole('system_admin', 'system_supervisor', 'hospital_head', 'devices_supervisor');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Activity size={28} />الأجهزة</h1>
        {canManage && (
          <button onClick={() => openModal()} className="btn-primary"><Plus size={18} />إضافة جهاز</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((d) => (
          <div key={d.id} className="card">
            {d.image && (
              <img src={d.image} alt="" className="w-full h-40 object-cover rounded-lg mb-3" />
            )}
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold">{d.name}</h3>
                <p className="text-xs text-gray-500 font-mono">{d.code}</p>
              </div>
              {canManage && (
                <div className="flex gap-1">
                  <button onClick={() => openModal(d)} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Edit size={14} /></button>
                  <button onClick={() => del(d.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              {d.location && <p>📍 {d.location}</p>}
              {d.value && <p>💰 {parseFloat(d.value).toLocaleString()} ر.س</p>}
              {d.receiveDate && <p>📅 {new Date(d.receiveDate).toLocaleDateString('ar-SA')}</p>}
              <p className="text-xs">{d.hospital?.name}</p>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="md:col-span-3 text-center py-12 text-gray-400">
            <Activity size={48} className="mx-auto mb-3 opacity-50" />
            <p>لا توجد أجهزة مسجلة</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={save} className="bg-white rounded-2xl p-6 w-full max-w-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold">{editing ? 'تعديل' : 'إضافة'} جهاز</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="label">كود الجهاز *</label><input required className="input" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div><label className="label">اسم الجهاز *</label><input required className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">تاريخ الاستلام</label><input type="date" className="input" value={form.receiveDate || ''} onChange={(e) => setForm({ ...form, receiveDate: e.target.value })} /></div>
              <div><label className="label">قيمة الجهاز</label><input type="number" step="0.01" className="input" value={form.value || ''} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
              <div className="md:col-span-2"><label className="label">المكان</label><input className="input" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              {hasRole('system_admin', 'system_supervisor') && (
                <div className="md:col-span-2">
                  <label className="label">المستشفى *</label>
                  <select required className="input" value={form.hospitalId || ''} onChange={(e) => setForm({ ...form, hospitalId: e.target.value })}>
                    <option value="">اختر...</option>
                    {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="label">صورة الجهاز</label>
                <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-moh-primary text-sm">
                  <Upload size={16} />
                  {imageFile ? imageFile.name : 'رفع صورة'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files[0])} />
                </label>
              </div>
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

export default Devices;
