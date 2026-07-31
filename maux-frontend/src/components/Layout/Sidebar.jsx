import { NavLink } from 'react-router-dom';
import useAppStore from '../../store/appStore';

const menuItems = [
    { path: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', separator: false },
    { type: 'separator' },
    { path: '/inscripciones/nueva', label: 'Inscripción Catequesis', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', separator: false },
    { path: '/inscripciones/pago', label: 'Realizar Pago', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', separator: true },
    { type: 'separator' },
    { path: '/participantes', label: 'Listar Participantes', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', separator: false },
    { path: '/guias', label: 'Listar Colaboradores', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', separator: true },
    { type: 'separator' },
    { path: '/reportes', label: 'Generar Reportes', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', separator: false },
];

export default function Sidebar() {
    const { sidebarOpen } = useAppStore();

    if (!sidebarOpen) return null;

    return (
        <aside className="sidebar w-64 bg-gray-900 text-white h-screen fixed left-0 top-0 z-40 overflow-y-auto flex flex-col">
            <div className="p-5 border-b border-gray-700">
                <h1 className="text-lg font-bold tracking-tight text-blue-400">
                    María Auxiliadora
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">Servicios Parroquiales</p>
            </div>
            <nav className="flex-1 py-3">
                {menuItems.filter(i => !i.type).map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                                isActive
                                    ? 'bg-blue-600 text-white font-semibold'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }`
                        }
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                        </svg>
                        {item.label}
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-700 text-xs text-gray-500 text-center">
                v1.0.0
            </div>
        </aside>
    );
}
