import { useState, useCallback } from 'react';
import { useNotificationSound } from './useNotificationSound';

export interface MobileNotification {
  id: string;
  title: string;
  message: string;
  variant?: "default" | "success" | "warning" | "error";
  duration?: number;
}

export const useMobileNotifications = () => {
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const { playNotificationSound } = useNotificationSound();

  const showNotification = useCallback((
    title: string,
    message: string,
    variant: "default" | "success" | "warning" | "error" = "default",
    duration: number = 5000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    // Play sound
    playNotificationSound();
    
    // Show native notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/logo.png',
        badge: '/logo.png',
      });
    }
    
    // Show in-app notification
    const notification: MobileNotification = {
      id,
      title,
      message,
      variant,
      duration,
    };
    
    setNotifications(prev => [...prev, notification]);
    
    return id;
  }, [playNotificationSound]);

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  return {
    notifications,
    showNotification,
    hideNotification,
    requestPermission,
  };
};
