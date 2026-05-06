// ===================================================================
// 🆕 v24: Push Notifications Service
// إدارة FCM tokens والإشعارات على الجهاز
// ===================================================================
import api from './api';

let isInitialized = false;
let currentToken = null;

/**
 * تهيئة Push Notifications (يُستدعى عند تسجيل الدخول)
 * - يطلب الصلاحيات
 * - يحصل على FCM token
 * - يسجّله في الخادم
 */
export const initializePushNotifications = async () => {
  if (isInitialized) return currentToken;
  
  try {
    // فحص: هل نحن في تطبيق Capacitor؟
    const isNative = window.Capacitor?.isNativePlatform?.();
    
    if (isNative) {
      return await initializeNativePush();
    } else {
      // Web - placeholder للمستقبل
      console.log('ℹ️ Web Push not yet implemented');
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to initialize push:', error);
    return null;
  }
};

/**
 * تهيئة Push للتطبيق Native (Android/iOS)
 */
const initializeNativePush = async () => {
  try {
    // استيراد الـ plugin (يعمل فقط في التطبيق)
    const { PushNotifications } = await import('@capacitor/push-notifications');
    
    // 1. طلب الصلاحيات
    const permResult = await PushNotifications.requestPermissions();
    
    if (permResult.receive !== 'granted') {
      console.log('⚠️ Push permission denied');
      return null;
    }
    
    // 2. تسجيل
    await PushNotifications.register();
    
    // 3. الاستماع للـ token
    return new Promise((resolve) => {
      // عند الحصول على token
      PushNotifications.addListener('registration', async (token) => {
        console.log('✅ FCM Token received');
        currentToken = token.value;
        
        // إرسال للخادم
        try {
          await api.post('/notifications/register-token', {
            token: token.value,
            deviceType: 'android',
            deviceInfo: {
              platform: 'android',
              userAgent: navigator.userAgent,
            },
          });
          console.log('✅ FCM Token registered with backend');
          isInitialized = true;
          resolve(token.value);
        } catch (e) {
          console.error('❌ Failed to register token:', e.message);
          resolve(null);
        }
      });
      
      // عند فشل التسجيل
      PushNotifications.addListener('registrationError', (error) => {
        console.error('❌ Push registration error:', error);
        resolve(null);
      });
      
      // عند استلام إشعار والتطبيق مفتوح
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('📱 Push received (foreground):', notification);
        // التطبيق سيتعامل معه عبر event
        window.dispatchEvent(new CustomEvent('push-notification', {
          detail: notification,
        }));
      });
      
      // عند الضغط على الإشعار
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('🔔 Push action:', action);
        // التوجيه حسب نوع الإشعار
        const data = action.notification?.data || {};
        if (data.screen) {
          window.dispatchEvent(new CustomEvent('push-navigation', {
            detail: data,
          }));
        }
      });
      
      // مهلة للتأكد
      setTimeout(() => {
        if (!currentToken) {
          console.log('⚠️ Token not received within 10s');
          resolve(null);
        }
      }, 10000);
    });
  } catch (error) {
    console.error('❌ Native push init error:', error);
    return null;
  }
};

/**
 * إلغاء تسجيل token (عند تسجيل خروج)
 */
export const unregisterPushNotifications = async () => {
  if (!currentToken) return;
  
  try {
    await api.post('/notifications/unregister-token', {
      token: currentToken,
    });
    currentToken = null;
    isInitialized = false;
    console.log('✅ Token unregistered');
  } catch (e) {
    console.error('❌ Unregister error:', e.message);
  }
};

/**
 * الحصول على Token الحالي
 */
export const getCurrentToken = () => currentToken;

/**
 * تحقق إذا تم التهيئة
 */
export const isPushInitialized = () => isInitialized;
