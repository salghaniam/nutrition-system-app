// ===================================================================
// 🆕 v24: useNotifications Hook
// إدارة حالة الإشعارات (عدد غير المقروء + تحديث دوري)
// ===================================================================
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useNotifications = (options = {}) => {
  const { 
    pollInterval = 30000, // 30 ثانية
    enabled = true,
  } = options;
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // جلب عدد غير المقروء
  const fetchUnreadCount = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data?.count || 0);
    } catch (e) {
      // silent fail
    }
  }, [enabled]);

  // جلب الإشعارات
  const fetchNotifications = useCallback(async (limit = 50, unreadOnly = false) => {
    if (!enabled) return;
    setLoading(true);
    try {
      const res = await api.get('/notifications', {
        params: { limit, unreadOnly }
      });
      setNotifications(res.data?.data || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (e) {
      console.error('Failed to fetch notifications:', e.message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // تعليم كمقروء
  const markAsRead = useCallback(async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  }, []);

  // تعليم الكل كمقروء
  const markAllAsRead = useCallback(async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, readAt: new Date() }))
      );
      setUnreadCount(0);
    } catch (e) {}
  }, []);

  // حذف إشعار
  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {}
  }, []);

  // Polling للتحديث الدوري
  useEffect(() => {
    if (!enabled) return;
    
    fetchUnreadCount();
    
    const interval = setInterval(fetchUnreadCount, pollInterval);
    return () => clearInterval(interval);
  }, [enabled, pollInterval, fetchUnreadCount]);

  // الاستماع لإشعارات جديدة
  useEffect(() => {
    const handler = () => {
      fetchUnreadCount();
    };
    window.addEventListener('push-notification', handler);
    return () => window.removeEventListener('push-notification', handler);
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchUnreadCount,
  };
};
