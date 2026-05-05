import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader, ArrowRight, Phone, CreditCard, MessageSquare } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const WorkerLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: idNumber+phone, 2: OTP
  const [form, setForm] = useState({ idNumber: '', phone: '', otp: '' });
  const [workerId, setWorkerId] = useState(null);
  const [loading, setLoading] = useState(false);

  const requestLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/worker-auth/request-login', {
        idNumber: form.idNumber.trim(),
        phone: form.phone.trim(),
      });

      if (res.data.requiresOTP) {
        setWorkerId(res.data.workerId);
        setStep(2);
        toast.success('تم إرسال رمز التحقق عبر WhatsApp');
      } else {
        // دخول مباشر
        localStorage.setItem('workerToken', res.data.token);
        localStorage.setItem('workerInfo', JSON.stringify(res.data.worker));
        toast.success('مرحباً ' + res.data.worker.name);
        navigate('/worker-portal');
      }
    } catch (e) {
      // معالج
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/worker-auth/verify-login', {
        workerId,
        otp: form.otp.trim(),
      });
      localStorage.setItem('workerToken', res.data.token);
      localStorage.setItem('workerInfo', JSON.stringify(res.data.worker));
      toast.success('مرحباً ' + res.data.worker.name);
      navigate('/worker-portal');
    } catch (e) {
      // معالج
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-moh-bg-light to-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-moh-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CreditCard size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">بوابة العامل</h1>
          <p className="text-gray-500 text-sm mt-1">قسم التغذية - تجمع القصيم الصحي</p>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-6">
          {step === 1 ? (
            <form onSubmit={requestLogin} className="space-y-4">
              <h2 className="font-bold text-lg text-moh-primary text-center mb-4">
                تسجيل الدخول
              </h2>

              <div>
                <label className="label flex items-center gap-1">
                  <CreditCard size={14} />
                  رقم الهوية / الإقامة *
                </label>
                <input
                  required
                  type="text"
                  className="input"
                  placeholder="1234567890"
                  value={form.idNumber}
                  onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="label flex items-center gap-1">
                  <Phone size={14} />
                  رقم الجوال *
                </label>
                <input
                  required
                  type="tel"
                  className="input"
                  placeholder="05xxxxxxxx"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  أدخل نفس الرقم المسجل لدى مشرفك
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                {loading ? (
                  <><Loader size={16} className="animate-spin" /> جاري التحقق...</>
                ) : (
                  <>تسجيل الدخول <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOTP} className="space-y-4">
              <h2 className="font-bold text-lg text-moh-primary text-center mb-4">
                <MessageSquare size={20} className="inline ml-1" />
                التحقق من الرمز
              </h2>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                تم إرسال رمز التحقق إلى رقم الجوال عبر WhatsApp
              </div>

              <div>
                <label className="label">رمز التحقق *</label>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="6"
                  className="input text-center text-2xl tracking-widest"
                  placeholder="000000"
                  value={form.otp}
                  onChange={(e) => setForm({ ...form, otp: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                {loading ? (
                  <><Loader size={16} className="animate-spin" /> جاري...</>
                ) : (
                  'تأكيد'
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setForm({ ...form, otp: '' }); }}
                className="btn-secondary w-full justify-center"
              >
                العودة
              </button>
            </form>
          )}

          <div className="text-center mt-6 pt-4 border-t border-gray-100">
            <Link to="/login" className="text-sm text-moh-primary hover:underline">
              ← دخول كمسؤول
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerLogin;
