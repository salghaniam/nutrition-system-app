import { useState } from 'react';
import {  useNavigate, Navigate, Link } from 'react-router-dom';
import { Lock, User, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, user } = useAuth();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(credentials.username, credentials.password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'فشل تسجيل الدخول');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-moh-primary via-moh-primary-dark to-moh-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* الشعار */}
        <div className="text-center mb-8">
          <div className="inline-flex w-20 h-20 bg-white rounded-2xl items-center justify-center text-moh-primary text-3xl font-bold shadow-soft-lg mb-4">
            ص
          </div>
          <h1 className="text-white text-2xl font-bold mb-1">وزارة الصحة السعودية</h1>
          <p className="text-white/80 text-sm">نظام إدارة العاملين بأقسام التغذية</p>
        </div>

        {/* نموذج الدخول */}
        <div className="bg-white rounded-2xl shadow-soft-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">تسجيل الدخول</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">اسم المستخدم</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="input pr-10"
                  placeholder="أدخل اسم المستخدم"
                />
              </div>
            </div>

            <div>
              <label className="label">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="input pr-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'تسجيل الدخول'}
            </button>
          </form>
        <div className="text-center mt-4 pt-4 border-t border-gray-100">
          <Link to="/worker-login" className="text-sm text-moh-primary hover:underline font-medium">
            🆔 دخول كعامل
          </Link>
        </div>

          </div>

        <p className="text-center text-white/70 text-xs mt-6">
          © {new Date().getFullYear()} وزارة الصحة السعودية - جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
};

export default Login;
