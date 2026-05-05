import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowRight, Upload, User } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import RestoreWorkerModal from '../components/RestoreWorkerModal';

const FileInput = ({ label, name, current, onChange }) => {
  const [preview, setPreview] = useState(null);
  const handle = (e) => {
    const file = e.target.files[0];
    if (file) {
      onChange(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  // 🆕 v13: التحقق من توفر رقم الهوية
  const checkIdNumberAvailability = async (idNum) => {
    if (!idNum || idNum.length < 5) {
      setIdNumberCheckResult(null);
      return;
    }
    
    if (id && worker && idNum === worker.idNumber) {
      setIdNumberCheckResult(null);
      return;
    }
    
    setCheckingIdNumber(true);
    try {
      const params = { idNumber: idNum };
      if (id) params.excludeWorkerId = id;
      const res = await api.get('/workers/check-idnumber', { params });
      const data = res.data.data;
      setIdNumberCheckResult(data);
      
      // 🆕 v14: إن كان عامل محذوف ويمكن استرجاعه، افتح Modal
      if (data && !data.available && data.canRestore && data.existingWorker) {
        setRestoreCandidate(data.existingWorker);
        setShowRestoreModal(true);
      }
    } catch (e) {
      setIdNumberCheckResult(null);
    } finally {
      setCheckingIdNumber(false);
    }
  };


  return (
    <div>
      <label className="label">{label}</label>
      <label className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-moh-primary hover:bg-moh-bg-light transition text-sm text-gray-600">
        <Upload size={16} />
        {preview || current ? 'تغيير الملف' : 'رفع ملف'}
        <input type="file" accept="image/*,.pdf" className="hidden" onChange={handle} />
      </label>
      {(preview || current) && (
        <div className="mt-2">
          <img
            src={preview || current}
            alt=""
            className="w-20 h-20 object-cover rounded border"
            onError={(e) => (e.target.style.display = 'none')}
          />
        </div>
      )}
    </div>
  );
};

const WorkerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '', phone: '', idNumber: '', residencyTitle: '', sponsorName: '',
    nationalityId: '', qualificationId: '', religionId: '', jobTitleId: '', hospitalId: '',
    residencyExpiryDate: '', workStartDate: '', birthDate: '',
    medicalReportExpiryDate: '', healthCertificateExpiryDate: '',
    jobTitleMatchesResidency: false, underCompanySponsorship: false, onVacation: false,
  });
  const [files, setFiles] = useState({});
  const [lookups, setLookups] = useState({ nationalities: [], qualifications: [], religions: [], jobTitles: [], hospitals: [] });
  const [loading, setLoading] = useState(false);
  const [worker, setWorker] = useState(null);
  const [idNumberCheckResult, setIdNumberCheckResult] = useState(null);
  const [phoneCheckResult, setPhoneCheckResult] = useState(null);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreCandidate, setRestoreCandidate] = useState(null);
  const [checkingIdNumber, setCheckingIdNumber] = useState(false);

  // 🆕 v9: تحديد ما إذا كان المستخدم مدير/مشرف نظام (يرى كل المستشفيات)
  const isAdmin = ['system_admin', 'system_supervisor'].includes(user?.role);
  const restrictedToOwnHospital = !isAdmin && user?.hospitalId;


  useEffect(() => {
    loadLookups();
    if (isEdit) loadWorker();
  }, [id]);

  // التحقق إن كان العامل سعودياً
  const isSaudi = useMemo(() => {
    if (!formData.nationalityId || !lookups.nationalities.length) return false;
    const nat = lookups.nationalities.find((n) => String(n.id) === String(formData.nationalityId));
    return nat?.name === 'سعودي' || nat?.name?.includes('سعود');
  }, [formData.nationalityId, lookups.nationalities]);

  // إعادة تعيين الحقول الخاصة بغير السعوديين تلقائياً عند اختيار سعودي
  useEffect(() => {
    if (isSaudi) {
      setFormData((prev) => ({
        ...prev,
        residencyTitle: '',
        jobTitleMatchesResidency: false,
        underCompanySponsorship: false,
        residencyExpiryDate: '',
        sponsorName: '',
      }));
    }
  }, [isSaudi]);

  // 🆕 v9: تعيين مستشفى المستخدم تلقائياً للأدوار المحدودة (auto-fill hospital)
  useEffect(() => {
    if (restrictedToOwnHospital && user?.hospitalId && !id) {
      // فقط عند الإضافة الجديدة (ليس التعديل)
      setFormData((prev) => ({ ...prev, hospitalId: String(user.hospitalId) }));
    }
  }, [user, restrictedToOwnHospital, id]);

  // 🆕 v10: إعادة تعيين المسمى الوظيفي عند تغيير المستشفى (reset jobTitle when hospital changes)
  useEffect(() => {
    if (formData.hospitalId && formData.jobTitleId && lookups.jobTitles.length) {
      const validJob = lookups.jobTitles.find(
        (j) => String(j.id) === String(formData.jobTitleId) &&
               String(j.hospitalId) === String(formData.hospitalId)
      );
      if (!validJob) {
        // المسمى المختار لا ينتمي للمستشفى الجديد - نعيد تعيينه
        setFormData((prev) => ({ ...prev, jobTitleId: '' }));
      }
    }
  }, [formData.hospitalId, lookups.jobTitles]);



  const loadLookups = async () => {
    try {
      const [n, q, r, j, h] = await Promise.all([
        api.get('/nationalities'),
        api.get('/qualifications'),
        api.get('/religions'),
        api.get('/job-titles'),
        api.get('/hospitals'),
      ]);
      setLookups({
        nationalities: n.data.data, qualifications: q.data.data,
        religions: r.data.data, jobTitles: j.data.data, hospitals: h.data.data,
      });
    } catch (e) { console.error(e); }
  };

  const loadWorker = async () => {
    try {
      const res = await api.get(`/workers/${id}`);
      const w = res.data.data;
      setWorker(w);
      setFormData({
        name: w.name || '', phone: w.phone || '', idNumber: w.idNumber || '',
        residencyTitle: w.residencyTitle || '', sponsorName: w.sponsorName || '',
        nationalityId: w.nationalityId || '', qualificationId: w.qualificationId || '',
        religionId: w.religionId || '', jobTitleId: w.jobTitleId || '', hospitalId: w.hospitalId || '',
        residencyExpiryDate: w.residencyExpiryDate || '', workStartDate: w.workStartDate || '',
        birthDate: w.birthDate || '',
        medicalReportExpiryDate: w.medicalReportExpiryDate || '',
        healthCertificateExpiryDate: w.healthCertificateExpiryDate || '',
        jobTitleMatchesResidency: w.jobTitleMatchesResidency,
        underCompanySponsorship: w.underCompanySponsorship,
        onVacation: w.onVacation,
      });
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🆕 v14: منع الإرسال إن كان idNumber مكرر (إلا لو يمكن استرجاعه)
    if (idNumberCheckResult && idNumberCheckResult.available === false) {
      if (idNumberCheckResult.canRestore) {
        setRestoreCandidate(idNumberCheckResult.existingWorker);
        setShowRestoreModal(true);
        return;
      }
    
    // 🆕 v15: منع الإرسال إن كان phone مكرر
    if (phoneCheckResult && phoneCheckResult.available === false) {
      toast.error('رقم الجوال مستخدم مسبقاً - لا يمكن الحفظ');
      return;
    }
      toast.error('رقم الهوية مستخدم مسبقاً - لا يمكن الحفظ');
      return;
    }

    // التحقق من رقم الجوال إن كان مدخلاً
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      toast.error('رقم الجوال يجب أن يكون 10 أرقام');
      return;
    }

    setLoading(true);

    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => {
      if (v !== '' && v !== null) fd.append(k, v);
    });
    
    // 🆕 v14.1: السماح بالتكرار لو المستخدم اختار "إضافة كملف جديد"
    if (idNumberCheckResult?.allowDuplicate) {
      fd.append('allowDuplicate', 'true');
    }
    Object.entries(files).forEach(([k, v]) => {
      if (v) fd.append(k, v);
    });

    try {
      if (isEdit) {
        await api.put(`/workers/${id}`, fd);
        toast.success('تم التحديث بنجاح');
      } else {
        await api.post('/workers', fd);
        toast.success('تم الإضافة بنجاح');
      }
      navigate('/workers');
    } catch (e) { /* handled */ }
    finally { setLoading(false); }
  };

  // كلاس للحقول المعطلة
  const disabledClass = 'input bg-gray-100 cursor-not-allowed text-gray-400';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/workers')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowRight size={20} />
        </button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User size={26} />
          {isEdit ? 'تعديل بيانات العامل' : 'إضافة عامل جديد'}
        </h1>
      </div>

      {isSaudi && (
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-blue-800 text-sm">
            ℹ️ تم تعطيل حقول (مسمى الإقامة، المسمى مطابق للإقامة، على كفالة الشركة) لأن العامل سعودي الجنسية.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* القسم 1: البيانات الشخصية */}
        <div className="card">
          <h2 className="font-bold text-moh-primary mb-4 pb-2 border-b">البيانات الشخصية</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">الاسم *</label>
              <input required className="input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="label">رقم الإقامة/الهوية * (10 أرقام)</label>
              <input
                required
                maxLength={10}
                pattern="[0-9]{10}"
                inputMode="numeric"
                placeholder="10 أرقام"
                className={`input ${idNumberCheckResult?.available === false ? 'border-red-400 bg-red-50' : idNumberCheckResult?.available === true ? 'border-green-400 bg-green-50' : ''}`}
                value={formData.idNumber}
                onChange={async (e) => {
                  const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                  setFormData(prev => ({ ...prev, idNumber: v }));
                  
                  if (v.length !== 10) {
                    setIdNumberCheckResult(null);
                    return;
                  }
                  
                  if (id && worker && v === worker.idNumber) {
                    setIdNumberCheckResult(null);
                    return;
                  }
                  
                  setCheckingIdNumber(true);
                  try {
                    const params = { idNumber: v };
                    if (id) params.excludeWorkerId = id;
                    const res = await api.get('/workers/check-idnumber', { params });
                    const data = res.data.data;
                    setIdNumberCheckResult(data);
                    if (data && !data.available && data.canRestore && data.existingWorker) {
                      setRestoreCandidate(data.existingWorker);
                      setShowRestoreModal(true);
                    }
                  } catch (err) {
                    console.error('checkIdNumber error:', err);
                    setIdNumberCheckResult(null);
                  } finally {
                    setCheckingIdNumber(false);
                  }
                }}
              />
            </div>
            <div>
              <label className="label">رقم الجوال (10 أرقام)</label>
              <input
                type="tel"
                maxLength={10}
                pattern="[0-9]{10}"
                placeholder="05xxxxxxxx"
                className="input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
              />
            </div>
            <div>
              <label className="label">تاريخ الميلاد</label>
              <input type="date" className="input" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} />
            </div>
            <div>
              <label className="label">الجنسية</label>
              <select className="input" value={formData.nationalityId} onChange={(e) => setFormData({ ...formData, nationalityId: e.target.value })}>
                <option value="">اختر...</option>
                {lookups.nationalities.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">الديانة</label>
              <select className="input" value={formData.religionId} onChange={(e) => setFormData({ ...formData, religionId: e.target.value })}>
                <option value="">اختر...</option>
                {lookups.religions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">المؤهل</label>
              <select className="input" value={formData.qualificationId} onChange={(e) => setFormData({ ...formData, qualificationId: e.target.value })}>
                <option value="">اختر...</option>
                {lookups.qualifications.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* القسم 2: بيانات العمل */}
        <div className="card">
          <h2 className="font-bold text-moh-primary mb-4 pb-2 border-b">بيانات العمل</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">المستشفى</label>
              <select className="input" value={formData.hospitalId} onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}>
                <option value="">اختر...</option>
                {(restrictedToOwnHospital ? lookups.hospitals.filter(h => h.id === user?.hospitalId) : lookups.hospitals).map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">المسمى الوظيفي</label>
              <select className="input" value={formData.jobTitleId} onChange={(e) => setFormData({ ...formData, jobTitleId: e.target.value })}>
                <option value="">اختر...</option>
                {lookups.jobTitles.filter(j => !formData.hospitalId || String(j.hospitalId) === String(formData.hospitalId)).map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">
                مسمى الإقامة
                {isSaudi && <span className="text-gray-400 text-xs"> (غير مطلوب للسعوديين)</span>}
              </label>
              <input
                disabled={isSaudi}
                className={isSaudi ? disabledClass : 'input'}
                value={formData.residencyTitle}
                onChange={(e) => setFormData({ ...formData, residencyTitle: e.target.value })}
              />
            </div>
            <div>
              <label className="label">تاريخ بداية العمل</label>
              <input type="date" className="input" value={formData.workStartDate} onChange={(e) => setFormData({ ...formData, workStartDate: e.target.value })} />
            </div>
            <div>
              <label className="label">
                تاريخ انتهاء الإقامة
                {isSaudi && <span className="text-gray-400 text-xs"> (غير مطلوب للسعوديين)</span>}
              </label>
              <input
                type="date"
                disabled={isSaudi}
                className={isSaudi ? disabledClass : 'input'}
                value={formData.residencyExpiryDate}
                onChange={(e) => setFormData({ ...formData, residencyExpiryDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">
                اسم الكفيل
                {isSaudi && <span className="text-gray-400 text-xs"> (غير مطلوب للسعوديين)</span>}
              </label>
              <input
                disabled={isSaudi}
                className={isSaudi ? disabledClass : 'input'}
                value={formData.sponsorName}
                onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className={`flex items-center gap-2 p-3 border rounded-lg ${isSaudi ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-gray-50'}`}>
              <input
                type="checkbox"
                disabled={isSaudi}
                checked={formData.jobTitleMatchesResidency}
                onChange={(e) => setFormData({ ...formData, jobTitleMatchesResidency: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">المسمى مطابق للإقامة</span>
            </label>
            <label className={`flex items-center gap-2 p-3 border rounded-lg ${isSaudi ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-gray-50'}`}>
              <input
                type="checkbox"
                disabled={isSaudi}
                checked={formData.underCompanySponsorship}
                onChange={(e) => setFormData({ ...formData, underCompanySponsorship: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">على كفالة الشركة</span>
            </label>
            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" checked={formData.onVacation} onChange={(e) => setFormData({ ...formData, onVacation: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm">العامل بإجازة</span>
            </label>
          </div>
        </div>

        {/* القسم 3: التقارير الطبية والشهادات */}
        <div className="card">
          <h2 className="font-bold text-moh-primary mb-4 pb-2 border-b">التقارير الطبية والشهادات</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">تاريخ انتهاء التقرير الطبي</label>
              <input type="date" className="input" value={formData.medicalReportExpiryDate} onChange={(e) => setFormData({ ...formData, medicalReportExpiryDate: e.target.value })} />
            </div>
            <div>
              <label className="label">تاريخ انتهاء الشهادة الصحية</label>
              <input type="date" className="input" value={formData.healthCertificateExpiryDate} onChange={(e) => setFormData({ ...formData, healthCertificateExpiryDate: e.target.value })} />
            </div>
          </div>
        </div>

        {/* القسم 4: المرفقات */}
        <div className="card">
          <h2 className="font-bold text-moh-primary mb-4 pb-2 border-b">المرفقات</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FileInput label="صورة شخصية" name="personalImage" current={worker?.personalImage} onChange={(f) => setFiles({ ...files, personalImage: f })} />
            <FileInput label="صورة المؤهل" name="qualificationImage" current={worker?.qualificationImage} onChange={(f) => setFiles({ ...files, qualificationImage: f })} />
            <FileInput label="صورة الجواز" name="passportImage" current={worker?.passportImage} onChange={(f) => setFiles({ ...files, passportImage: f })} />
            <FileInput label="صورة الهوية / الإقامة" name="residencyImage" current={worker?.residencyImage} onChange={(f) => setFiles({ ...files, residencyImage: f })} />
            <FileInput label="التعهد الخطي" name="writtenPledgeImage" current={worker?.writtenPledgeImage} onChange={(f) => setFiles({ ...files, writtenPledgeImage: f })} />
            <FileInput label="شهادة الخبرة" name="experienceCertificateImage" current={worker?.experienceCertificateImage} onChange={(f) => setFiles({ ...files, experienceCertificateImage: f })} />
            <FileInput label="ترجمة الشهادات" name="certificatesTranslationImage" current={worker?.certificatesTranslationImage} onChange={(f) => setFiles({ ...files, certificatesTranslationImage: f })} />
            <FileInput label="ترجمة الخبرة" name="experienceTranslationImage" current={worker?.experienceTranslationImage} onChange={(f) => setFiles({ ...files, experienceTranslationImage: f })} />
            <FileInput label="خطاب التعيين" name="appointmentLetterImage" current={worker?.appointmentLetterImage} onChange={(f) => setFiles({ ...files, appointmentLetterImage: f })} />
            <FileInput label="التصنيف المهني" name="professionalClassificationImage" current={worker?.professionalClassificationImage} onChange={(f) => setFiles({ ...files, professionalClassificationImage: f })} />
            <FileInput label="التقرير الطبي" name="medicalReportImage" current={worker?.medicalReportImage} onChange={(f) => setFiles({ ...files, medicalReportImage: f })} />
            <FileInput label="الشهادة الصحية" name="healthCertificateImage" current={worker?.healthCertificateImage} onChange={(f) => setFiles({ ...files, healthCertificateImage: f })} />
          </div>
        </div>

        {/* أزرار الحفظ */}
        <div className="flex items-center gap-3 justify-end">
          <button type="button" onClick={() => navigate('/workers')} className="btn-secondary">
            إلغاء
          </button>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            <Save size={18} />
            {loading ? 'جاري الحفظ...' : isEdit ? 'تحديث' : 'حفظ'}
          </button>
        </div>
      </form>

      {showRestoreModal && restoreCandidate && (
                <RestoreWorkerModal
          existingWorker={restoreCandidate}
          currentForm={formData}
          onRestore={(restoredWorker) => {
            setShowRestoreModal(false);
            toast.success('تم استرجاع العامل');
            setTimeout(() => navigate(`/workers/${restoredWorker.id}`), 800);
          }}
          onCreateNew={() => {
            // إغلاق Modal مع السماح بالإضافة الجديدة
            setShowRestoreModal(false);
            setRestoreCandidate(null);
            // نُعلِّم النتيجة كـ available للسماح بالحفظ
            setIdNumberCheckResult({ available: true, allowDuplicate: true });
            toast.success('سيُنشأ ملف جديد - أكمل البيانات ثم اضغط حفظ');
          }}
          onClose={() => {
            setShowRestoreModal(false);
            setRestoreCandidate(null);
            setFormData((prev) => ({ ...prev, idNumber: '' }));
            setIdNumberCheckResult(null);
          }}
        />
      )}
    </div>
  );
};

export default WorkerForm;
