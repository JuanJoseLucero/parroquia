import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import useAppStore from '../../store/appStore';

export default function MainLayout() {
    const { sidebarOpen, toggleSidebar } = useAppStore();

    return (
        <div className="min-h-screen flex">
            <Sidebar />
            <div className={`flex-1 transition-all duration-200 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
                <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
                    <div className="flex items-center justify-between px-6 py-3">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                            title="Toggle sidebar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">Iglesia María Auxiliadora</span>
                        </div>
                    </div>
                </header>
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
