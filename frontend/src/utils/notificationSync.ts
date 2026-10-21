/**
 * Scrizians Notification & Real-Time Sync Engine
 * Handles WebSocket connection simulation, broadcast storage events, unread count tracking, and persistent state.
 */

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'lead' | 'talent' | 'job' | 'system' | 'info';
  timestamp: string;
  read: boolean;
  link?: string;
}

export const initialNotificationsList: NotificationItem[] = [
  {
    id: 'notif-101',
    title: '⚡ New Inbound Lead Received',
    message: 'Michael R. (CloudScale Inc) submitted requirement for 2 Senior Next.js Architects.',
    type: 'lead',
    timestamp: '2 mins ago',
    read: false,
    link: '/dashboard/admin'
  },
  {
    id: 'notif-102',
    title: '👤 Scrizian Profile Verified',
    message: 'SCR-8841 (Aarav M. - Lead Full-Stack Architect) passed technical evaluation.',
    type: 'talent',
    timestamp: '1 hour ago',
    read: false,
    link: '/talent'
  },
  {
    id: 'notif-103',
    title: '💼 New Job Opening Active',
    message: 'Senior DevOps & Kubernetes Engineer opening was posted by Fintech Systems.',
    type: 'job',
    timestamp: '3 hours ago',
    read: true,
    link: '/jobs'
  },
  {
    id: 'notif-104',
    title: 'ℹ️ Real-Time Sync Connected',
    message: 'Scrizians WebSocket broadcasting channel active and listening for live events.',
    type: 'system',
    timestamp: 'Today',
    read: true
  }
];

export const getStoredNotifications = (): NotificationItem[] => {
  if (typeof window === 'undefined') return initialNotificationsList;
  try {
    const data = localStorage.getItem('scrizians_notifications');
    if (!data) {
      localStorage.setItem('scrizians_notifications', JSON.stringify(initialNotificationsList));
      return initialNotificationsList;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : initialNotificationsList;
  } catch (e) {
    return initialNotificationsList;
  }
};

export const saveStoredNotifications = (list: NotificationItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('scrizians_notifications', JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('scrizians_new_notification', { detail: list }));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Failed to save notifications:', e);
  }
};

export const addNotification = (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
  if (typeof window === 'undefined') return;
  const current = getStoredNotifications();
  const newNotif: NotificationItem = {
    ...item,
    id: `notif-${Date.now()}`,
    timestamp: 'Just now',
    read: false
  };
  const updated = [newNotif, ...current];
  saveStoredNotifications(updated);
  return newNotif;
};

export const markAllNotificationsRead = () => {
  const current = getStoredNotifications();
  const updated = current.map(n => ({ ...n, read: true }));
  saveStoredNotifications(updated);
  return updated;
};

export const markNotificationRead = (id: string) => {
  const current = getStoredNotifications();
  const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
  saveStoredNotifications(updated);
  return updated;
};

export const clearAllNotifications = () => {
  saveStoredNotifications([]);
  return [];
};
