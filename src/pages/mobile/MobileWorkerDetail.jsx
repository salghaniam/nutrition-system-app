import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Edit, Trash2, FileHeart, Stethoscope, ArrowRightLeft, Phone, Calendar,
  CreditCard, MapPin, Briefcase, Globe, Activity, FileText, Building2,
  GraduationCap, FileImage, ExternalLink, Eye, Printer
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  MobileBackHeader, MobileLoadingState, MobileBadge, MobileActionButton 
} from '../../components/mobile/MobileUI';
import HealthCertificateRequestModal from '../../components/HealthCertificateRequestModal';
import MedicalReportRequestModal from '../../components/MedicalReportRequestModal';
import WorkerTransferModal from '../../components/WorkerTransferModal';
import MobileDocumentViewer from '../../components/mobile/MobileDocumentViewer';

const MobileWorkerDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [certModal, setCertModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  
  // 🆕 v23: استخدام MobileDocumentViewer
  const [viewerUrl, setViewerUrl] = useState(null);
  const [viewerTitle, setViewerTitle] = useState('');

  const canEdit = ['hospital_head', 'labor_supervisor', 'system_admin'].includes(user?.role);
  const canDelete = ['hospital_head', 'labor_supervisor', 'system_admin', 'system_supervisor'].includes(user?.role);
  const canRequest = ['hospital_head', 'labor_supervisor', 'site_manager'].includes(user?.role);
  const canTransfer = ['hospital_head', 'system_admin', 'system_supervisor'].includes(user?.role);

  useEffect(() => { loadWorker(); }, [id]);

  const loadWorker = async () => {
    try {
      const res = await api.get(`/workers/${id}`);
      setWorker(res.data.data);
    } catch (e) {
      toast.error('فشل تحميل البيانات');
      navigate('/workers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف "${worker.name}"؟`)) return;
    try {
      await api.delete(`/workers/${id}`);
      toast.success('تم الحذف');
      navigate('/workers');
    } catch (e) {
      toast.error('فشل الحذف');
    }
  };

  // 🆕 v23: عرض الشهادة في Modal داخلي
  const handleViewCertificate = (certId) => {
    setViewerUrl(`/health-certificates/${certId}/form`);
    setViewerTitle('الشهادة الصحية');
  };

  if (loading) return <MobileLoadingState />;
  if (!worker) return null;

  // معلومات الشهادة من حقل worker.healthCertificateExpiryDate
  const expDate = worker.healthCertificateExpiryDate ? new Date(worker.healthCertificateExpiryDate) : null;
  const daysLeft = expDate ? Math.floor((expDate - new Date()) / (1000 * 60 * 60 * 24)) : null;

  // التحقق من السعودي
  const isSaudi = worker.nationality?.name === 'سعودي' || worker.nationality?.name?.includes('سعود');

  // قائمة المرفقات
  const attachments = [
    { key: 'qualificationImage', label: 'صورة المؤهل', icon: GraduationCap },
    !isSaudi && { key: 'passportImage', label: 'صورة الجواز', icon: FileImage },
    { key: 'residencyImage', label: isSaudi ? 'صورة الهوية' : 'صورة الإقامة', icon: CreditCard },
    { key: 'writtenPledgeImage', label: 'التعهد الخطي', icon: FileText },
    { key: 'experienceCertificateImage', label: 'شهادة الخبرة', icon: FileImage },
    !isSaudi && { key: 'certificatesTranslationImage', label: 'ترجمة الشهادات', icon: FileImage },
    !isSaudi && { key: 'experienceTranslationImage', label: 'ترجمة الخبرة', icon: FileImage },
    { key: 'appointmentLetterImage', label: 'خطاب التعيين', icon: FileText },
    { key: 'professionalClassificationImage', label: 'التصنيف المهني', icon: FileImage },
    { key: 'medicalReportImage', label: 'التقرير الطبي', icon: Stethoscope },
    { key: 'healthCertificateImage', label: 'الشهادة الصحية', icon: FileHeart },
  ].filter(Boolean);

  return (
    <div>
      <MobileBackHeader
        title={worker.name}
        onBack={() => navigate('/workers')}
        action={
          canEdit && (
            <button
              onClick={() => navigate(`/workers/${id}/edit`)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Edit size={20} />
            </button>
          )
        }
      />

      {/* 🆕 v23: Profile card مع الصورة الكبيرة */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
        <div className="bg-gradient-to-br from-moh-primary to-moh-primary-dark text-white p-5 text-center">
          {worker.personalImage ? (
            <img
              src={worker.personalImage}
              alt={worker.name}
              className="w-28 h-28 rounded-full object-cover mx-auto border-4 border-white/30 shadow-lg"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-28 h-28 rounded-full bg-white/20 mx-auto items-center justify-center font-bold text-4xl border-4 border-white/30"
            style={{ display: worker.personalImage ? 'none' : 'flex' }}
          >
            {worker.name?.charAt(0)}
          </div>
          <h2 className="text-xl font-bold mt-3">{worker.name}</h2>
          <p className="text-sm opacity-90 mt-1">{worker.jobTitle?.name || '—'}</p>
          {isSaudi && <MobileBadge color="green">🇸🇦 سعودي</MobileBadge>}
        </div>

        <div className="p-4 space-y-2">
          <InfoRow icon={CreditCard} label="رقم الهوية" value={worker.idNumber} />
          {worker.phone && <InfoRow icon={Phone} label="الجوال" value={worker.phone} />}
          {worker.nationality?.name && <InfoRow icon={Globe} label="الجنسية" value={worker.nationality.name} />}
          {worker.religion?.name && <InfoRow icon={Activity} label="الديانة" value={worker.religion.name} />}
          {worker.qualification?.name && <InfoRow icon={GraduationCap} label="المؤهل" value={worker.qualification.name} />}
          {worker.birthDate && <InfoRow icon={Calendar} label="تاريخ الميلاد" value={formatDate(worker.birthDate)} />}
          {worker.workStartDate && <InfoRow icon={Briefcase} label="بداية العمل" value={formatDate(worker.workStartDate)} />}
          {worker.hospital?.name && <InfoRow icon={Building2} label="المستشفى" value={worker.hospital.name} />}
        </div>
      </div>

      {/* بيانات الإقامة (للأجانب فقط) */}
      {!isSaudi && (worker.residencyTitle || worker.sponsorName || worker.residencyExpiryDate) && (
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <FileText size={18} />
            بيانات الإقامة
          </h3>
          <div className="space-y-2">
            {worker.residencyTitle && <InfoRow icon={CreditCard} label="مسمى الإقامة" value={worker.residencyTitle} />}
            {worker.residencyExpiryDate && <InfoRow icon={Calendar} label="انتهاء الإقامة" value={formatDate(worker.residencyExpiryDate)} />}
            {worker.sponsorName && <InfoRow icon={Briefcase} label="الكفيل" value={worker.sponsorName} />}
          </div>
        </div>
      )}

      {/* الشهادة الصحية */}
      {worker.healthCertificateExpiryDate && (
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2">
              <FileHeart size={18} className="text-green-600" />
              الشهادة الصحية
            </h3>
            {daysLeft < 0 ? (
              <MobileBadge color="red">منتهية</MobileBadge>
            ) : daysLeft < 30 ? (
              <MobileBadge color="yellow">قريبة الانتهاء</MobileBadge>
            ) : (
              <MobileBadge color="green">سارية</MobileBadge>
            )}
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">الانتهاء:</span>
              <span className="font-medium">{formatDate(worker.healthCertificateExpiryDate)}</span>
            </div>
            {daysLeft !== null && daysLeft >= 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">المتبقي:</span>
                <span className={`font-medium ${daysLeft < 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {daysLeft} يوم
                </span>
              </div>
            )}
          </div>

          {/* إن كانت هناك شهادة معتمدة، اعرضها */}
          {worker.healthCertificates?.find(c => c.status === 'approved') && (
            <button
              onClick={() => {
                const cert = worker.healthCertificates.find(c => c.status === 'approved');
                handleViewCertificate(cert.id);
              }}
              className="w-full mt-3 bg-moh-primary text-white py-2.5 rounded-lg text-sm font-medium active:scale-95 transition flex items-center justify-center gap-2"
            >
              <Eye size={16} />
              عرض الشهادة المعتمدة
            </button>
          )}
        </div>
      )}

      {/* 🆕 v23: المرفقات */}
      {attachments.some(a => worker[a.key]) && (
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <FileImage size={18} />
            المرفقات
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {attachments.map(att => {
              const fileUrl = worker[att.key];
              if (!fileUrl) return null;
              
              return (
                <a
                  key={att.key}
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition border border-gray-200"
                >
                  <div className="w-10 h-10 bg-moh-primary/10 text-moh-primary rounded-lg flex items-center justify-center">
                    <att.icon size={18} />
                  </div>
                  <span className="text-xs text-gray-700 text-center font-medium leading-tight">
                    {att.label}
                  </span>
                  <ExternalLink size={12} className="text-gray-400" />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* الإجراءات */}
      <div className="space-y-2 mb-4">
        <h3 className="font-bold text-sm text-gray-700 px-1">⚡ الإجراءات</h3>
        
        {canRequest && (
          <>
            <MobileActionButton
              icon={FileHeart}
              label="طلب شهادة صحية"
              color="success"
              onClick={() => setCertModal(true)}
            />
            <MobileActionButton
              icon={Stethoscope}
              label="طلب تقرير طبي"
              color="warning"
              onClick={() => setReportModal(true)}
            />
          </>
        )}
        
        {canTransfer && (
          <MobileActionButton
            icon={ArrowRightLeft}
            label="طلب نقل"
            color="primary"
            onClick={() => setTransferModal(true)}
          />
        )}
        
        {canEdit && (
          <MobileActionButton
            icon={Edit}
            label="تعديل البيانات"
            color="secondary"
            onClick={() => navigate(`/workers/${id}/edit`)}
          />
        )}
        
        {canDelete && (
          <MobileActionButton
            icon={Trash2}
            label="حذف العامل"
            color="danger"
            onClick={handleDelete}
          />
        )}
      </div>

      {/* Modals */}
      {certModal && (
        <HealthCertificateRequestModal
          worker={worker}
          onClose={() => setCertModal(false)}
          onSuccess={() => { setCertModal(false); loadWorker(); }}
        />
      )}
      {reportModal && (
        <MedicalReportRequestModal
          worker={worker}
          onClose={() => setReportModal(false)}
          onSuccess={() => { setReportModal(false); loadWorker(); }}
        />
      )}
      {transferModal && (
        <WorkerTransferModal
          worker={worker}
          onClose={() => setTransferModal(false)}
          onSuccess={() => { setTransferModal(false); loadWorker(); }}
        />
      )}
      
      {/* 🆕 v23: Document viewer modal */}
      {viewerUrl && (
        <MobileDocumentViewer
          url={viewerUrl}
          title={viewerTitle}
          onClose={() => setViewerUrl(null)}
        />
      )}
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-1.5">
    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
      <Icon size={16} className="text-gray-600" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium truncate">{value || '—'}</div>
    </div>
  </div>
);

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ar-SA');
};

export default MobileWorkerDetail;
