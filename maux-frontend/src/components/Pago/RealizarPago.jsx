import { useState } from 'react';
import { pagoService } from '../../api/services/inscripcionService';
import { metodoPagoService } from '../../api/services/inscripcionService';
import { formatMoney, ESTADOS_INSCRIPCION } from '../../utils/formatters';

const API_BASE = import.meta.env.PROD
    ? '/api'
    : '/maux-backend_catequesis/api';

async function post(endpoint, body = {}) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const msg = await res.text().catch(() => 'Error desconocido');
        throw new Error(msg);
    }
    return res.json();
}

export default function RealizarPago() {
    const [step, setStep] = useState(0);
    const [participantes, setParticipantes] = useState([]);
    const [selected, setSelected] = useState(null);
    const [detalle, setDetalle] = useState(null);
    const [pagosPrevios, setPagosPrevios] = useState([]);
    const [metodos, setMetodos] = useState([]);
    const [costoTotal, setCostoTotal] = useState(0);
    const [form, setForm] = useState({ monto: '', cmetodopago: '', numeroReferencia: '', observaciones: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const buscarParticipantes = async () => {
        setLoading(true);
        setError(null);
        try {
            const [data, metodosRes] = await Promise.all([
                post('/inscripciones/participantes-pendientes', {}),
                metodoPagoService.listar(),
            ]);

            setMetodos(metodosRes?.data || []);

            if (data && data.length > 0) {
                setCostoTotal(data[0].costo || 15);
            }
            setParticipantes(data || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const selectParticipante = async (p) => {
        setSelected(p);
        setDetalle(p);
        setCostoTotal(p.costo || 15);
        try {
            const pagosRes = await pagoService.listarAdmin(0, 2000);
            const pagos = (pagosRes?.data || []).filter(pg => pg.cinscripcionDetalle === p.idDetalle);
            setPagosPrevios(pagos);
            setForm({
                monto: Math.max(0, (p.costo || 15) - (p.totalPagado || 0)),
                cmetodopago: '',
                numeroReferencia: '',
                observaciones: '',
            });
            setStep(1);
        } catch (e) {
            setError(e.message);
        }
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handlePago = async () => {
        if (!form.monto || !form.cmetodopago) {
            setError('Monto y método de pago son requeridos');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await post('/inscripciones/registrar-pago', {
                cinscripcionDetalle: detalle.idDetalle,
                cusuario: 1,
                monto: parseFloat(form.monto),
                fechaPago: new Date().toISOString().split('T')[0],
                cmetodopago: parseInt(form.cmetodopago),
                numeroReferencia: form.numeroReferencia || null,
                observaciones: form.observaciones || null,
            });

            setSuccess('Pago registrado exitosamente.');
            setForm({ monto: '', cmetodopago: '', numeroReferencia: '', observaciones: '' });
            setStep(0);
            setSelected(null);
            buscarParticipantes();
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Realizar Pago de Inscripción</h2>

            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    {success}
                    <button onClick={() => setSuccess(null)} className="ml-4 underline">Cerrar</button>
                </div>
            )}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            {step === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <button onClick={buscarParticipantes} disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors mb-4">
                        {loading ? 'Cargando...' : 'Buscar Participantes'}
                    </button>

                    {participantes.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-gray-500">
                                        <th className="text-left py-2">Niño</th>
                                        <th className="text-left py-2">Estado</th>
                                        <th className="text-right py-2">Pagado</th>
                                        <th className="text-right py-2">Pendiente</th>
                                        <th className="py-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {participantes.map(p => (
                                        <tr key={p.idDetalle} className="border-b hover:bg-gray-50">
                                            <td className="py-2">{p.nombreCompleto}</td>
                                            <td className="py-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                    p.cestadoinscripcion === 2 ? 'bg-green-100 text-green-700' :
                                                    p.cestadoinscripcion === 4 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>{ESTADOS_INSCRIPCION[p.cestadoinscripcion] || 'Desconocido'}</span>
                                            </td>
                                            <td className="py-2 text-right">{formatMoney(p.totalPagado)}</td>
                                            <td className={`py-2 text-right font-medium ${p.pendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatMoney(p.pendiente)}</td>
                                            <td className="py-2 text-right">
                                                <button onClick={() => selectParticipante(p)}
                                                    className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                                                    {p.pendiente > 0 ? 'Pagar' : 'Ver'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {participantes.length === 0 && !loading && (
                        <p className="text-gray-400 text-sm text-center py-8">Presione "Buscar Participantes" para cargar la lista.</p>
                    )}
                </div>
            )}

            {step === 1 && detalle && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <button onClick={() => setStep(0)} className="text-blue-600 text-sm hover:underline mb-4 inline-block">
                        ← Volver a lista
                    </button>

                    <div className="p-4 bg-gray-50 rounded-lg mb-6">
                        <h3 className="font-semibold text-gray-700">{detalle.nombreCompleto}</h3>
                        <p className="text-sm text-gray-500">Cédula: {detalle.cedula}</p>
                        <p className="text-sm text-gray-500">Costo total: {formatMoney(detalle.costo || costoTotal)}</p>
                        <p className="text-sm text-gray-500">Pagado: {formatMoney(detalle.totalPagado)}</p>
                        {(() => {
                            const pen = Math.max(0, (detalle.costo || costoTotal) - (detalle.totalPagado || 0));
                            return <p className={`text-sm font-semibold ${pen > 0 ? 'text-red-600' : 'text-green-600'}`}>Pendiente: {formatMoney(pen)}</p>;
                        })()}
                    </div>

                    {pagosPrevios.length > 0 ? (
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-600 mb-2">Pagos anteriores</h4>
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b text-gray-500">
                                        <th className="text-left py-1">Fecha</th>
                                        <th className="text-right py-1">Monto</th>
                                        <th className="text-left py-1">Método</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagosPrevios.map(p => (
                                        <tr key={p.id} className="border-b">
                                            <td className="py-1">{p.fechaPago}</td>
                                            <td className="py-1 text-right">{formatMoney(p.monto)}</td>
                                            <td className="py-1">{metodos.find(m => m.id === p.cmetodopago)?.descripcion || p.cmetodopago}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-4">Sin pagos registrados</p>
                    )}

                    {(detalle.pendiente || 0) > 0 ? (
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-600">Registrar nuevo pago</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Monto</label>
                                    <input type="number" step="0.01" name="monto" value={form.monto} onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Método de Pago</label>
                                    <select name="cmetodopago" value={form.cmetodopago} onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="">Seleccione</option>
                                        {metodos.map(m => (
                                            <option key={m.id} value={m.id}>{m.descripcion}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">N° Referencia</label>
                                    <input type="text" name="numeroReferencia" value={form.numeroReferencia} onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones</label>
                                    <input type="text" name="observaciones" value={form.observaciones} onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                            <button onClick={handlePago} disabled={loading}
                                className="w-full py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                                {loading ? 'Procesando...' : 'Confirmar Pago'}
                            </button>
                        </div>
                    ) : (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                            <svg className="h-6 w-6 text-green-600 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-semibold text-green-800">Inscripción pagada en su totalidad</p>
                            <p className="text-xs text-green-600 mt-0.5">No se requieren pagos adicionales</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
