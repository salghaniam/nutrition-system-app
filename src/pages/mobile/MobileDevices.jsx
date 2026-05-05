import { useState, useEffect } from 'react';
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
      d.serialNumber?.toLowerCase().includes(q) ||
      d.model?.toLowerCase().includes(q)
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
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{device.name || 'جهاز'}</h3>
                    {device.model && <p className="text-xs text-gray-500">{device.model}</p>}
                  </div>
                  {device.status && (
                    <MobileBadge color={device.status === 'active' ? 'green' : 'gray'}>
                      {device.status === 'active' ? 'فعال' : 'غير فعال'}
                    </MobileBadge>
                  )}
                </div>
                
                <div className="bg-gray-50 rounded-lg p-2 text-xs space-y-1">
                  {device.serialNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">الرقم التسلسلي:</span>
                      <span className="font-medium">{device.serialNumber}</span>
                    </div>
                  )}
                  {device.hospital?.name && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">المستشفى:</span>
                      <span className="font-medium">{device.hospital.name}</span>
                    </div>
                  )}
                  {device.purchaseDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">تاريخ الشراء:</span>
                      <span>{formatDate(device.purchaseDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {canEdit && (
                <div className="border-t border-gray-100 bg-gray-50 px-2 py-1.5 flex gap-1">
                  <button className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium">
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
        <MobileFAB icon={Plus} label="إضافة جهاز" onClick={() => toast('قريباً', { icon: '🚧' })} />
      )}
    </div>
  );
};

export default MobileDevices;
