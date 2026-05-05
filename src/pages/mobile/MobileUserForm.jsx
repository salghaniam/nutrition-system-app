import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, UserCog } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  MobileBackHeader, MobileLoadingState, MobileActionButton 
} from '../../components/mobile/MobileUI';

const ROLES = [
  { value: 'system_admin', label: 'مدير النظام' },
  { value: 'system_supervisor', label: 'مشرف نظام' },
  { value: 'hospital_head', label: 'رئيس قسم تغذية' },
  { value: 'labor_supervisor', label: 'مشرف عمالة' },
  { value: 'devices_supervisor', label: 'مشرف أجهزة' },
  { value: 'site_manager', label: 'مدير موقع' },
];

const MobileUserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: '',
    hospitalId: '',
    isActive: true,
  });
  
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadHospitals();
    if (isEdit) loadUser();
  }, [id]);

  const loadHospitals = async () => {
    try {
      const res = await api.get('/hospitals');
      setHospitals(res.data.data || []);
    } catch (e) {}
  };

  const loadUser = async () => {
    try {
      const res = await api.get(`/users/${id}`);
      const u = res.data.data;
      setFormData({
        username: u.username || '',
        password: '', // فارغ في التعديل
        fullName: u.fullName || '',
        role: u.role || '',
        hospitalId: u.hospitalId || '',
        isActive: u.isActive !== false,
      });
    } catch (e) {
      toast.error('فشل التحميل');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const data = { ...formData };
      
      // في التعديل، لا نرسل كلمة المرور إن كانت فارغة
      if (isEdit && !data.password) {
        delete data.password;
      }
      
      // هاسبيتالID فارغ → لا نرسله
      if (!data.hospitalId) delete data.hospitalId;
      
      if (isEdit) {
        await api.put(`/users/${id}`, data);
        toast.success('تم التحديث');
      } else {
        await api.post('/users', data);
        toast.success('تم الإضافة');
      }
      navigate('/users');
    } catch (e) {
      toast.error(e.response?.data?.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <MobileLoadingState />;

  // الأدوار التي تحتاج مستشفى
  const needsHospital = ['hospital_head', 'labor_supervisor', 'devices_supervisor', 'site_manager'].includes(formData.role);

  return (
    <div>
      <MobileBackHeader
        title={isEdit ? 'تعديل مستخدم' : 'إضافة مستخدم'}
        onBack={() => navigate('/users')}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-sm text-gray-700">📋 بيانات المستخدم</h3>
          
          <Field label="الاسم الكامل" required>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className={inputClass}
              required
            />
          </Field>
          
          <Field label="اسم المستخدم" required>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className={inputClass}
              required
              dir="ltr"
              autoComplete="off"
            />
          </Field>
          
          <Field 
            label={isEdit ? 'كلمة المرور (اتركها فارغة لعدم التغيير)' : 'كلمة المرور'} 
            required={!isEdit}
          >
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={inputClass}
              required={!isEdit}
              dir="ltr"
              autoComplete="new-password"
              minLength={6}
            />
            {!isEdit && (
              <p className="text-xs text-gray-500 mt-1">على الأقل 6 أحرف</p>
            )}
          </Field>
          
          <Field label="الدور" required>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className={selectClass}
              required
            >
              <option value="">اختر</option>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          
          {needsHospital && (
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
          
          {isEdit && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 accent-moh-primary"
              />
              <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                المستخدم فعّال
              </label>
            </div>
          )}
        </div>

        <div className="space-y-2 pb-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm bg-moh-primary text-white active:scale-95 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'جاري الحفظ...' : (isEdit ? 'حفظ التعديلات' : 'إضافة المستخدم')}
          </button>
          <MobileActionButton
            icon={ArrowLeft}
            label="إلغاء"
            onClick={() => navigate('/users')}
            color="secondary"
          />
        </div>
      </form>
    </div>
  );
};

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-moh-primary focus:ring-2 focus:ring-moh-primary/20 focus:outline-none";
const selectClass = inputClass + " bg-white";

export default MobileUserForm;
