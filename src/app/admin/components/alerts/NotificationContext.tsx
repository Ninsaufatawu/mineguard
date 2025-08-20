"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications, NotificationData } from './useNotifications';

interface NotificationContextType {
  notifications: NotificationData;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: () => void;
  markAlertsAsVisited: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const notificationData = useNotifications();

  return (
    <NotificationContext.Provider value={notificationData}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};
