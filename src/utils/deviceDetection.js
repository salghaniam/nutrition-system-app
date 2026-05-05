// ===================================================================
// 🆕 v22: Mobile Detection
// كشف ما إذا كنا نعرض على جوال (تطبيق أو متصفح)
// ===================================================================

/**
 * يكتشف ما إذا كان المستخدم على جهاز جوال
 * - True إذا: تطبيق Capacitor، أو شاشة < 768px، أو user agent يدل على جوال
 */
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  
  // 1. تطبيق Capacitor؟
  if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
    return true;
  }
  
  // 2. شاشة صغيرة؟
  if (window.innerWidth < 768) {
    return true;
  }
  
  // 3. User agent للجوال؟
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || '';
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      return true;
    }
  }
  
  return false;
};

/**
 * يكتشف ما إذا كنا في تطبيق Capacitor
 */
export const isNativeApp = () => {
  if (typeof window === 'undefined') return false;
  return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
};

/**
 * Hook يُرجع isMobile مع تحديث تلقائي عند تغيير حجم الشاشة
 */
import { useState, useEffect } from 'react';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(isMobileDevice);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return isMobile;
};

/**
 * يفحص User Preference إن وُجد (من زر تبديل في الإعدادات)
 */
export const getUserPreference = () => {
  try {
    const pref = localStorage.getItem('uiMode');
    return pref; // 'mobile', 'desktop', أو null
  } catch (e) {
    return null;
  }
};

/**
 * تحديد UI mode النهائي (مع احترام تفضيل المستخدم)
 */
export const shouldUseMobileUI = () => {
  // 1. تفضيل المستخدم له الأولوية
  const pref = getUserPreference();
  if (pref === 'mobile') return true;
  if (pref === 'desktop') return false;
  
  // 2. وإلا، نكتشف تلقائياً
  return isMobileDevice();
};
