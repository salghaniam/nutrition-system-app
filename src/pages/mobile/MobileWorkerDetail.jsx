import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Edit, Trash2, FileHeart, Stethoscope, ArrowRightLeft, Phone, Calendar,
  CreditCard, MapPin, Briefcase, Globe, Activity, FileText, ChevronLeft,
  Building2
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

const MobileWorkerDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [certModal, setCertModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [transferModal, setTransferModal] = useState(false);

  const canEdit = ['hospital_head', 'labor_supervisor', 'system_admin'].includes(user?.role);
  const canDelete = ['hospital_head', 'labor_supervisor', 'system_admin', 'system_supervisor'].includes(user?.role);
  const canRequest = ['hospital_head', 'labor_supervisor', 'site_manager'].includes(user?.role);
  const canTransfer = ['hospital_head', 'system_admin', 'system_supervisor'].includes(user?.role);

  useEffect(() => {
    loadWorker();
  }, [id]);

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
    if (!confirm(`هل أنت متأكد من حذف "${worker.fullName}"؟`)) return;
    try {
      await api.delete(`/workers/${id}`);
      toast.success('تم الحذف');
      navigate('/workers');
    } catch (e) {
      toast.error('فشل الحذف');
    }
  };

  // عرض الشهادة المعتمدة
  const handleViewCertificate = async (certId) => {
    try {
      const res = await api.get(`/health-certificates/${certId}/form`, { 
        responseType: 'text' 
      });
      const w = window.open('', '_blank', 'width=900,height=1200');
      if (w) {
        w.document.write(res.data);
        w.document.close();
      } else {
        toast.error('السماح للنوافذ المنبثقة مطلوب');
      }
    } catch (e) {
      toast.error('فشل عرض الشهادة');
    }
  };

  if (loading) return <MobileLoadingState />;
  if (!worker) return null;

  // Find active certificate
  const activeCert = worker.healthCertificates?.find(c => c.status === 'approved');
  const expDate = activeCert?.expiryDate ? new Date(activeCert.expiryDate) : null;
  const daysLeft = expDate ? Math.floor((expDate - new Date()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div>
      {/* Header */}
      <MobileBackHeader
        title={worker.fullName}
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

      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
        <div className="bg-gradient-to-br from-moh-primary to-moh-primary-dark text-white p-5 text-center">
          {worker.personalImage ? (
            <img
              src={`/uploads/workers/${worker.personalImage}`}
              alt={worker.fullName}
              className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white/30"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/20 mx-auto flex items-center justify-center font-bold text-3xl border-4 border-white/30">
              {worker.fullName?.charAt(0)}
            </div>
          )}
          <h2 className="text-xl font-bold mt-3">{worker.fullName}</h2>
          <p className="text-sm opacity-90 mt-1">{worker.jobTitle?.name}</p>
        </div>

        {/* Quick info */}
        <div className="p-4 space-y-2">
          <InfoRow icon={CreditCard} label="رقم الهوية" value={worker.idNumber} />
          {worker.phone && <InfoRow icon={Phone} label="الجوال" value={worker.phone} />}
          {worker.nationality?.name && <InfoRow icon={Globe} label="الجنسية" value={worker.nationality.name} />}
          {worker.religion?.name && <InfoRow icon={Activity} label="الديانة" value={worker.religion.name} />}
          {worker.birthDate && <InfoRow icon={Calendar} label="تاريخ الميلاد" value={formatDate(worker.birthDate)} />}
          {worker.hospital?.name && <InfoRow icon={Building2} label="المستشفى" value={worker.hospital.name} />}
        </div>
      </div>

      {/* Active Certificate */}
      {activeCert && (
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
            {activeCert.issueDate && (
              <div className="flex justify-between">
                <span className="text-gray-500">تاريخ الإصدار:</span>
                <span className="font-medium">{formatDate(activeCert.issueDate)}</span>
              </div>
            )}
            {activeCert.expiryDate && (
              <div className="flex justify-between">
                <span className="text-gray-500">تاريخ الانتهاء:</span>
                <span className="font-medium">{formatDate(activeCert.expiryDate)}</span>
              </div>
            )}
            {daysLeft !== null && daysLeft >= 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">المتبقي:</span>
                <span className={`font-medium ${daysLeft < 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {daysLeft} يوم
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => handleViewCertificate(activeCert.id)}
            className="w-full mt-3 bg-moh-primary text-white py-2.5 rounded-lg text-sm font-medium active:scale-95 transition"
          >
            عرض الشهادة المعتمدة
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 mb-4">
        <h3 className="font-bold text-sm text-gray-700 px-1">⚡ الإجراءات</h3>
        
        {canRequest && (
          <>
            <MobileActionButton
              icon={FileHeart}
              label="طلب شهادة صحية جديدة"
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

      {/* History */}
      {worker.healthCertificates?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <FileText size={18} />
            سجل الشهادات ({worker.healthCertificates.length})
          </h3>
          <div className="space-y-2">
            {worker.healthCertificates.slice(0, 5).map(cert => (
              <div key={cert.id} className="border-r-4 border-moh-primary bg-gray-50 rounded-lg p-2.5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">طلب #{cert.id}</div>
                    <div className="text-sm">{formatDate(cert.createdAt)}</div>
                  </div>
                  <MobileBadge color={
                    cert.status === 'approved' ? 'green' :
                    cert.status === 'rejected' ? 'red' : 'yellow'
                  }>
                    {cert.status === 'approved' ? 'معتمدة' : 
                     cert.status === 'rejected' ? 'مرفوضة' : 'قيد المراجعة'}
                  </MobileBadge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
