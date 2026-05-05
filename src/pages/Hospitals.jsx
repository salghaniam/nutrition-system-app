import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Hospitals = () => {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    const res = await api.get('/hospitals');
    setItems(res.data.data);
  };

  const openModal = (item = null) => {
    setEditing(item);
    setForm(item || {
      bedsCount: 0,
      techniciansCount: 0,
      generalSpecialistsCount: 0,
      therapeuticSpecialistsCount: 0,
      hasClinic: false,
      contractorName: '',
      contractorContractEndDate: '',
    });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      // تنظيف الحقول الفارغة من التواريخ
      const payload = { ...form };
      if (!payload.contractorContractEndDate) delete payload.contractorContractEndDate;
      
      if (editing) await api.put(`/hospitals/${editing.id}`, payload);
      else await api.post('/hospitals', payload);
      toast.success('تم الحفظ');
      setShowModal(false);
      load();
    } catch (e) {}
  };

  const del = async (id) => {
    if (!confirm('هل تريد حذف المستشفى؟')) return;
    await api.delete(`/hospitals/${id}`);
    toast.success('تم الحذف');
    load();
  };

  // عداد للمتعهدين قريبة الانتهاء
  const isContractExpiringSoon = (date) => {
    if (!date) return false;
    const days = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
    return days > 0 && days < 60;
  };

  const isContractExpired = (date) => date && new Date(date) < new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 size={28} /> المستشفيات</h1>
        <button onClick={() => openModal()} className="btn-primary"><Plus size={18} />إضافة مستشفى</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((h) => (
          <div key={h.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-lg">{h.name}</h3>
              <div className="flex gap-1">
                <button onClick={() => openModal(h)} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Edit size={16} /></button>
                <button onClick={() => del(h.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">{h.address}</p>
            
            {/* معلومات المتعهد */}
            {h.contractorName && (
              <div className="bg-blue-50 border border-blue-100 p-2 rounded mb-3 text-sm">
                <div className="flex items-center justify-between">
                  <span><strong>المتعهد:</strong> {h.contractorName}</span>
                  {h.contractorContractEndDate && (
                    <span className={`text-xs ${
                      isContractExpired(h.contractorContractEndDate) ? 'text-red-600 font-bold' :
                      isContractExpiringSoon(h.contractorContractEndDate) ? 'text-orange-600' :
                      'text-gray-600'
                    }`}>
                      ينتهي: {new Date(h.contractorContractEndDate).toLocaleDateString('ar-SA-u-nu-latn')}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-moh-bg-light p-2 rounded">عدد الأسرّة: <strong>{h.bedsCount}</strong></div>
              <div className="bg-moh-bg-light p-2 rounded">الفنيين: <strong>{h.techniciansCount}</strong></div>
              <div className="bg-moh-bg-light p-2 rounded">إخصائيين عامة: <strong>{h.generalSpecialistsCount}</strong></div>
              <div className="bg-moh-bg-light p-2 rounded">إخصائيين علاج: <strong>{h.therapeuticSpecialistsCount}</strong></div>
            </div>
            {h.hasClinic && <span className="badge-success mt-2 inline-block">يوجد عيادة</span>}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={save} className="bg-white rounded-2xl p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold">{editing ? 'تعديل' : 'إضافة'} مستشفى</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">اسم المستشفى *</label>
                <input required className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">رقم التواصل</label>
                <input className="input" value={form.contactNumber || ''} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="label">العنوان *</label>
                <input required className="input" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            </div>

            {/* قسم المتعهد - الحقول الجديدة */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-moh-primary mb-3">معلومات المتعهد</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">اسم المتعهد</label>
                  <input
                    className="input"
                    placeholder="مثال: مجموعة شركات الظاهري"
                    value={form.contractorName || ''}
                    onChange={(e) => setForm({ ...form, contractorName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">تاريخ نهاية عقد المتعهد</label>
                  <input
                    type="date"
                    className="input"
                    value={form.contractorContractEndDate ? form.contractorContractEndDate.split('T')[0] : ''}
                    onChange={(e) => setForm({ ...form, contractorContractEndDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* أعداد الموظفين */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-moh-primary mb-3">أعداد الموظفين والمنشأة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="label">عدد الأسرّة</label><input type="number" className="input" value={form.bedsCount || 0} onChange={(e) => setForm({ ...form, bedsCount: +e.target.value })} /></div>
                <div><label className="label">عدد الفنيين</label><input type="number" className="input" value={form.techniciansCount || 0} onChange={(e) => setForm({ ...form, techniciansCount: +e.target.value })} /></div>
                <div><label className="label">إخصائيين عامة</label><input type="number" className="input" value={form.generalSpecialistsCount || 0} onChange={(e) => setForm({ ...form, generalSpecialistsCount: +e.target.value })} /></div>
                <div><label className="label">إخصائيين علاج</label><input type="number" className="input" value={form.therapeuticSpecialistsCount || 0} onChange={(e) => setForm({ ...form, therapeuticSpecialistsCount: +e.target.value })} /></div>
              </div>
              <label className="flex items-center gap-2 mt-3 p-3 border rounded">
                <input type="checkbox" checked={form.hasClinic || false} onChange={(e) => setForm({ ...form, hasClinic: e.target.checked })} className="w-4 h-4" />
                يوجد عيادة
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">إلغاء</button>
              <button type="submit" className="btn-primary">حفظ</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Hospitals;
