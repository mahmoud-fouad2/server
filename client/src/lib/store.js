import { create } from 'zustand';

export const useAppStore = create((set) => ({
  // User State
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),

  // UI State
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  // Notifications
  notifications: [],
  addNotification: (notification) => set((state) => ({ 
    notifications: [notification, ...state.notifications] 
  })),
  clearNotifications: () => set({ notifications: [] }),
}));
