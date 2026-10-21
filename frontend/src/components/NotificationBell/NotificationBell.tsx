'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  NotificationItem, 
  initialNotificationsList, 
  getStoredNotifications, 
  markAllNotificationsRead, 
  markNotificationRead, 
  clearAllNotifications 
} from '@/utils/notificationSync';
import { notificationApi } from '@/lib/expressApi';
import styles from './NotificationBell.module.css';

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotificationsList);
  const [isOpen, setIsOpen] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Sync from localStorage after hydration
    setNotifications(getStoredNotifications());

    // 1b. Load real notifications from the Express backend (requires login)
    if (localStorage.getItem('scrizians_token')) {
      notificationApi.getAll().then(res => {
        if (res.success && Array.isArray(res.data)) {
          const mapped: NotificationItem[] = res.data.map((n: any) => ({
            id: n._id,
            title: n.title,
            message: n.message,
            type: (['lead', 'talent', 'job', 'system', 'info'].includes(n.type) ? n.type : 'info') as NotificationItem['type'],
            timestamp: n.createdAt,
            read: !!n.read,
          }));
          setNotifications(mapped);
        }
      });
    }

    // 2. Custom window event listener for instant real-time sync across components
    const handleNewNotif = (e: any) => {
      if (e.detail) {
        setNotifications(e.detail);
      } else {
        setNotifications(getStoredNotifications());
      }
    };

    window.addEventListener('scrizians_new_notification', handleNewNotif);
    window.addEventListener('storage', handleNewNotif);

    // 3. Real-time broadcast channel active status
    setIsWsConnected(true);

    // Close dropdown on outside click
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      window.removeEventListener('scrizians_new_notification', handleNewNotif);
      window.removeEventListener('storage', handleNewNotif);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = markAllNotificationsRead();
    setNotifications(updated);
    if (localStorage.getItem('scrizians_token')) notificationApi.markAllRead();
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = clearAllNotifications();
    setNotifications(updated);
  };

  const handleItemClick = (id: string) => {
    const updated = markNotificationRead(id);
    setNotifications(updated);
    if (localStorage.getItem('scrizians_token') && /^[a-f0-9]{24}$/i.test(id)) notificationApi.markRead(id);
    setIsOpen(false);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'lead': return '⚡';
      case 'talent': return '👤';
      case 'job': return '💼';
      case 'system': return 'ℹ️';
      default: return '🔔';
    }
  };

  return (
    <div className={styles.bellWrapper} ref={dropdownRef}>
      <button 
        className={styles.bellBtn} 
        onClick={() => setIsOpen(!isOpen)}
        title="Real-Time Notifications & WebSocket Live Feed"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <span>Notifications</span>
              {isWsConnected && (
                <span className={styles.wsLiveTag}>
                  <span className={styles.wsLiveDot}></span> WS Live
                </span>
              )}
            </div>
            <div className={styles.actionsHeader}>
              <button onClick={handleMarkAllRead} className={styles.btnAction} title="Mark all read">
                Read all
              </button>
              <button onClick={handleClearAll} className={styles.btnAction} title="Clear all">
                Clear
              </button>
            </div>
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <span>🔔 No notifications yet</span>
              </div>
            ) : (
              notifications.map((item) => {
                const ContentWrapper = item.link ? Link : 'div';
                const wrapperProps = item.link ? { href: item.link } : {};

                return (
                  //@ts-ignore
                  <ContentWrapper 
                    key={item.id} 
                    {...wrapperProps}
                    className={`${styles.item} ${!item.read ? styles.itemUnread : ''}`}
                    onClick={() => handleItemClick(item.id)}
                  >
                    <span className={styles.itemIcon}>{getIconForType(item.type)}</span>
                    <div className={styles.itemContent}>
                      <div className={styles.itemTitle}>
                        <span>{item.title}</span>
                        {!item.read && <span className={styles.unreadDot} />}
                      </div>
                      <div className={styles.itemMessage}>{item.message}</div>
                      <div className={styles.itemTime}>{item.timestamp}</div>
                    </div>
                  </ContentWrapper>
                );
              })
            )}
          </div>

          <div className={styles.footer}>
            ⚡ Scrizians Real-Time Event & WebSocket Sync Engine
          </div>
        </div>
      )}
    </div>
  );
};
