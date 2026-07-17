import { create } from 'zustand';

const useAppStore = create((set) => ({
    sidebarOpen: true,
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    dashboardData: null,
    setDashboardData: (data) => set({ dashboardData: data }),
}));

export default useAppStore;
