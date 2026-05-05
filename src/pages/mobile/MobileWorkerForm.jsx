import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Upload, Camera, AlertCircle, FileText } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  MobileBackHeader, MobileLoadingState, MobileActionButton 
} from '../../components/mobile/MobileUI';

const MobileWorkerForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  // 🆕 v23: كل الحقول من الديسكتوب
  const [formData, setFormData] = useState({
    name: '',
    idNumber: '',
    phone: '',
    nationalityId: '',
    jobTitleId: '',
    qualificationId: '',
    religionId: '',
    birthDate: '',
    workStartDate: '',
    residencyTitle: '',
    residencyExpiryDate: '',
    sponsorName: '',
    hospitalId: '',
    notes: '',
  });
  
  const [lookups, setLookups] = useState({
    nationalities: [],
    jobTitles: [],
    religions: [],
    qualifications: [],
    hospitals: [],
  });
  
  const [worker, setWorker] = useState(null);
  
  // 🆕 v23: كل الملفات من الديسكتوب
  const [files, setFiles] = useState({
    personalImage: null,
    qualificationImage: null,
    passportImage: null,
    residencyImage: null,
    writtenPledgeImage: null,
    experienceCertificateImage: null,
    certificatesTranslationImage: null,
    experienceTranslationImage: null,
    appointmentLetterImage: null,
    professionalClassificationImage: null,
    medicalReportImage: null,
    healthCertificateImage: null,
  });
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // 🆕 v23: التحقق من السعودي
  const isSaudi = useMemo(() => {
    if (!formData.nationalityId || !lookups.nationalities.length) return false;
    const nat = lookups.nationalities.find((n) => String(n.id) === String(formData.nationalityId));
    return nat?.name === 'سعودي' || nat?.name?.includes('سعود');
  }, [formData.nationalityId, lookups.nationalities]);

  // 🆕 v23: إعادة تعيين الحقول للسعودي
  useEffect(() => {
    if (isSaudi) {
      setFormData((prev) => ({
        ...prev,
        residencyTitle: '',
        residencyExpiryDate: '',
        sponsorName: '',
      }));
    }
  }, [isSaudi]);

  useEffect(() => {
    loadLookups();
    if (isEdit) loadWorker();
  }, [id]);

  const loadLookups = async () => {
    try {
      const promises = [
        api.get('/nationalities'),
        api.get('/job-titles'),
        api.get('/religions'),
        api.get('/qualifications').catch(() => ({ data: { data: [] } })),
        api.get('/hospitals').catch(() => ({ data: { data: [] } })),
      ];
      const [nats, jobs, rels, quals, hosps] = await Promise.all(promises);
      setLookups({
        nationalities: nats.data.data || [],
        jobTitles: jobs.data.data || [],
        religions: rels.data.data || [],
        qualifications: quals.data.data || [],
        hospitals: hosps.data.data || [],
      });
    } catch (e) {}
  };

  const loadWorker = async () => {
    try {
      const res = await api.get(`/workers/${id}`);
      const w = res.data.data;
      setWorker(w);
      setFormData({
        name: w.name || '',
        idNumber: w.idNumber || '',
        phone: w.phone || '',
        nationalityId: w.nationalityId || '',
        jobTitleId: w.jobTitleId || '',
        qualificationId: w.qualificationId || '',
        religionId: w.religionId || '',
        birthDate: w.birthDate ? w.birthDate.split('T')[0] : '',
        workStartDate: w.workStartDate ? w.workStartDate.split('T')[0] : '',
        residencyTitle: w.residencyTitle || '',
        residencyExpiryDate: w.residencyExpiryDate ? w.residencyExpiryDate.split('T')[0] : '',
        sponsorName: w.sponsorName || '',
        hospitalId: w.hospitalId || '',
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
        if (formData[key] !== '' && formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });
      
      // كل الملفات
      Object.keys(files).forEach(key => {
        if (files[key]) data.append(key, files[key]);
      });

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

  const canPickHospital = ['system_admin', 'system_supervisor'].includes(user?.role);

  return (
    <div>
      <MobileBackHeader
        title={isEdit ? 'تعديل العامل' : 'إضافة عامل جديد'}
        onBack={() => navigate('/workers')}
      />

      {/* تنبيه السعودي */}
      {isSaudi && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-start gap-2">
          <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            تم تعطيل حقول (مسمى الإقامة، الكفيل) لأن العامل سعودي الجنسية.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* البيانات الأساسية */}
        <Section title="📋 البيانات الأساسية">
          <Field label="الاسم الكامل" required>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
              required
            />
          </Field>
          
          <Field label="رقم الهوية / الإقامة" required>
            <input
              type="text"
              value={formData.idNumber}
              onChange={(e) => setFormData({ ...formData, idNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              className={inputClass}
              required
              maxLength={10}
              placeholder="10 أرقام"
            />
          </Field>
          
          <Field label="الجوال">
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              className={inputClass}
              maxLength={10}
              placeholder="05xxxxxxxx"
            />
          </Field>
          
          <Field label="تاريخ الميلاد">
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              className={inputClass}
            />
          </Field>
          
          <Field label="الجنسية" required>
            <select
              value={formData.nationalityId}
              onChange={(e) => setFormData({ ...formData, nationalityId: e.target.value })}
              className={selectClass}
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
              className={selectClass}
            >
              <option value="">اختر</option>
              {lookups.religions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
        </Section>

        {/* البيانات الوظيفية */}
        <Section title="💼 البيانات الوظيفية">
          {canPickHospital && !isEdit && (
            <Field label="المستشفى" required>
              <select
                value={formData.hospitalId}
                onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
                className={selectClass}
                required
              >
                <option value="">اختر</option>
                {lookups.hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </Field>
          )}
          
          <Field label="المسمى الوظيفي" required>
            <select
              value={formData.jobTitleId}
              onChange={(e) => setFormData({ ...formData, jobTitleId: e.target.value })}
              className={selectClass}
              required
            >
              <option value="">اختر</option>
              {lookups.jobTitles.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
          </Field>
          
          <Field label="المؤهل">
            <select
              value={formData.qualificationId}
              onChange={(e) => setFormData({ ...formData, qualificationId: e.target.value })}
              className={selectClass}
            >
              <option value="">اختر</option>
              {lookups.qualifications.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
          </Field>
          
          <Field label="تاريخ بداية العمل">
            <input
              type="date"
              value={formData.workStartDate}
              onChange={(e) => setFormData({ ...formData, workStartDate: e.target.value })}
              className={inputClass}
            />
          </Field>
        </Section>

        {/* الإقامة (للأجانب فقط) */}
        {!isSaudi && (
          <Section title="📜 بيانات الإقامة">
            <Field label="مسمى الإقامة">
              <input
                type="text"
                value={formData.residencyTitle}
                onChange={(e) => setFormData({ ...formData, residencyTitle: e.target.value })}
                className={inputClass}
              />
            </Field>
            
            <Field label="تاريخ انتهاء الإقامة">
              <input
                type="date"
                value={formData.residencyExpiryDate}
                onChange={(e) => setFormData({ ...formData, residencyExpiryDate: e.target.value })}
                className={inputClass}
              />
            </Field>
            
            <Field label="اسم الكفيل / المتعهد">
              <input
                type="text"
                value={formData.sponsorName}
                onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })}
                className={inputClass}
              />
            </Field>
          </Section>
        )}

        {/* المرفقات */}
        <Section title="📎 المرفقات">
          <FileField
            label="الصورة الشخصية"
            current={worker?.personalImage}
            onChange={(f) => setFiles({ ...files, personalImage: f })}
          />
          <FileField
            label="صورة المؤهل"
            current={worker?.qualificationImage}
            onChange={(f) => setFiles({ ...files, qualificationImage: f })}
          />
          
          {/* للأجانب فقط */}
          {!isSaudi && (
            <>
              <FileField
                label="صورة الجواز"
                current={worker?.passportImage}
                onChange={(f) => setFiles({ ...files, passportImage: f })}
              />
              <FileField
                label="صورة الإقامة"
                current={worker?.residencyImage}
                onChange={(f) => setFiles({ ...files, residencyImage: f })}
              />
            </>
          )}
          
          {/* للسعودي يحتاج هوية */}
          {isSaudi && (
            <FileField
              label="صورة الهوية الوطنية"
              current={worker?.residencyImage}
              onChange={(f) => setFiles({ ...files, residencyImage: f })}
            />
          )}
          
          <FileField
            label="التعهد الخطي"
            current={worker?.writtenPledgeImage}
            onChange={(f) => setFiles({ ...files, writtenPledgeImage: f })}
          />
          <FileField
            label="شهادة الخبرة"
            current={worker?.experienceCertificateImage}
            onChange={(f) => setFiles({ ...files, experienceCertificateImage: f })}
          />
          
          {/* ترجمات للأجانب فقط */}
          {!isSaudi && (
            <>
              <FileField
                label="ترجمة الشهادات"
                current={worker?.certificatesTranslationImage}
                onChange={(f) => setFiles({ ...files, certificatesTranslationImage: f })}
              />
              <FileField
                label="ترجمة الخبرة"
                current={worker?.experienceTranslationImage}
                onChange={(f) => setFiles({ ...files, experienceTranslationImage: f })}
              />
            </>
          )}
          
          <FileField
            label="خطاب التعيين"
            current={worker?.appointmentLetterImage}
            onChange={(f) => setFiles({ ...files, appointmentLetterImage: f })}
          />
          <FileField
            label="التصنيف المهني"
            current={worker?.professionalClassificationImage}
            onChange={(f) => setFiles({ ...files, professionalClassificationImage: f })}
          />
          <FileField
            label="التقرير الطبي"
            current={worker?.medicalReportImage}
            onChange={(f) => setFiles({ ...files, medicalReportImage: f })}
          />
          <FileField
            label="الشهادة الصحية"
            current={worker?.healthCertificateImage}
            onChange={(f) => setFiles({ ...files, healthCertificateImage: f })}
          />
        </Section>

        {/* ملاحظات */}
        <Section title="📝 ملاحظات">
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className={inputClass}
            rows={3}
            placeholder="أي ملاحظات إضافية..."
          />
        </Section>

        <div className="space-y-2 pb-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm bg-moh-primary text-white active:scale-95 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'جاري الحفظ...' : (isEdit ? 'حفظ التعديلات' : 'إضافة العامل')}
          </button>
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

const FileField = ({ label, current, onChange }) => {
  const [fileName, setFileName] = useState('');
  
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
        {current && <span className="text-green-600 text-xs mr-2">✓ مرفوع</span>}
      </label>
      <label className="flex items-center gap-2 px-3 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-moh-primary hover:bg-gray-50 transition">
        <Upload size={18} className="text-gray-500" />
        <span className="text-xs text-gray-600 flex-1 truncate">
          {fileName || (current ? 'استبدال الملف...' : 'اختر ملف...')}
        </span>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => {
            const f = e.target.files[0];
            if (f) {
              setFileName(f.name);
              onChange(f);
            }
          }}
          className="hidden"
        />
      </label>
    </div>
  );
};

const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-moh-primary focus:ring-2 focus:ring-moh-primary/20 focus:outline-none";
const selectClass = inputClass + " bg-white";

export default MobileWorkerForm;
