import { useState, useEffect, useCallback } from 'react';
import { personaService, guiaService, grupoService, grupoGuiaService } from '../../api/services/personaService';

export default function ListarGuias() {
    const [data, setData] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [asignaciones, setAsignaciones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalGuia, setModalGuia] = useState(null);
    const [modalForm, setModalForm] = useState({ cgrupo: '', rol: 'Titular' });
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [guiasRes, personasRes, gruposRes, asignRes] = await Promise.all([
                guiaService.listarAdmin(0, 100),
                personaService.listarAdmin(0, 5000),
                grupoService.listar(),
                grupoGuiaService.listar(),
            ]);

            setGrupos(gruposRes?.data || []);
            const asigs = asignRes?.data || [];
            setAsignaciones(asigs);

            const guiasData = (guiasRes?.data || []).map(g => {
                const persona = (personasRes?.data || []).find(p => p.id === g.cpersona);
                const guiaAsigs = asigs.filter(a => a.cguia === g.id);
                const gruposNombres = guiaAsigs.map(a => {
                    const grupo = (gruposRes?.data || []).find(gr => gr.id === a.cgrupo);
                    return { id: a.id, grupo: grupo?.nombreGrupo || '', rol: a.rol };
                });
                return { ...g, persona, gruposAsignados: gruposNombres };
            });
            setData(guiasData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openAsignar = (guia) => {
        setModalGuia(guia);
        setModalForm({ cgrupo: '', rol: 'Titular' });
        setError(null);
        setShowModal(true);
    };

    const handleAsignar = async () => {
        if (!modalForm.cgrupo) { setError('Seleccione un grupo'); return; }
        try {
            await grupoGuiaService.crear({ cgrupo: parseInt(modalForm.cgrupo), cguia: modalGuia.id, rol: modalForm.rol });
            setShowModal(false);
            load();
        } catch (e) {
            setError(e.message);
        }
    };

    const handleQuitar = async (asignacionId) => {
        try {
            await grupoGuiaService.eliminar(asignacionId);
            load();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Listar Guías</h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="text-left py-3 px-4">Nombre</th>
                                <th className="text-left py-3 px-4">Email</th>
                                <th className="text-left py-3 px-4">Celular</th>
                                <th className="text-left py-3 px-4">Grupos Asignados</th>
                                <th className="py-3 px-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Cargando...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin guías registrados</td></tr>
                            ) : data.map(g => (
                                <tr key={g.id} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium">{g.persona?.nombres || '—'}</td>
                                    <td className="py-3 px-4 text-gray-500">{g.persona?.email || '—'}</td>
                                    <td className="py-3 px-4 text-gray-500">{g.persona?.celular || '—'}</td>
                                    <td className="py-3 px-4">
                                        {g.gruposAsignados.length === 0 ? (
                                            <span className="text-xs text-gray-400">Sin asignar</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {g.gruposAsignados.map(ga => (
                                                    <span key={ga.id} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                                        {ga.grupo} ({ga.rol})
                                                        <button onClick={() => handleQuitar(ga.id)}
                                                            className="hover:text-red-600 font-bold">&times;</button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <button onClick={() => openAsignar(g)}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                            + Asignar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal para asignar grupo */}
            {showModal && modalGuia && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-xl p-6 w-96 shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="font-semibold text-gray-700 mb-4">
                            Asignar grupo a {modalGuia.persona?.nombres || 'Guía'}
                        </h3>
                        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Grupo</label>
                                <select value={modalForm.cgrupo} onChange={e => setModalForm({ ...modalForm, cgrupo: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="">Seleccione grupo</option>
                                    {grupos.map(g => <option key={g.id} value={g.id}>{g.nombreGrupo}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Rol</label>
                                <select value={modalForm.rol} onChange={e => setModalForm({ ...modalForm, rol: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="Titular">Titular</option>
                                    <option value="Ayudante">Ayudante</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                            <button onClick={handleAsignar}
                                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Asignar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
