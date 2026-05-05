import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Activity, Upload } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  MobileBackHeader, MobileLoadingState, MobileActionButton 
} from '../../components/mobile/MobileUI';

const MobileDeviceForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    receiveDate: '',
    value: '',
    location: '',
    hospitalId: '',
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imageName, setImageName] = useState('');
  const [device, setDevice] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadHospitals();
    if (isEdit) loadDevice();
  }, [id]);

  const loadHospitals = async () => {
    try {
      const res = await api.get('/hospitals');
      setHospitals(res.data.data || []);
    } catch (e) {}
  };

  const loadDevice = async () => {
    try {
      const res = await api.get(`/devices/${id}`);
      const d = res.data.data;
      setDevice(d);
      setFormData({
        code: d.code || '',
        name: d.name || '',
        receiveDate: d.receiveDate ? d.receiveDate.split('T')[0] : '',
        value: d.value || '',
        location: d.location || '',
        hospitalId: d.hospitalId || '',
      });
    } catch (e) {
      toast.error('فشل التحميل');
      navigate('/devices');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });
      
      if (imageFile) data.append('image', imageFile);
      
      if (isEdit) {
        await api.put(`/devices/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('تم التحديث');
      } else {
        await api.post('/devices', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('تم الإضافة');
      }
      navigate('/devices');
    } catch (e) {
      toast.error(e.response?.data?.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <MobileLoadingState />;

  // المسؤولون يختارون المستشفى، الباقي يستخدم مستشفاهم
  const canPickHospital = ['system_admin', 'system_supervisor'].includes(user?.role);

  return (
    <div>
      <MobileBackHeader
        title={isEdit ? 'تعديل جهاز' : 'إضافة جهاز'}
        onBack={() => navigate('/devices')}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Section title="🩺 بيانات الجهاز">
          <Field label="الرمز التعريفي" required>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className={inputClass}
              required
              placeholder="مثال: DEV-001"
              dir="ltr"
            />
          </Field>
          
          <Field label="اسم الجهاز" required>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
              required
            />
          </Field>
          
          <Field label="تاريخ الاستلام">
            <input
              type="date"
              value={formData.receiveDate}
              onChange={(e) => setFormData({ ...formData, receiveDate: e.target.value })}
              className={inputClass}
            />
          </Field>
          
          <Field label="القيمة (ريال)">
            <input
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className={inputClass}
              step="0.01"
              min={0}
              placeholder="0.00"
            />
          </Field>
          
          <Field label="الموقع داخل المستشفى">
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className={inputClass}
              placeholder="مثال: قسم العناية المركزة"
            />
          </Field>
          
          {canPickHospital && (
            <Field label="المستشفى" required>
              <select
                value={formData.hospitalId}
                onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
                className={selectClass}
                required
              >
                <option value="">اختر</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </Field>
          )}
        </Section>

        <Section title="📸 صورة الجهاز">
          <FileField
            current={device?.image}
            fileName={imageName}
            onChange={(f) => {
              setImageFile(f);
              setImageName(f.name);
            }}
          />
        </Section>

        <div className="space-y-2 pb-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm bg-moh-primary text-white active:scale-95 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'جاري الحفظ...' : (isEdit ? 'حفظ التعديلات' : 'إضافة الجهاز')}
          </button>
          <MobileActionButton
            icon={ArrowLeft}
            label="إلغاء"
            onClick={() => navigate('/devices')}
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

const FileField = ({ current, fileName, onChange }) => (
  <div>
    {current && !fileName && (
      <div className="mb-2">
        <img src={current} alt="حالي" className="w-full max-h-40 object-contain rounded-lg bg-gray-50 border" />
      </div>
    )}
    <label className="flex items-center gap-2 px-3 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-moh-primary hover:bg-gray-50 transition">
      <Upload size={18} className="text-gray-500" />
      <span className="text-xs text-gray-600 flex-1 truncate">
        {fileName || (current ? 'استبدال الصورة...' : 'اختر صورة...')}
      </span>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files[0];
          if (f) onChange(f);
        }}
        className="hidden"
      />
    </label>
  </div>
);

const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-moh-primary focus:ring-2 focus:ring-moh-primary/20 focus:outline-none";
const selectClass = inputClass + " bg-white";

export default MobileDeviceForm;
