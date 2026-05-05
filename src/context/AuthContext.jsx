import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';


// 🆕 v19: Storage helpers
// نستخدم sessionStorage للـ token (يُمسح عند إغلاق المتصفح)
// نستخدم localStorage للـ user info فقط (للسرعة، يُمسح عند logout)
const tokenStorage = {
  get: () => sessionStorage.getItem('token'),
  set: (v) => sessionStorage.setItem('token', v),
  remove: () => sessionStorage.removeItem('token'),
};

const userStorage = {
  get: () => localStorage.getItem('user'),
  set: (v) => localStorage.setItem('user', v),
  remove: () => localStorage.removeItem('user'),
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = tokenStorage.get();
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      // التحقق من صلاحية التوكن
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data.data);
          localStorage.setItem('user', JSON.stringify(res.data.data));
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      const { user, token } = res.data.data;
      tokenStorage.set(token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      toast.success('تم تسجيل الدخول بنجاح');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  };

  const logout = () => {
    tokenStorage.remove();
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  // التحقق من الدور
  const hasRole = (...roles) => user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// أسماء الأدوار بالعربية
export const ROLE_NAMES = {
  system_admin: 'مدير النظام',
  system_supervisor: 'مشرف نظام',
  hospital_head: 'رئيس قسم تغذية',
  labor_supervisor: 'مشرف عمالة',
  devices_supervisor: 'مشرف أجهزة',
  site_manager: 'مدير موقع',
};
