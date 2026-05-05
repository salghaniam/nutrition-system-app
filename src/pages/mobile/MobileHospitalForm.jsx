import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Building2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  MobileBackHeader, MobileLoadingState, MobileActionButton 
} from '../../components/mobile/MobileUI';

const MobileHospitalForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    bedsCount: 0,
    techniciansCount: 0,
    generalSpecialistsCount: 0,
    therapeuticSpecialistsCount: 0,
    hasClinic: false,
    contactNumber: '',
    contractorName: '',
    contractorContractEndDate: '',
    isActive: true,
  });
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) loadHospital();
  }, [id]);

  const loadHospital = async () => {
    try {
      const res = await api.get(`/hospitals/${id}`);
      const h = res.data.data;
      setFormData({
        name: h.name || '',
        address: h.address || '',
        bedsCount: h.bedsCount || 0,
        techniciansCount: h.techniciansCount || 0,
        generalSpecialistsCount: h.generalSpecialistsCount || 0,
        therapeuticSpecialistsCount: h.therapeuticSpecialistsCount || 0,
        hasClinic: !!h.hasClinic,
        contactNumber: h.contactNumber || '',
        contractorName: h.contractorName || '',
        contractorContractEndDate: h.contractorContractEndDate ? h.contractorContractEndDate.split('T')[0] : '',
        isActive: h.isActive !== false,
      });
    } catch (e) {
      toast.error('فشل التحميل');
      navigate('/hospitals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const data = { ...formData };
      
      // إزالة contractorContractEndDate إن كان فارغاً
      if (!data.contractorContractEndDate) delete data.contractorContractEndDate;
      
      if (isEdit) {
        await api.put(`/hospitals/${id}`, data);
        toast.success('تم التحديث');
      } else {
        await api.post('/hospitals', data);
        toast.success('تم الإضافة');
      }
      navigate('/hospitals');
    } catch (e) {
      toast.error(e.response?.data?.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <MobileLoadingState />;

  return (
    <div>
      <MobileBackHeader
        title={isEdit ? 'تعديل مستشفى' : 'إضافة مستشفى'}
        onBack={() => navigate('/hospitals')}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Section title="🏥 بيانات المستشفى">
          <Field label="اسم المستشفى" required>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
              required
            />
          </Field>
          
          <Field label="العنوان" required>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={inputClass}
              required
              rows={2}
            />
          </Field>
          
          <Field label="رقم التواصل">
            <input
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              className={inputClass}
              dir="ltr"
            />
          </Field>
          
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="hasClinic"
              checked={formData.hasClinic}
              onChange={(e) => setFormData({ ...formData, hasClinic: e.target.checked })}
              className="w-5 h-5 accent-moh-primary"
            />
            <label htmlFor="hasClinic" className="text-sm font-medium cursor-pointer">
              يحتوي على عيادة
            </label>
          </div>
        </Section>

        <Section title="📊 الأعداد">
          <Field label="عدد الأسرّة">
            <input
              type="number"
              value={formData.bedsCount}
              onChange={(e) => setFormData({ ...formData, bedsCount: parseInt(e.target.value) || 0 })}
              className={inputClass}
              min={0}
            />
          </Field>
          
          <Field label="عدد الفنيين">
            <input
              type="number"
              value={formData.techniciansCount}
              onChange={(e) => setFormData({ ...formData, techniciansCount: parseInt(e.target.value) || 0 })}
              className={inputClass}
              min={0}
            />
          </Field>
          
          <Field label="عدد الأخصائيين العامين">
            <input
              type="number"
              value={formData.generalSpecialistsCount}
              onChange={(e) => setFormData({ ...formData, generalSpecialistsCount: parseInt(e.target.value) || 0 })}
              className={inputClass}
              min={0}
            />
          </Field>
          
          <Field label="عدد الأخصائيين العلاجيين">
            <input
              type="number"
              value={formData.therapeuticSpecialistsCount}
              onChange={(e) => setFormData({ ...formData, therapeuticSpecialistsCount: parseInt(e.target.value) || 0 })}
              className={inputClass}
              min={0}
            />
          </Field>
        </Section>

        <Section title="🤝 المتعهد">
          <Field label="اسم المتعهد">
            <input
              type="text"
              value={formData.contractorName}
              onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
              className={inputClass}
            />
          </Field>
          
          <Field label="تاريخ انتهاء العقد">
            <input
              type="date"
              value={formData.contractorContractEndDate}
              onChange={(e) => setFormData({ ...formData, contractorContractEndDate: e.target.value })}
              className={inputClass}
            />
          </Field>
        </Section>

        <div className="space-y-2 pb-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm bg-moh-primary text-white active:scale-95 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'جاري الحفظ...' : (isEdit ? 'حفظ التعديلات' : 'إضافة المستشفى')}
          </button>
          <MobileActionButton
            icon={ArrowLeft}
            label="إلغاء"
            onClick={() => navigate('/hospitals')}
            color="secondary"
          />
        </div>
      </form>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
    <h3 className="font-bold text-sm text-gray-700">{title}</h3>
    {children}
  </div>
);

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-moh-primary focus:ring-2 focus:ring-moh-primary/20 focus:outline-none";

export default MobileHospitalForm;
