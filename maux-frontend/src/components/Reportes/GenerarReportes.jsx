import { useState, useEffect } from 'react';
import { personaService, ninioService, grupoService } from '../../api/services/personaService';
import { inscripcionCabeceraService, inscripcionDetalleService, pagoService, costoInscripcionService, asistenciaService, fechaCalendarioService } from '../../api/services/inscripcionService';
import { formatMoney, ESTADOS_INSCRIPCION } from '../../utils/formatters';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function GenerarReportes() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filtro, setFiltro] = useState({ grupo: '', estado: '' });

    const load = async () => {
        setLoading(true);
        try {
            const [detallesRes, cabecerasRes, niniosRes, personasRes, gruposRes, pagosRes, costosRes, asistenciaRes, fechasRes] = await Promise.all([
                inscripcionDetalleService.listarAdmin(0, 5000),
                inscripcionCabeceraService.listarAdmin(0, 5000),
                ninioService.listarAdmin(0, 5000),
                personaService.listarAdmin(0, 5000),
                grupoService.listar(),
                pagoService.listarAdmin(0, 5000),
                costoInscripcionService.listar(),
                asistenciaService.listarAdmin(0, 5000),
                fechaCalendarioService.listar(),
            ]);

            const grupos = gruposRes?.data || [];
            const personas = personasRes?.data || [];
            const ninios = niniosRes?.data || [];
            const detalles = detallesRes?.data || [];
            const cabeceras = cabecerasRes?.data || [];
            const pagos = pagosRes?.data || [];
            const costo = (costosRes?.data?.[0]?.monto) || 15;
            const asistencias = asistenciaRes?.data || [];
            const fechas = fechasRes?.data || [];

            const participantes = detalles.map(d => {
                const ninio = ninios.find(n => n.id === d.tninio);
                const persona = ninio ? personas.find(p => p.id === ninio.cpersona) : null;
                const cabecera = cabeceras.find(c => c.id === d.cinscripcionCabecera);
                const totalPagado = pagos.filter(p => p.cinscripcionDetalle === d.id).reduce((s, p) => s + (p.monto || 0), 0);
                return {
                    nombre: persona ? `${persona.nombres} ${persona.apellidos}` : '',
                    cedula: persona?.cedula || '',
                    grupo: ninio ? (grupos.find(g => g.id === ninio.cgrupo)?.nombreGrupo || '') : '',
                    estado: ESTADOS_INSCRIPCION[d.cestadoinscripcion] || '',
                    estadoId: d.cestadoinscripcion,
                    totalPagado,
                    pendiente: Math.max(0, costo - totalPagado),
                    grupoId: ninio?.cgrupo,
                };
            });

            const totalRecaudado = pagos.reduce((s, p) => s + (p.monto || 0), 0);
            const totalCosto = participantes.length * costo;
            const resumen = { totalParticipantes: participantes.length, totalRecaudado, totalPendiente: totalCosto - totalRecaudado, costo };

            setData({ participantes, grupos, resumen, asistencias, fechas });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = () => {
        if (!data) return [];
        let rows = data.participantes;
        if (filtro.grupo) rows = rows.filter(r => r.grupoId === parseInt(filtro.grupo));
        if (filtro.estado) rows = rows.filter(r => r.estadoId === parseInt(filtro.estado));
        return rows;
    };

    const exportPDF = () => {
        const rows = filtered();
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text('Reporte de Inscripciones - María Auxiliadora', 14, 20);
        doc.setFontSize(10);
        doc.text(`Total participantes: ${rows.length} | Recaudado: ${formatMoney(data?.resumen?.totalRecaudado)} | Pendiente: ${formatMoney(data?.resumen?.totalPendiente)}`, 14, 28);
        doc.autoTable({
            startY: 34,
            head: [['Cédula', 'Nombre', 'Grupo', 'Estado', 'Pagado', 'Pendiente']],
            body: rows.map(r => [String(r.cedula), r.nombre, r.grupo, r.estado, formatMoney(r.totalPagado), formatMoney(r.pendiente)]),
        });
        doc.save('reporte-inscripciones.pdf');
    };

    const exportExcel = () => {
        const rows = filtered();
        const wsData = [['Cédula', 'Nombre', 'Grupo', 'Estado', 'Pagado', 'Pendiente'], ...rows.map(r => [r.cedula, r.nombre, r.grupo, r.estado, r.totalPagado, r.pendiente])];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Participantes');
        XLSX.writeFile(wb, 'reporte-inscripciones.xlsx');
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Generar Reportes</h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Grupo</label>
                        <select value={filtro.grupo} onChange={e => setFiltro({ ...filtro, grupo: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="">Todos</option>
                            {(data?.grupos || []).map(g => <option key={g.id} value={g.id}>{g.nombreGrupo}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                        <select value={filtro.estado} onChange={e => setFiltro({ ...filtro, estado: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="">Todos</option>
                            {Object.entries(ESTADOS_INSCRIPCION).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2 ml-auto">
                        <button onClick={exportPDF} className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                            Exportar PDF
                        </button>
                        <button onClick={exportExcel} className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                            Exportar Excel
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400">Cargando datos...</div>
            ) : data ? (
                <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                            <p className="text-xs text-blue-600 font-medium">Total Participantes</p>
                            <p className="text-2xl font-bold text-blue-700">{filtered().length}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                            <p className="text-xs text-green-600 font-medium">Total Recaudado</p>
                            <p className="text-2xl font-bold text-green-700">{formatMoney(data.resumen.totalRecaudado)}</p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-4 text-center">
                            <p className="text-xs text-yellow-600 font-medium">Pendiente</p>
                            <p className="text-2xl font-bold text-yellow-700">{formatMoney(data.resumen.totalPendiente)}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="text-left py-3 px-4">Cédula</th>
                                        <th className="text-left py-3 px-4">Nombre</th>
                                        <th className="text-left py-3 px-4">Grupo</th>
                                        <th className="text-left py-3 px-4">Estado</th>
                                        <th className="text-right py-3 px-4">Pagado</th>
                                        <th className="text-right py-3 px-4">Pendiente</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered().map((r, i) => (
                                        <tr key={i} className="border-b hover:bg-gray-50">
                                            <td className="py-2 px-4 font-mono">{r.cedula}</td>
                                            <td className="py-2 px-4">{r.nombre}</td>
                                            <td className="py-2 px-4">{r.grupo}</td>
                                            <td className="py-2 px-4">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                    r.estadoId === 2 ? 'bg-green-100 text-green-700' :
                                                    r.estadoId === 4 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>{r.estado}</span>
                                            </td>
                                            <td className="py-2 px-4 text-right">{formatMoney(r.totalPagado)}</td>
                                            <td className="py-2 px-4 text-right text-red-600 font-medium">{formatMoney(r.pendiente)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}
