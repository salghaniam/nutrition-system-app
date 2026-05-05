import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Upload, CheckCircle, Clock, XCircle, FileText, FileHeart, Camera } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ATTACHMENTS = [
  { field: 'personalImage', label: 'الصورة الشخصية', icon: Camera, requiresApproval: false },
  { field: 'qualificationImage', label: 'صورة المؤهل', icon: FileText, requiresApproval: true },
  { field: 'professionalClassificationImage', label: 'التصنيف المهني', icon: FileText, requiresApproval: true },
  { field: 'experienceCertificateImage', label: 'شهادة الخبرة', icon: FileText, requiresApproval: true },
  { field: 'writtenPledgeImage', label: 'التعهد الخطي', icon: FileText, requiresApproval: true },
  { field: 'appointmentLetterImage', label: 'خطاب التعيين', icon: FileText, requiresApproval: true },
  { field: 'residencyImage', label: 'صورة الهوية / الإقامة', icon: FileText, requiresApproval: true },
];

const WorkerPortal = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('workerToken');
    if (!token) {
      navigate('/worker-login');
      return;
    }
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('workerToken');
      const res = await fetch('/api/worker-auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('workerToken');
          localStorage.removeItem('workerInfo');
          navigate('/worker-login');
        }
        return;
      }
      const data = await res.json();
      setProfile(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (field, file) => {
    if (!file) return;
    setUploading(field);
    try {
      const token = localStorage.getItem('workerToken');
      const fd = new FormData();
      fd.append('attachmentField', field);
      fd.append('file', file);
      
      const res = await fetch('/api/worker-auth/update-attachment', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        toast.error(data.message || 'فشل الرفع');
        return;
      }
      
      if (data.directUpdate) {
        toast.success('تم تحديث الصورة');
      } else {
        toast.success('تم الرفع - بانتظار اعتماد مشرف العمالة');
      }
      loadProfile();
    } catch (e) {
      toast.error('فشل الرفع');
    } finally {
      setUploading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('workerToken');
    localStorage.removeItem('workerInfo');
    navigate('/worker-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-moh-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!profile) return null;

  const { worker, pendingUpdates, approvedReport, approvedCert } = profile;

  // الحصول على حالة الـ pending update لحقل معيّن
  const getPendingFor = (field) => pendingUpdates?.find(u => u.attachmentField === field);

  const formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const isExpired = (date) => date && new Date(date) < new Date();

  return (
    <div className="min-h-screen bg-moh-bg-light pb-8">
      {/* الترويسة */}
      <div className="bg-moh-primary text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {worker.personalImage ? (
              <img src={worker.personalImage} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                {worker.name?.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="font-bold">{worker.name}</h1>
              <p className="text-xs opacity-80">رقم الهوية: {worker.idNumber}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-sm">
            <LogOut size={16} />
            خروج
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* بطاقة معلومات */}
        <div className="bg-white rounded-2xl shadow-soft p-5">
          <h2 className="font-bold text-moh-primary mb-4 flex items-center gap-2">
            <User size={20} /> بياناتي
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">الجنسية:</span> <strong>{worker.nationality?.name || '-'}</strong></div>
            <div><span className="text-gray-500">المسمى:</span> <strong>{worker.jobTitle?.name || '-'}</strong></div>
            <div><span className="text-gray-500">المستشفى:</span> <strong>{worker.hospital?.name || '-'}</strong></div>
            <div><span className="text-gray-500">المؤهل:</span> <strong>{worker.qualification?.name || '-'}</strong></div>
            <div><span className="text-gray-500">الديانة:</span> <strong>{worker.religion?.name || '-'}</strong></div>
            <div><span className="text-gray-500">الجوال:</span> <strong>{worker.phone || '-'}</strong></div>
          </div>
        </div>

        {/* التقرير الطبي والشهادة الصحية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-soft p-5">
            <h3 className="font-bold text-moh-primary mb-3 flex items-center gap-2">
              <FileText size={18} /> التقرير الطبي
            </h3>
            {approvedReport ? (
              <div className="space-y-1 text-sm">
                <p>📋 رقم: <strong>{approvedReport.reportNumber}</strong></p>
                <p>📅 الإصدار: {formatDate(approvedReport.issueDate)}</p>
                <p className={isExpired(approvedReport.expiryDate) ? 'text-red-600 font-bold' : 'text-green-600'}>
                  {isExpired(approvedReport.expiryDate) ? '⛔ منتهي' : '✅ ساري'} - {formatDate(approvedReport.expiryDate)}
                </p>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">لا يوجد تقرير طبي معتمد</p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-soft p-5">
            <h3 className="font-bold text-moh-primary mb-3 flex items-center gap-2">
              <FileHeart size={18} /> الشهادة الصحية
            </h3>
            {approvedCert ? (
              <div className="space-y-1 text-sm">
                <p>📋 رقم: <strong>{approvedCert.certificateNumber}</strong></p>
                <p>📅 الإصدار: {formatDate(approvedCert.issueDate)}</p>
                <p className={isExpired(approvedCert.expiryDate) ? 'text-red-600 font-bold' : 'text-green-600'}>
                  {isExpired(approvedCert.expiryDate) ? '⛔ منتهية' : '✅ سارية'} - {formatDate(approvedCert.expiryDate)}
                </p>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">لا توجد شهادة معتمدة</p>
            )}
          </div>
        </div>

        {/* المرفقات */}
        <div className="bg-white rounded-2xl shadow-soft p-5">
          <h2 className="font-bold text-moh-primary mb-4 flex items-center gap-2">
            <Upload size={20} /> مرفقاتي
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            يمكنك تحديث مرفقاتك. الصورة الشخصية تُحدَّث مباشرة، أما باقي المرفقات تحتاج اعتماد من مشرف العمالة.
          </p>
          
          <div className="space-y-3">
            {ATTACHMENTS.map((att) => {
              const Icon = att.icon;
              const currentImage = worker[att.field];
              const pending = getPendingFor(att.field);
              const isUploading = uploading === att.field;

              return (
                <div key={att.field} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Icon size={18} className="text-moh-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{att.label}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {currentImage ? (
                            <a href={currentImage} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                              عرض الحالي
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">لم يُرفع</span>
                          )}
                          {pending && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded flex items-center gap-1">
                              <Clock size={10} /> بانتظار الاعتماد
                            </span>
                          )}
                          {att.requiresApproval && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                              يحتاج اعتماد
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <label className={`cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
                      isUploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-moh-primary text-white hover:bg-moh-primary/90'
                    }`}>
                      <Upload size={14} />
                      {isUploading ? 'جاري...' : (currentImage ? 'تحديث' : 'رفع')}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploading || !!pending}
                        onChange={(e) => handleUpload(att.field, e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default WorkerPortal;
