import { useEffect, useState } from 'react';
import StatCard from './StatCard';
import InscripcionesPorEstado from './Charts/InscripcionesPorEstado';
import AsistenciasPorDia from './Charts/AsistenciasPorDia';
import { pagoService, asistenciaService, fechaCalendarioService } from '../../api/services/inscripcionService';
import { formatMoney } from '../../utils/formatters';

const API_BASE = import.meta.env.PROD
    ? '/api'
    : '/maux-backend_catequesis/api';

export default function Dashboard() {
    const [stats, setStats] = useState({ inscritos: 0, recaudado: 0, pendiente: 0 });
    const [estadoData, setEstadoData] = useState([]);
    const [asistenciaData, setAsistenciaData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [participantesRes, pagosRes, asistenciaRes, fechasRes] = await Promise.all([
                    fetch(`${API_BASE}/inscripciones/participantes-pendientes`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({}),
                    }).then(r => r.json()),
                    pagoService.listarAdmin(0, 2000),
                    asistenciaService.listarAdmin(0, 2000),
                    fechaCalendarioService.listar(),
                ]);

                const participantes = participantesRes || [];
                const totalInscritos = participantes.length;
                const totalRecaudado = (pagosRes?.data || []).reduce((sum, p) => sum + (p.monto || 0), 0);
                const totalPendiente = participantes.reduce((sum, p) => sum + (p.pendiente || 0), 0);

                setStats({ inscritos: totalInscritos, recaudado: totalRecaudado, pendiente: totalPendiente });

                const porEstado = {};
                participantes.forEach(p => {
                    const est = p.cestadoinscripcion;
                    porEstado[est] = (porEstado[est] || 0) + 1;
                });
                const ESTADOS = { 1: 'Inscrito', 2: 'Pagado', 3: 'Devuelto', 4: 'Parcial' };
                const pieData = Object.entries(porEstado).map(([k, v]) => ({
                    name: ESTADOS[k] || 'Desconocido',
                    value: v,
                }));
                setEstadoData(pieData.length > 0 ? pieData : [{ name: 'Sin datos', value: 1 }]);

                const asistencias = asistenciaRes?.data || [];
                const fechas = fechasRes?.data || [];
                const barData = fechas.map(f => ({
                    name: f.fecha || `Día ${f.id}`,
                    asistencias: asistencias.filter(a => a.cfechaasistencia === f.id).length,
                }));
                setAsistenciaData(barData);

            } catch (err) {
                console.error('Error loading dashboard:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <StatCard
                    title="Oratorianos Inscritos"
                    value={stats.inscritos}
                    icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    color="blue"
                    subtitle="Total de participantes registrados"
                />
                <StatCard
                    title="Total Recaudado"
                    value={formatMoney(stats.recaudado)}
                    icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    color="green"
                    subtitle="Suma de todos los pagos registrados"
                />
                <StatCard
                    title="Pendiente de Recaudar"
                    value={formatMoney(Math.max(0, stats.pendiente))}
                    icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    color="yellow"
                    subtitle="Suma del pendiente de cada niño"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Estados de Inscripción</h3>
                    <InscripcionesPorEstado data={estadoData} />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Asistencias por Día</h3>
                    <AsistenciasPorDia data={asistenciaData} />
                </div>
            </div>
        </div>
    );
}
