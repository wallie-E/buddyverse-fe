import { createContext } from 'react';

export interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  fetchUnreadCount: () => Promise<void>;
  decrementUnreadCount: () => void;
  clearUnreadCount: () => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined); 