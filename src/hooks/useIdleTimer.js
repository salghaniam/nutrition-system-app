// ===================================================================
// 🆕 v19: useIdleTimer Hook - مراقبة خمول المستخدم
// ===================================================================
import { useEffect, useRef, useState, useCallback } from 'react';

const IDLE_TIMEOUT = 60 * 60 * 1000;     // 1 ساعة (60 دقيقة)
const WARNING_BEFORE = 2 * 60 * 1000;    // تحذير قبل 2 دقيقة
const CHECK_INTERVAL = 5 * 1000;         // فحص كل 5 ثوانٍ

const ACTIVITY_EVENTS = [
  'mousemove',
  'keydown',
  'click',
  'scroll',
  'touchstart',
  'touchmove',
];

/**
 * Hook لمراقبة خمول المستخدم وإطلاق إجراءات
 * 
 * @param {Function} onTimeout - يُستدعى عند انتهاء المدة (logout)
 * @param {Function} onWarning - يُستدعى عند بداية فترة التحذير
 * @param {Function} onActivity - يُستدعى عند عودة النشاط (إغلاق التحذير)
 * @returns {Object} { resetTimer, secondsLeft, isWarning }
 */
export const useIdleTimer = ({ onTimeout, onWarning, onActivity, enabled = true }) => {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isWarning, setIsWarning] = useState(false);
  
  const lastActivityRef = useRef(Date.now());
  const warningTriggeredRef = useRef(false);
  const intervalRef = useRef(null);

  // تحديث وقت آخر نشاط
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // 🆕 v19: نخزّن في sessionStorage (يُحذف عند إغلاق المتصفح)
    try {
      sessionStorage.setItem('lastActivity', Date.now().toString());
    } catch (e) { /* ignore */ }
    
    // إن كان في حالة تحذير وعاد المستخدم، نُلغي التحذير
    if (warningTriggeredRef.current) {
      warningTriggeredRef.current = false;
      setIsWarning(false);
      if (onActivity) onActivity();
    }
  }, [onActivity]);

  // إعادة ضبط المؤقت يدوياً (مثلاً من زر "تمديد الجلسة")
  const resetTimer = useCallback(() => {
    updateActivity();
    warningTriggeredRef.current = false;
    setIsWarning(false);
  }, [updateActivity]);

  useEffect(() => {
    if (!enabled) return;

    // قراءة آخر نشاط من sessionStorage عند التحميل
    try {
      const stored = sessionStorage.getItem('lastActivity');
      if (stored) {
        lastActivityRef.current = parseInt(stored);
      } else {
        updateActivity();
      }
    } catch (e) {
      updateActivity();
    }

    // إضافة مستمعات للنشاط
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // فحص دوري
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const idle = now - lastActivityRef.current;
      const remaining = IDLE_TIMEOUT - idle;

      if (remaining <= 0) {
        // انتهت المدة → logout
        if (onTimeout) onTimeout();
        clearInterval(intervalRef.current);
      } else if (remaining <= WARNING_BEFORE && !warningTriggeredRef.current) {
        // دخلت فترة التحذير
        warningTriggeredRef.current = true;
        setIsWarning(true);
        if (onWarning) onWarning();
      }

      // تحديث secondsLeft (للعرض في Modal)
      if (warningTriggeredRef.current) {
        setSecondsLeft(Math.ceil(remaining / 1000));
      }
    }, CHECK_INTERVAL);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, onTimeout, onWarning, updateActivity]);

  return { resetTimer, secondsLeft, isWarning };
};

// تصدير الثوابت لاستخدامها في Modal
export const IDLE_CONFIG = {
  TIMEOUT_MINUTES: IDLE_TIMEOUT / 60000,
  WARNING_MINUTES: WARNING_BEFORE / 60000,
};
