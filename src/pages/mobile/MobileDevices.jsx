import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Trash2, Edit, Plus } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  MobileSearchBar, MobileEmptyState, MobileLoadingState, 
  MobileBadge, MobileFAB 
} from '../../components/mobile/MobileUI';

const MobileDevices = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const canEdit = ['hospital_head', 'devices_supervisor', 'system_admin'].includes(user?.role);
  const canAdd = canEdit;

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/devices');
      setDevices(res.data.data || []);
    } catch (e) {
      toast.error('فشل التحميل');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف الجهاز؟')) return;
    try {
      await api.delete(`/devices/${id}`);
      toast.success('تم الحذف');
      load();
    } catch (e) {
      toast.error('فشل الحذف');
    }
  };

  const filtered = devices.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.name?.toLowerCase().includes(q) ||
      d.code?.toLowerCase().includes(q) ||
      d.location?.toLowerCase().includes(q)
    );
  });

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('ar-SA') : '—';

  return (
    <div>
      <MobileSearchBar value={search} onChange={setSearch} placeholder="ابحث عن جهاز..." />

      {loading ? (
        <MobileLoadingState />
      ) : filtered.length === 0 ? (
        <MobileEmptyState 
          icon={Activity} 
          title="لا توجد أجهزة" 
          message={search ? 'جرّب بحثاً مختلفاً' : 'لم تتم إضافة أي أجهزة بعد'}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((device) => (
            <div key={device.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* صورة الجهاز */}
                  {device.image && (
                    <img
                      src={device.image}
                      alt={device.name}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate">{device.name}</h3>
                        <p className="text-xs text-gray-500" dir="ltr">{device.code}</p>
                      </div>
                      {!device.isActive && <MobileBadge color="red">معطّل</MobileBadge>}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-2 mt-3 text-xs space-y-1">
                  {device.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">الموقع:</span>
                      <span className="font-medium">{device.location}</span>
                    </div>
                  )}
                  {device.hospital?.name && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">المستشفى:</span>
                      <span className="font-medium truncate">{device.hospital.name}</span>
                    </div>
                  )}
                  {device.value && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">القيمة:</span>
                      <span className="font-medium">{Number(device.value).toLocaleString('ar-SA')} ر.س</span>
                    </div>
                  )}
                  {device.receiveDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">تاريخ الاستلام:</span>
                      <span>{formatDate(device.receiveDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {canEdit && (
                <div className="border-t border-gray-100 bg-gray-50 px-2 py-1.5 flex gap-1">
                  <button 
                    onClick={() => navigate(`/devices/${device.id}/edit`)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium"
                  >
                    <Edit size={14} /> تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(device.id)}
                    className="px-3 py-2 rounded-lg bg-red-100 text-red-700"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {canAdd && (
        <MobileFAB 
          icon={Plus} 
          label="إضافة جهاز" 
          onClick={() => navigate('/devices/new')}
        />
      )}
    </div>
  );
};

export default MobileDevices;
