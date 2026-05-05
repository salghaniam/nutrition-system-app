import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Edit, FileText, Calendar, MapPin, User, Briefcase, Phone } from 'lucide-react';
import api from '../services/api';

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-1 py-2 border-b border-gray-100 last:border-0">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-800">{value || '-'}</span>
  </div>
);

const FilePreview = ({ label, src }) => {
  if (!src) return null;
  const isPdf = src.endsWith('.pdf');
  return (
    <div className="border rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      {isPdf ? (
        <a href={src} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
          <FileText size={14} />
          عرض الملف PDF
        </a>
      ) : (
        <a href={src} target="_blank" rel="noreferrer">
          <img src={src} alt={label} className="w-full h-32 object-cover rounded" />
        </a>
      )}
    </div>
  );
};

const WorkerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      const res = await api.get(`/workers/${id}`);
      setWorker(res.data.data);
    } catch (e) {}
    finally { setLoading(false); }
  };

  if (loading) return <div className="text-center py-12"><div className="animate-spin w-12 h-12 border-4 border-moh-primary border-t-transparent rounded-full mx-auto"></div></div>;
  if (!worker) return <div className="text-center py-12 text-gray-400">لم يتم العثور على العامل</div>;

  const fmt = (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '-';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/workers')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowRight size={20} />
        </button>
        <h1 className="text-2xl font-bold flex-1">تفاصيل العامل</h1>
        <Link to={`/workers/${id}/edit`} className="btn-primary"><Edit size={16} />تعديل</Link>
      </div>

      {/* بطاقة المعلومات الرئيسية */}
      <div className="card flex flex-col md:flex-row gap-6">
        {worker.personalImage ? (
          <img src={worker.personalImage} alt="" className="w-32 h-32 rounded-2xl object-cover border-4 border-moh-bg-light" />
        ) : (
          <div className="w-32 h-32 rounded-2xl bg-moh-primary text-white text-4xl font-bold flex items-center justify-center">
            {worker.name?.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2">{worker.name}</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {worker.onVacation && <span className="badge-warning">في إجازة</span>}
            {worker.underCompanySponsorship && <span className="badge-info">على كفالة الشركة</span>}
            {worker.jobTitleMatchesResidency && <span className="badge-success">المسمى مطابق للإقامة</span>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Briefcase size={14} />{worker.jobTitle?.name || '-'}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={14} />{worker.hospital?.name}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User size={14} />{worker.nationality?.name || '-'}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={14} />{fmt(worker.workStartDate)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-bold text-moh-primary mb-3 pb-2 border-b">البيانات الشخصية</h3>
          <InfoRow label="رقم الهوية/الإقامة" value={worker.idNumber} />
          <InfoRow label="تاريخ الميلاد" value={fmt(worker.birthDate)} />
          <InfoRow label="الجنسية" value={worker.nationality?.name} />
          <InfoRow label="الديانة" value={worker.religion?.name} />
          <InfoRow label="المؤهل" value={worker.qualification?.name} />
          <InfoRow label="اسم الكفيل" value={worker.sponsorName} />
          <InfoRow label="رقم الجوال" value={worker.phone} />
        </div>

        <div className="card">
          <h3 className="font-bold text-moh-primary mb-3 pb-2 border-b">بيانات العمل</h3>
          <InfoRow label="المستشفى" value={worker.hospital?.name} />
          <InfoRow label="المسمى الوظيفي" value={worker.jobTitle?.name} />
          <InfoRow label="مسمى الإقامة" value={worker.residencyTitle} />
          <InfoRow label="تاريخ بداية العمل" value={fmt(worker.workStartDate)} />
          <InfoRow label="تاريخ انتهاء الإقامة" value={fmt(worker.residencyExpiryDate)} />
        </div>

        <div className="card md:col-span-2">
          <h3 className="font-bold text-moh-primary mb-3 pb-2 border-b">التقارير الطبية والشهادات</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="تاريخ انتهاء التقرير الطبي" value={fmt(worker.medicalReportExpiryDate)} />
            <InfoRow label="تاريخ انتهاء الشهادة الصحية" value={fmt(worker.healthCertificateExpiryDate)} />
          </div>
        </div>
      </div>

      {/* المرفقات */}
      <div className="card">
        <h3 className="font-bold text-moh-primary mb-3 pb-2 border-b">المرفقات</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FilePreview label="صورة المؤهل" src={worker.qualificationImage} />
          <FilePreview label="صورة الجواز" src={worker.passportImage} />
          <FilePreview label="صورة الإقامة" src={worker.residencyImage} />
          <FilePreview label="التعهد الخطي" src={worker.writtenPledgeImage} />
          <FilePreview label="شهادة الخبرة" src={worker.experienceCertificateImage} />
          <FilePreview label="ترجمة الشهادات" src={worker.certificatesTranslationImage} />
          <FilePreview label="ترجمة الخبرة" src={worker.experienceTranslationImage} />
          <FilePreview label="خطاب التعيين" src={worker.appointmentLetterImage} />
          <FilePreview label="التصنيف المهني" src={worker.professionalClassificationImage} />
          <FilePreview label="التقرير الطبي" src={worker.medicalReportImage} />
          <FilePreview label="الشهادة الصحية" src={worker.healthCertificateImage} />
        </div>
      </div>
    </div>
  );
};

export default WorkerDetail;
