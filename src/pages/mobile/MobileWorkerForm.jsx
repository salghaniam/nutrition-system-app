import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Upload, Camera } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  MobileBackHeader, MobileLoadingState, MobileActionButton 
} from '../../components/mobile/MobileUI';

const MobileWorkerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    phone: '',
    nationalityId: '',
    jobTitleId: '',
    religionId: '',
    birthDate: '',
    notes: '',
  });
  
  const [lookups, setLookups] = useState({
    nationalities: [],
    jobTitles: [],
    religions: [],
  });
  
  const [files, setFiles] = useState({
    personalImage: null,
    idImage: null,
  });
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLookups();
    if (isEdit) loadWorker();
  }, [id]);

  const loadLookups = async () => {
    try {
      const [nats, jobs, rels] = await Promise.all([
        api.get('/nationalities'),
        api.get('/job-titles'),
        api.get('/religions'),
      ]);
      setLookups({
        nationalities: nats.data.data || [],
        jobTitles: jobs.data.data || [],
        religions: rels.data.data || [],
      });
    } catch (e) {}
  };

  const loadWorker = async () => {
    try {
      const res = await api.get(`/workers/${id}`);
      const w = res.data.data;
      setFormData({
        fullName: w.fullName || w.name || '',
        idNumber: w.idNumber || '',
        phone: w.phone || '',
        nationalityId: w.nationalityId || '',
        jobTitleId: w.jobTitleId || '',
        religionId: w.religionId || '',
        birthDate: w.birthDate ? w.birthDate.split('T')[0] : '',
        notes: w.notes || '',
      });
    } catch (e) {
      toast.error('فشل تحميل البيانات');
      navigate('/workers');
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
        if (formData[key]) data.append(key, formData[key]);
      });
      
      if (files.personalImage) data.append('personalImage', files.personalImage);
      if (files.idImage) data.append('idImage', files.idImage);

      if (isEdit) {
        await api.put(`/workers/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('تم التحديث');
      } else {
        await api.post('/workers', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('تم الإضافة');
      }
      navigate('/workers');
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
        title={isEdit ? 'تعديل العامل' : 'إضافة عامل جديد'}
        onBack={() => navigate('/workers')}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* البيانات الأساسية */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-sm text-gray-700">البيانات الأساسية</h3>
          
          <Field label="الاسم الكامل" required>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-moh-primary focus:ring-2 focus:ring-moh-primary/20 focus:outline-none"
              required
            />
          </Field>
          
          <Field label="رقم الهوية / الإقامة" required>
            <input
              type="text"
              value={formData.idNumber}
              onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-moh-primary focus:ring-2 focus:ring-moh-primary/20 focus:outline-none"
              required
              maxLength={10}
            />
          </Field>
          
          <Field label="الجوال">
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-moh-primary focus:ring-2 focus:ring-moh-primary/20 focus:outline-none"
              maxLength={10}
            />
          </Field>
          
          <Field label="تاريخ الميلاد">
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-moh-primary focus:ring-2 focus:ring-moh-primary/20 focus:outline-none"
            />
          </Field>
        </div>

        {/* البيانات الوظيفية */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-sm text-gray-700">البيانات الوظيفية</h3>
          
          <Field label="المسمى الوظيفي" required>
            <select
              value={formData.jobTitleId}
              onChange={(e) => setFormData({ ...formData, jobTitleId: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-moh-primary focus:ring-2 focus:ring-moh-primary/20 focus:outline-none"
              required
            >
              <option value="">اختر</option>
              {lookups.jobTitles.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
          </Field>
          
          <Field label="الجنسية" required>
            <select
              value={formData.nationalityId}
              onChange={(e) => setFormData({ ...formData, nationalityId: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-moh-primary focus:ring-2 focus:ring-moh-primary/20 focus:outline-none"
              required
            >
              <option value="">اختر</option>
              {lookups.nationalities.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </Field>
          
          <Field label="الديانة">
            <select
              value={formData.religionId}
              onChange={(e) => setFormData({ ...formData, religionId: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-moh-primary focus:ring-2 focus:ring-moh-primary/20 focus:outline-none"
            >
              <option value="">اختر</option>
              {lookups.religions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
        </div>

        {/* المرفقات */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-sm text-gray-700">المرفقات</h3>
          
          <FileField
            label="الصورة الشخصية"
            accept="image/*"
            file={files.personalImage}
            onChange={(file) => setFiles({ ...files, personalImage: file })}
          />
          
          <FileField
            label="صورة الهوية"
            accept="image/*"
            file={files.idImage}
            onChange={(file) => setFiles({ ...files, idImage: file })}
          />
        </div>

        {/* ملاحظات */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <Field label="ملاحظات">
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-moh-primary focus:ring-2 focus:ring-moh-primary/20 focus:outline-none"
              rows={3}
            />
          </Field>
        </div>

        {/* أزرار */}
        <div className="space-y-2 pb-4">
          <MobileActionButton
            icon={Save}
            label={saving ? 'جاري الحفظ...' : (isEdit ? 'حفظ التعديلات' : 'إضافة العامل')}
            onClick={handleSubmit}
            color="primary"
          />
          <MobileActionButton
            icon={ArrowLeft}
            label="إلغاء"
            onClick={() => navigate('/workers')}
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

const FileField = ({ label, accept, file, onChange }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
    <label className="flex items-center gap-2 px-3 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-moh-primary hover:bg-gray-50 transition">
      <Upload size={18} className="text-gray-500" />
      <span className="text-sm text-gray-600 flex-1 truncate">
        {file ? file.name : 'اختر ملف...'}
      </span>
      <input
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files[0])}
        className="hidden"
      />
    </label>
  </div>
);

export default MobileWorkerForm;
