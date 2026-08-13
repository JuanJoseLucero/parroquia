import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { personaService, ninioService } from '../../api/services/personaService';
import { inscripcionCabeceraService, inscripcionDetalleService, pagoService, costoInscripcionService } from '../../api/services/inscripcionService';
import { formatMoney, formatDate, ESTADOS_INSCRIPCION } from '../../utils/formatters';

function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nac = new Date(`${fechaNacimiento}T12:00:00`);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const mes = hoy.getMonth() - nac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
}

export default function ListarParticipantes() {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [filteredRows, setFilteredRows] = useState([]);
    const [filterEstado, setFilterEstado] = useState('');
    const [filterEdad, setFilterEdad] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [costo, setCosto] = useState(15);
    const PAGE_SIZE = 20;
    const AGE_GROUPS = [
        { value: '7', label: '7 años', matches: (edad) => edad === 7 },
        { value: '8', label: '8 años', matches: (edad) => edad === 8 },
        { value: '9', label: '9 años', matches: (edad) => edad === 9 },
        { value: '10', label: '10 años', matches: (edad) => edad === 10 },
        { value: '11', label: '11 años', matches: (edad) => edad === 11 },
        { value: '12-13', label: '12-13 años', matches: (edad) => edad === 12 || edad === 13 },
        { value: '14-15', label: '14-15 años', matches: (edad) => edad === 14 || edad === 15 },
    ];


    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [detallesRes, cabecerasRes, niniosRes, personasRes, pagosRes, costosRes] = await Promise.all([
                inscripcionDetalleService.listarAdmin(0, 5000),
                inscripcionCabeceraService.listarAdmin(0, 5000),
                ninioService.listarAdmin(0, 5000),
                personaService.listarAdmin(0, 5000),
                pagoService.listarAdmin(0, 5000),
                costoInscripcionService.listar(),
            ]);

            setCosto((costosRes?.data?.[0]?.monto) || 15);

            const personList = personasRes?.data || [];
            const ninios = niniosRes?.data || [];
            const detalles = detallesRes?.data || [];
            const cabeceras = cabecerasRes?.data || [];
            const pagos = pagosRes?.data || [];

            const buildRow = (d) => {
                const ninio = ninios.find(n => n.id === d.tninio);
                if (!ninio) return null;
                const persona = personList.find(p => p.id === ninio.cpersona);
                if (!persona) return null;
                const cabecera = cabeceras.find(c => c.id === d.cinscripcionCabecera);
                const totalPagado = pagos.filter(p => p.cinscripcionDetalle === d.id).reduce((s, p) => s + (p.monto || 0), 0);
                const edad = persona.fechaNacimiento
                    ? calcularEdad(persona.fechaNacimiento)
                    : (persona.aniosCumplidos ?? null);

                return {
                    id: d.id,
                    cedula: persona.cedula,
                    nombre: `${persona.nombres} ${persona.apellidos}`,
                    fechaNacimiento: persona.fechaNacimiento || null,
                    edad,
                    estadoId: d.cestadoinscripcion,
                    estado: ESTADOS_INSCRIPCION[d.cestadoinscripcion] || 'Desconocido',
                    totalPagado,
                    pendiente: Math.max(0, ((costosRes?.data?.[0]?.monto) || 15) - totalPagado),
                    cabeceraId: cabecera?.id,
                    notas: cabecera?.notas || '',
                };
            };

            let rows = detalles.map(buildRow).filter(Boolean);

            if (filterEstado) rows = rows.filter(r => r.estadoId === parseInt(filterEstado));
            if (filterEdad) {
                const selectedGroup = AGE_GROUPS.find(group => group.value === filterEdad);
                if (selectedGroup) rows = rows.filter(r => selectedGroup.matches(r.edad));
            }
            if (search) {
                const s = search.toLowerCase();
                rows = rows.filter(r => r.nombre.toLowerCase().includes(s) || String(r.cedula).includes(s));
            }

            setTotal(rows.length);
            setFilteredRows(rows);
            setData(rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, filterEstado, filterEdad, search]);

    useEffect(() => { load(); }, [load]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const exportExcel = () => {
        const headers = ['Cédula', 'Nombre', 'Fecha Nacimiento', 'Edad', 'Observaciones'];
        const mapRows = (rows) => rows.map(r => [
            r.cedula,
            r.nombre,
            formatDate(r.fechaNacimiento),
            r.edad ?? '',
            r.notas || '',
        ]);

        const wb = XLSX.utils.book_new();
        const wsGeneral = XLSX.utils.aoa_to_sheet([headers, ...mapRows(filteredRows)]);
        XLSX.utils.book_append_sheet(wb, wsGeneral, 'Participantes');

        AGE_GROUPS.forEach(({ value, matches }) => {
            const rowsEdad = filteredRows.filter(r => matches(r.edad));
            if (rowsEdad.length === 0) return;
            const wsEdad = XLSX.utils.aoa_to_sheet([headers, ...mapRows(rowsEdad)]);
            XLSX.utils.book_append_sheet(wb, wsEdad, value);
        });

        XLSX.writeFile(wb, 'participantes-por-edad.xlsx');
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Listar Participantes</h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
                        <input type="text" placeholder="Nombre o cédula" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                        <select value={filterEstado} onChange={e => { setFilterEstado(e.target.value); setPage(0); }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="">Todos</option>
                            {Object.entries(ESTADOS_INSCRIPCION).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Edad</label>
                        <select
                            value={filterEdad}
                            onChange={e => { setFilterEdad(e.target.value); setPage(0); }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Todas</option>
                            {AGE_GROUPS.map(group => (
                                <option key={group.value} value={group.value}>{group.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="ml-auto">
                        <button
                            onClick={exportExcel}
                            className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Exportar Excel
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="text-left py-3 px-4">Cédula</th>
                                <th className="text-left py-3 px-4">Nombres</th>
                                <th className="text-left py-3 px-4">Edad</th>
                                <th className="text-left py-3 px-4">Estado</th>
                                <th className="text-right py-3 px-4">Pagado</th>
                                <th className="text-right py-3 px-4">Pendiente</th>
                                <th className="text-left py-3 px-4">Observaciones</th>
                                <th className="text-left py-3 px-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-8 text-gray-400">Cargando...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-8 text-gray-400">Sin resultados</td></tr>
                            ) : data.map(r => (
                                <tr key={r.id} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 font-mono">{r.cedula}</td>
                                    <td className="py-3 px-4 font-medium">{r.nombre}</td>
                                    <td className="py-3 px-4">{r.edad ?? '-'}</td>
                                    <td className="py-3 px-4">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                            r.estadoId === 2 ? 'bg-green-100 text-green-700' :
                                            r.estadoId === 4 ? 'bg-yellow-100 text-yellow-700' :
                                            r.estadoId === 3 ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>{r.estado}</span>
                                    </td>
                                    <td className="py-3 px-4 text-right">{formatMoney(r.totalPagado)}</td>
                                    <td className="py-3 px-4 text-right font-medium text-red-600">{formatMoney(r.pendiente)}</td>
                                    <td className="py-3 px-4 max-w-[200px]">
                                        {r.notas ? (
                                            <span title={r.notas} className="block truncate text-gray-600">{r.notas}</span>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        {r.cabeceraId && (
                                            <button onClick={() => navigate(`/inscripciones/editar/${r.cabeceraId}`)}
                                                className="px-3 py-1 text-xs text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
                                                Editar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                        <span className="text-xs text-gray-500">{total} resultados</span>
                        <div className="flex gap-1">
                            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                                className="px-3 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-30">←</button>
                            <span className="px-3 py-1 text-xs">{page + 1} / {totalPages}</span>
                            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                                className="px-3 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-30">→</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
