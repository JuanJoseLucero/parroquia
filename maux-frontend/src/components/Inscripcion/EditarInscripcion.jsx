import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inscripcionEdicionService } from '../../api/services/inscripcionService';
import { nivelCatequesisService, turnoService } from '../../api/services/catequesisService';

const onlyAlpha = (v) => v.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '');
const onlyDigits = (v) => v.replace(/\D/g, '');
const upper = (v) => (v ? v.toUpperCase() : null);

const estadoCivilOptions = [
    'Casados Civil', 'Casados Eclesiastico', 'Union Libre',
    'Divorciado', 'Viudo', 'Soltero', 'Otro'
];

const tipoInstitucionOptions = [
    'Fiscal', 'Fiscomisional', 'Particular', 'Municipal',
    'Educacion en casa', 'No estudia'
];

const nivelEducativoOptions = [
    'Inicial', '1° de basica', '2° de basica', '3° de basica', '4° de basica',
    '5° de basica', '6° de basica', '7° de basica', '8° de basica', '9° de basica',
    '10° de basica', '1° Bachillerato', '2° Bachillerato', '3° Bachillerato', 'No estudia'
];

const emptyFicha = {
    sectorResidencia: '', tipoInstitucion: '', institucionEducativa: '',
    nivelEducativo: ''
};

function nuevoNino() {
    return {
        detalleId: null,
        ninioId: null,
        cedula: '', nombres: '', apellidos: '', fechaNacimiento: '',
        sexo: '', alergias: '', condicionesMedicas: '',
        cpadre: null, cmadre: null,
        bautizado: '', bautizadoFecha: '', bautizadoParroquia: '',
        eucaristia: '', eucaristiaFecha: '', eucaristiaParroquia: '',
        nivelCatequesis: '', turno: '', catequistaAnterior: '', parroquiaAnterior: '',
        ficha: { ...emptyFicha },
        eliminar: false,
    };
}

function ninoDesdeBackend(d) {
    const p = d.persona || {};
    const nino = d.nino || {};
    const detalle = d.detalle || {};
    const sac = d.sacramento || {};
    const ficha = d.ficha || {};
    return {
        detalleId: d.detalleId,
        ninioId: d.ninioId,
        cedula: p.cedula || '',
        nombres: p.nombres || '',
        apellidos: p.apellidos || '',
        fechaNacimiento: p.fechaNacimiento || '',
        sexo: nino.sexo || '',
        alergias: nino.alergias || '',
        condicionesMedicas: nino.condicionesMedicas || '',
        cpadre: nino.cpadre ?? null,
        cmadre: nino.cmadre ?? null,
        bautizado: typeof sac.bautizado === 'boolean' ? String(sac.bautizado) : '',
        bautizadoFecha: sac.bautizadoFecha || '',
        bautizadoParroquia: sac.bautizadoParroquia || '',
        eucaristia: typeof sac.eucaristia === 'boolean' ? String(sac.eucaristia) : '',
        eucaristiaFecha: sac.eucaristiaFecha || '',
        eucaristiaParroquia: sac.eucaristiaParroquia || '',
        nivelCatequesis: detalle.cnivelcatequesis ?? '',
        turno: detalle.cturno ?? '',
        catequistaAnterior: detalle.catequistaAnterior || '',
        parroquiaAnterior: detalle.parroquiaAnterior || '',
        ficha: {
            sectorResidencia: ficha.sectorResidencia || '',
            tipoInstitucion: ficha.tipoInstitucion || '',
            institucionEducativa: ficha.institucionEducativa || '',
            nivelEducativo: ficha.nivelEducativo || '',
        },
        eliminar: false,
    };
}

function emptyPadre(tipoPadre) {
    return {
        id: null,
        personaId: null,
        tipoPadre,
        cedula: '', nombres: '', apellidos: '',
        direccion: '', email: '', celular: '', estadoCivil: '',
        ocupacion: '', lugarTrabajo: '',
        remove: false,
    };
}

function padreDesdeBackend(p) {
    const persona = p.persona || {};
    return {
        id: p.id,
        personaId: p.personaId ?? null,
        tipoPadre: p.tipoPadre || 'padre',
        cedula: persona.cedula || '',
        nombres: persona.nombres || '',
        apellidos: persona.apellidos || '',
        direccion: persona.direccion || '',
        email: persona.email || '',
        celular: persona.celular || '',
        estadoCivil: persona.estadoCivil || '',
        ocupacion: p.ocupacion || '',
        lugarTrabajo: p.lugarTrabajo || '',
        remove: false,
    };
}

function emptyRep() {
    return {
        personaId: null,
        cedula: '', nombres: '', apellidos: '',
        direccion: '', email: '', celular: '', estadoCivil: '',
        ocupacion: '', lugarTrabajo: '',
    };
}

function repDesdeBackend(rep) {
    if (!rep) return emptyRep();
    const persona = rep.persona || {};
    return {
        personaId: rep.personaId ?? null,
        cedula: persona.cedula || '',
        nombres: persona.nombres || '',
        apellidos: persona.apellidos || '',
        direccion: persona.direccion || '',
        email: persona.email || '',
        celular: persona.celular || '',
        estadoCivil: persona.estadoCivil || '',
        ocupacion: rep.ocupacion || '',
        lugarTrabajo: rep.lugarTrabajo || '',
    };
}

export default function EditarInscripcion() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [idCabecera, setIdCabecera] = useState(null);
    const [fecha, setFecha] = useState('');
    const [cevento, setCevento] = useState('');
    const [notas, setNotas] = useState('');
    const [rep, setRep] = useState(emptyRep());
    const [repTipoPadre, setRepTipoPadre] = useState(null);
    const [padres, setPadres] = useState([emptyPadre('padre'), emptyPadre('madre')]);
    const [ninos, setNinos] = useState([]);

    const [niveles, setNiveles] = useState([]);
    const [turnos, setTurnos] = useState([]);

    useEffect(() => {
        nivelCatequesisService.listar().then(res => setNiveles(res.data || [])).catch(() => {});
        turnoService.listar().then(res => setTurnos(res.data || [])).catch(() => {});
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await inscripcionEdicionService.obtenerCompleta(Number(id));
            setIdCabecera(res.idCabecera);
            setFecha(res.fecha || '');
            setCevento(res.cevento || '');
            setNotas(res.notas || '');
            const repData = repDesdeBackend(res.representante);
            setRep(repData);
            setNinos((res.ninos || []).map(ninoDesdeBackend));
            const existing = (res.padres || []).map(padreDesdeBackend);
            const padre = existing.find(p => p.tipoPadre === 'padre') || emptyPadre('padre');
            const madre = existing.find(p => p.tipoPadre === 'madre') || emptyPadre('madre');
            setPadres([padre, madre]);
            let tipo = null;
            if (repData.personaId != null) {
                if (padre.personaId === repData.personaId) tipo = 'padre';
                else if (madre.personaId === repData.personaId) tipo = 'madre';
            }
            setRepTipoPadre(tipo);
        } catch (e) {
            setError(e.message || 'No se pudo cargar la inscripción.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    const handleRepChange = (e) => {
        const { name, value } = e.target;
        let sanitized = value;
        if (['nombres', 'apellidos', 'ocupacion', 'lugarTrabajo'].includes(name)) sanitized = onlyAlpha(value);
        if (name === 'celular') sanitized = onlyDigits(value);
        setRep(prev => ({ ...prev, [name]: sanitized }));
    };

    const handlePadreChange = (tipoPadre, field, value) => {
        let sanitized = value;
        if (['nombres', 'apellidos', 'ocupacion', 'lugarTrabajo'].includes(field)) sanitized = onlyAlpha(value);
        if (field === 'cedula') sanitized = onlyDigits(value);
        setPadres(prev => prev.map(p => (p.tipoPadre === tipoPadre ? { ...p, [field]: sanitized } : p)));
        if (repTipoPadre === tipoPadre && (field === 'ocupacion' || field === 'lugarTrabajo')) {
            setRep(prev => ({ ...prev, [field]: sanitized }));
        }
    };

    const handleSetRep = (tipoPadre) => {
        if (repTipoPadre === tipoPadre) {
            setRepTipoPadre(null);
            return;
        }
        const padre = padres.find(p => p.tipoPadre === tipoPadre);
        setRep(prev => ({
            ...prev,
            personaId: padre?.personaId ?? null,
            cedula: padre?.cedula || '',
            nombres: padre?.nombres || '',
            apellidos: padre?.apellidos || '',
            direccion: padre?.direccion || '',
            email: padre?.email || '',
            celular: padre?.celular || '',
            estadoCivil: padre?.estadoCivil || '',
            ocupacion: padre?.ocupacion || '',
            lugarTrabajo: padre?.lugarTrabajo || '',
        }));
        setRepTipoPadre(tipoPadre);
    };

    const removePadre = (tipoPadre) => {
        setPadres(prev => prev.map(p => (p.tipoPadre === tipoPadre ? { ...p, remove: true, id: p.id } : p)));
        setNinos(prev => prev.map(n => {
            const updated = { ...n };
            if (tipoPadre === 'padre') updated.cpadre = null;
            if (tipoPadre === 'madre') updated.cmadre = null;
            return updated;
        }));
    };

    const restaurarPadre = (tipoPadre) => {
        setPadres(prev => prev.map(p => (p.tipoPadre === tipoPadre ? { ...p, remove: false } : p)));
    };

    const handleNinoChange = (index, e) => {
        const { name, value } = e.target;
        let sanitized = value;
        if (['nombres', 'apellidos'].includes(name)) sanitized = onlyAlpha(value);
        setNinos(prev => {
            const u = [...prev];
            u[index] = { ...u[index], [name]: sanitized };
            return u;
        });
    };

    const handleFichaChange = (index, field, value) => {
        setNinos(prev => {
            const u = [...prev];
            u[index] = { ...u[index], ficha: { ...u[index].ficha, [field]: value } };
            return u;
        });
    };

    const addNino = () => {
        const padre = padres.find(p => p.tipoPadre === 'padre' && !p.remove);
        const madre = padres.find(p => p.tipoPadre === 'madre' && !p.remove);
        const nuevo = nuevoNino();
        nuevo.cpadre = padre && padre.id ? padre.id : null;
        nuevo.cmadre = madre && madre.id ? madre.id : null;
        setNinos(prev => [...prev, nuevo]);
    };

    const marcarEliminarNino = (index) => {
        setNinos(prev => prev.map((n, i) => (i === index ? { ...n, eliminar: true } : n)));
    };

    const restaurarNino = (index) => {
        setNinos(prev => prev.map((n, i) => (i === index ? { ...n, eliminar: false } : n)));
    };

    const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    const handleSubmit = async () => {
        setError(null);
        setSuccess(null);

        const esRepPadre = repTipoPadre === 'padre' || repTipoPadre === 'madre';
        let repEmail;
        if (esRepPadre) {
            const padreRep = padres.find(p => p.tipoPadre === repTipoPadre);
            if (!padreRep || !padreRep.cedula || !padreRep.nombres || !padreRep.apellidos) {
                setError('Complete cédula, nombres y apellidos del padre que actúa como representante legal.');
                return;
            }
            repEmail = rep.email;
        } else {
            if (!rep.cedula || !rep.nombres || !rep.apellidos) {
                setError('Cédula, nombres y apellidos del representante legal son requeridos.');
                return;
            }
            repEmail = rep.email;
        }
        if (repEmail && !isValidEmail(repEmail)) {
            setError('El correo electrónico del representante no tiene un formato válido.');
            return;
        }

        for (let i = 0; i < ninos.length; i++) {
            const n = ninos[i];
            if (n.eliminar) continue;
            if (!n.cedula || !n.nombres || !n.apellidos) {
                setError(`Complete todos los campos del niño #${i + 1} (cédula, nombres, apellidos).`);
                return;
            }
        }

        const padreActual = padres.find(p => p.tipoPadre === 'padre' && !p.remove) || null;
        const madreActual = padres.find(p => p.tipoPadre === 'madre' && !p.remove) || null;

        let repPayload;
        if (esRepPadre) {
            const padreRep = padres.find(p => p.tipoPadre === repTipoPadre) || {};
            const ocupacion = (rep.ocupacion || padreRep.ocupacion || '');
            const lugarTrabajo = (rep.lugarTrabajo || padreRep.lugarTrabajo || '');
            repPayload = {
                tipoPadre: repTipoPadre,
                direccion: rep.direccion ? rep.direccion.toUpperCase() : null,
                email: rep.email || null,
                celular: rep.celular || null,
                estadoCivil: rep.estadoCivil || null,
                ocupacion: ocupacion ? ocupacion.toUpperCase() : null,
                lugarTrabajo: lugarTrabajo ? lugarTrabajo.toUpperCase() : null,
            };
        } else {
            repPayload = {
                tipoPadre: null,
                cedula: rep.cedula || null,
                nombres: upper(rep.nombres),
                apellidos: upper(rep.apellidos),
                direccion: rep.direccion ? rep.direccion.toUpperCase() : null,
                email: rep.email || null,
                celular: rep.celular || null,
                estadoCivil: rep.estadoCivil || null,
                ocupacion: rep.ocupacion ? rep.ocupacion.toUpperCase() : null,
                lugarTrabajo: rep.lugarTrabajo ? rep.lugarTrabajo.toUpperCase() : null,
            };
        }

        const payload = {
            idCabecera: Number(id),
            notas: notas.trim() ? notas.trim().toUpperCase() : null,
            representante: repPayload,
            padres: padres
                .filter(p => !p.remove && (p.nombres.trim() || p.apellidos.trim()))
                .map(p => ({
                    ...(p.id ? { id: p.id } : {}),
                    tipoPadre: p.tipoPadre,
                    cedula: p.cedula || null,
                    nombres: upper(p.nombres),
                    apellidos: upper(p.apellidos),
                    nombre: `${p.nombres} ${p.apellidos}`.trim().toUpperCase(),
                    ocupacion: p.ocupacion ? p.ocupacion.toUpperCase() : null,
                    lugarTrabajo: p.lugarTrabajo ? p.lugarTrabajo.toUpperCase() : null,
                })),
            padresEliminados: padres.filter(p => p.remove && p.id).map(p => p.id),
            ninos: ninos.map(n => {
                if (n.eliminar) {
                    return n.detalleId ? { detalleId: n.detalleId, eliminar: true } : null;
                }
                return {
                    ...(n.detalleId ? { detalleId: n.detalleId } : {}),
                    cedula: n.cedula,
                    nombres: upper(n.nombres),
                    apellidos: upper(n.apellidos),
                    fechaNacimiento: n.fechaNacimiento || null,
                    sexo: n.sexo || null,
                    alergias: n.alergias ? upper(n.alergias) : null,
                    condicionesMedicas: n.condicionesMedicas ? upper(n.condicionesMedicas) : null,
                    cpadre: padreActual ? (padreActual.id || null) : null,
                    cmadre: madreActual ? (madreActual.id || null) : null,
                    nivelCatequesis: n.nivelCatequesis !== '' && n.nivelCatequesis != null ? Number(n.nivelCatequesis) : null,
                    turno: n.turno !== '' && n.turno != null ? Number(n.turno) : null,
                    catequistaAnterior: n.catequistaAnterior ? upper(n.catequistaAnterior) : null,
                    parroquiaAnterior: n.parroquiaAnterior ? upper(n.parroquiaAnterior) : null,
                    bautizado: n.bautizado === 'true',
                    bautizadoFecha: n.bautizadoFecha || null,
                    bautizadoParroquia: n.bautizadoParroquia ? upper(n.bautizadoParroquia) : null,
                    eucaristia: n.eucaristia === 'true',
                    eucaristiaFecha: n.eucaristiaFecha || null,
                    eucaristiaParroquia: n.eucaristiaParroquia ? upper(n.eucaristiaParroquia) : null,
                    ficha: {
                        sectorResidencia: n.ficha.sectorResidencia || null,
                        tipoInstitucion: n.ficha.tipoInstitucion || null,
                        institucionEducativa: n.ficha.institucionEducativa ? upper(n.ficha.institucionEducativa) : null,
                        nivelEducativo: n.ficha.nivelEducativo || null,
                    },
                };
            }).filter(Boolean),
        };

        setSaving(true);
        try {
            const result = await inscripcionEdicionService.actualizarCompleta(payload);
            setSuccess(result);
        } catch (err) {
            setError(err.message || 'No se pudo guardar la inscripción.');
        } finally {
            setSaving(false);
        }
    };

    const totalRechazados = success?.rechazados?.length || 0;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Editar Inscripción {idCabecera ? `#${idCabecera}` : ''}</h2>
                <button onClick={() => navigate('/participantes')}
                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    Volver
                </button>
            </div>

            {success && (
                <div className="mb-6 p-5 bg-green-50 border-2 border-green-300 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                        <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="font-bold text-green-800">Cambios guardados</p>
                            {totalRechazados > 0 && (
                                <p className="text-sm text-yellow-700 mt-1">
                                    {totalRechazados} niño(s) no se agregaron porque ya están inscritos en este evento.
                                </p>
                            )}
                        </div>
                    </div>
                    {totalRechazados > 0 && (
                        <ul className="list-disc list-inside text-sm text-yellow-700 ml-10">
                            {success.rechazados.map((n, i) => <li key={i}>{n}</li>)}
                        </ul>
                    )}
                    <button onClick={() => navigate('/participantes')}
                        className="mt-3 px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                        Ir a Participantes
                    </button>
                </div>
            )}

            {error && (
                <div className="mb-6 p-5 bg-red-50 border-2 border-red-300 rounded-2xl text-center">
                    <svg className="h-10 w-10 text-red-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-red-800 font-bold mb-1">Error</p>
                    <p className="text-red-600 text-sm mb-4">{error}</p>
                    <button onClick={() => setError(null)}
                        className="px-5 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors">
                        Cerrar
                    </button>
                </div>
            )}

            {loading ? (
                <div className="text-center py-16 text-gray-400">Cargando inscripción...</div>
            ) : !success ? (
                <div className="space-y-6">
                    {/* Cabecera + Observaciones */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Información General</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Evento</label>
                                <input type="text" value={cevento ? `Evento #${cevento}` : ''} readOnly
                                    className="w-full px-3 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-lg text-sm cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Fecha de inscripción</label>
                                <input type="text" value={fecha || ''} readOnly
                                    className="w-full px-3 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-lg text-sm cursor-not-allowed" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Observaciones</label>
                            <textarea
                                rows={3}
                                maxLength={1000}
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                placeholder="Indicaciones adicionales (opcional)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y" />
                        </div>
                    </div>

                    {/* Representante (solo si no es uno de los padres) */}
                    {repTipoPadre === null && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Representante Legal</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Cédula" name="cedula" value={rep.cedula} onChange={handleRepChange} maxLength={10} sanitize="digit" />
                            <Input label="Nombres" name="nombres" value={rep.nombres} onChange={handleRepChange} maxLength={200} sanitize="alpha" />
                            <Input label="Apellidos" name="apellidos" value={rep.apellidos} onChange={handleRepChange} maxLength={200} sanitize="alpha" />
                            <Input label="Sector" name="direccion" value={rep.direccion} onChange={handleRepChange} />
                            <Input label="Email" name="email" type="email" value={rep.email} onChange={handleRepChange} />
                            <Input label="Celular" name="celular" value={rep.celular} onChange={handleRepChange} maxLength={15} sanitize="digit" />
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Estado Civil</label>
                                <select name="estadoCivil" value={rep.estadoCivil} onChange={handleRepChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                                    <option value="">Seleccione</option>
                                    {estadoCivilOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <Input label="Ocupación" name="ocupacion" value={rep.ocupacion} onChange={handleRepChange} maxLength={200} sanitize="alpha" />
                            <Input label="Lugar de Trabajo" name="lugarTrabajo" value={rep.lugarTrabajo} onChange={handleRepChange} maxLength={200} sanitize="alpha" />
                        </div>
                    </div>
                    )}

                    {/* Padres */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Padres</h3>
                        <p className="text-xs text-gray-400 mb-3">Marque la casilla del padre que actúa como representante legal (sus datos de representante se editan dentro de esta sección).</p>
                        <div className="space-y-5">
                            {padres.map(p => (
                                <PadreSection
                                    key={p.tipoPadre}
                                    label={p.tipoPadre === 'padre' ? 'Padre' : 'Madre'}
                                    data={p}
                                    esRep={repTipoPadre === p.tipoPadre}
                                    onSetRep={() => handleSetRep(p.tipoPadre)}
                                    repData={rep}
                                    onRepChange={handleRepChange}
                                    onChange={(field, value) => handlePadreChange(p.tipoPadre, field, value)}
                                    onRemove={() => removePadre(p.tipoPadre)}
                                    onRestaurar={() => restaurarPadre(p.tipoPadre)} />
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-3">Al quitar un padre se desvincula de todos los niños de la inscripción. El padre que es representante legal no se puede quitar: primero desmárquelo.</p>
                    </div>

                    {/* Niños */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-700">Niños</h3>
                            <span className="text-xs text-gray-400">{ninos.filter(n => !n.eliminar).length} niño(s)</span>
                        </div>

                        <div className="space-y-3">
                            {ninos.map((nino, idx) => {
                                const nc = nino.nivelCatequesis !== '' && nino.nivelCatequesis != null ? niveles.find(x => x.id === Number(nino.nivelCatequesis)) : null;
                                return (
                                <NinoSection
                                    key={nino.detalleId || `nuevo-${idx}`}
                                    idx={idx}
                                    data={nino}
                                    niveles={niveles}
                                    turnos={turnos}
                                    onChange={(e) => handleNinoChange(idx, e)}
                                    onFichaChange={(field, value) => handleFichaChange(idx, field, value)}
                                    onRemove={() => marcarEliminarNino(idx)}
                                    onRestaurar={() => restaurarNino(idx)}
                                    resumen={nc ? nc.nombre : ''} />
                                );
                            })}
                        </div>

                        <button type="button" onClick={addNino}
                            className="mt-4 w-full py-2.5 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 text-sm font-medium hover:bg-blue-50 hover:border-blue-400 transition-colors flex items-center justify-center gap-2">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Agregar otro niño
                        </button>
                    </div>

                    {/* Acciones */}
                    <div className="flex justify-end gap-3 pb-4">
                        <button onClick={() => navigate('/participantes')}
                            className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            Cancelar
                        </button>
                        <button onClick={handleSubmit} disabled={saving}
                            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                            {saving && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function PadreSection({ label, data, onChange, onRemove, onRestaurar, esRep, onSetRep, repData, onRepChange }) {
    if (data.remove) {
        return (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-sm font-semibold text-gray-700">{label}</span>
                        <p className="text-xs text-red-600 mt-1">Marcado para quitar de la inscripción.</p>
                    </div>
                    <button type="button" onClick={onRestaurar}
                        className="px-4 py-1.5 text-xs text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
                        Deshacer
                    </button>
                </div>
            </div>
        );
    }
    return (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">{label}</span>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                        <input type="checkbox" checked={esRep} onChange={onSetRep}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        Representante legal
                    </label>
                    {data.id && !esRep && (
                        <button type="button" onClick={onRemove}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-1 transition-colors" title="Quitar">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Input label="Cédula" value={data.cedula} onChange={(e) => onChange('cedula', e.target.value)} maxLength={10} sanitize="digit" />
                <Input label="Nombres" value={data.nombres} onChange={(e) => onChange('nombres', e.target.value)} maxLength={200} sanitize="alpha" />
                <Input label="Apellidos" value={data.apellidos} onChange={(e) => onChange('apellidos', e.target.value)} maxLength={200} sanitize="alpha" />
                <Input label="Ocupación" value={data.ocupacion} onChange={(e) => onChange('ocupacion', e.target.value)} maxLength={200} sanitize="alpha" />
                <Input label="Lugar de Trabajo" value={data.lugarTrabajo} onChange={(e) => onChange('lugarTrabajo', e.target.value)} maxLength={200} sanitize="alpha" />
            </div>
            {esRep && (
                <div className="border-t border-gray-200 pt-3 mt-3">
                    <span className="text-xs font-semibold text-gray-600 block mb-2">Datos del Representante Legal</span>
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Email" name="email" type="email" value={repData.email} onChange={onRepChange} />
                        <Input label="Celular" name="celular" value={repData.celular} onChange={onRepChange} maxLength={15} sanitize="digit" />
                        <Input label="Sector" name="direccion" value={repData.direccion} onChange={onRepChange} />
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Estado Civil</label>
                            <select name="estadoCivil" value={repData.estadoCivil} onChange={onRepChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                                <option value="">Seleccione</option>
                                {estadoCivilOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function NinoSection({ idx, data, niveles, turnos, onChange, onFichaChange, onRemove, onRestaurar, resumen }) {
    if (data.eliminar) {
        return (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-sm font-semibold text-gray-700">Niño #{idx + 1}</span>
                        <p className="text-xs text-red-600 mt-1">Marcado para eliminar de la inscripción.</p>
                    </div>
                    <button type="button" onClick={onRestaurar}
                        className="px-4 py-1.5 text-xs text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
                        Deshacer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Niño #{idx + 1}</span>
                {data.detalleId ? (
                    <button type="button" onClick={onRemove}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-1 transition-colors" title="Quitar">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                ) : (
                    <span className="text-xs text-blue-600 font-medium">Nuevo</span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Input label="Cédula *" name="cedula" value={data.cedula} onChange={onChange} maxLength={10} sanitize="digit" />
                <Input label="Nombres *" name="nombres" value={data.nombres} onChange={onChange} maxLength={200} sanitize="alpha" />
                <Input label="Apellidos *" name="apellidos" value={data.apellidos} onChange={onChange} maxLength={200} sanitize="alpha" />
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Fecha Nacimiento</label>
                    <input type="date" name="fechaNacimiento" value={data.fechaNacimiento} onChange={onChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Sexo *</label>
                    <select name="sexo" value={data.sexo} onChange={onChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                        <option value="">Seleccione</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                    </select>
                </div>
                <Input label="Alergias" name="alergias" value={data.alergias} onChange={onChange} maxLength={200} />
                <Input label="Condiciones Médicas" name="condicionesMedicas" value={data.condicionesMedicas} onChange={onChange} maxLength={200} />
            </div>

            <div className="border-t border-gray-200 pt-3 mt-3">
                <h5 className="text-xs font-semibold text-gray-600 mb-2">Catequesis</h5>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nivel de Catequesis</label>
                        <select name="nivelCatequesis" value={data.nivelCatequesis} onChange={onChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                            <option value="">Seleccione</option>
                            {niveles.map(nc => <option key={nc.id} value={nc.id}>{nc.nombre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Turno</label>
                        <select name="turno" value={data.turno} onChange={onChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                            <option value="">Seleccione</option>
                            {turnos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                        </select>
                    </div>
                    <Input label="Catequista anterior" name="catequistaAnterior" value={data.catequistaAnterior} onChange={onChange} />
                    <Input label="Parroquia anterior" name="parroquiaAnterior" value={data.parroquiaAnterior} onChange={onChange} />
                </div>
            </div>

            <div className="border-t border-gray-200 pt-3 mt-3">
                <h5 className="text-xs font-semibold text-gray-600 mb-2">Sacramentos</h5>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Bautizado</label>
                        <select name="bautizado" value={data.bautizado} onChange={onChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                            <option value="">Seleccione</option>
                            <option value="true">Sí</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                    {data.bautizado === 'true' && (
                        <>
                            <Input label="Fecha Bautismo" name="bautizadoFecha" type="date" value={data.bautizadoFecha} onChange={onChange} />
                            <Input label="Parroquia Bautismo" name="bautizadoParroquia" value={data.bautizadoParroquia} onChange={onChange} />
                        </>
                    )}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Primera Comunión</label>
                        <select name="eucaristia" value={data.eucaristia} onChange={onChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                            <option value="">Seleccione</option>
                            <option value="true">Sí</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                    {data.eucaristia === 'true' && (
                        <>
                            <Input label="Fecha Comunión" name="eucaristiaFecha" type="date" value={data.eucaristiaFecha} onChange={onChange} />
                            <Input label="Parroquia Comunión" name="eucaristiaParroquia" value={data.eucaristiaParroquia} onChange={onChange} />
                        </>
                    )}
                </div>
            </div>

            <div className="border-t border-gray-200 pt-3 mt-3">
                <h5 className="text-xs font-semibold text-gray-600 mb-2">Datos Educativos</h5>
                <div className="grid grid-cols-2 gap-3">
                    <Input label="Sector de residencia" value={data.ficha.sectorResidencia} onChange={(e) => onFichaChange('sectorResidencia', e.target.value)} />
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Institución Educativa</label>
                        <select value={data.ficha.tipoInstitucion} onChange={(e) => onFichaChange('tipoInstitucion', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                            <option value="">Seleccione</option>
                            {tipoInstitucionOptions.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                    <Input label="Institución Educativa" value={data.ficha.institucionEducativa} onChange={(e) => onFichaChange('institucionEducativa', e.target.value)} />
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nivel Educativo</label>
                        <select value={data.ficha.nivelEducativo} onChange={(e) => onFichaChange('nivelEducativo', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                            <option value="">Seleccione</option>
                            {nivelEducativoOptions.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {resumen && (
                <div className="mt-3 text-xs text-blue-700">
                    <strong>Catequesis:</strong> {resumen}
                </div>
            )}
        </div>
    );
}

function Input({ label, name, type = 'text', value, onChange, maxLength, sanitize, readOnly }) {
    const handleChange = sanitize
        ? (e) => {
            let v = e.target.value;
            if (sanitize === 'alpha') v = onlyAlpha(v);
            if (sanitize === 'digit') v = onlyDigits(v);
            e.target.value = v;
            onChange(e);
          }
        : onChange;
    return (
        <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={handleChange}
                readOnly={readOnly}
                maxLength={maxLength}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none transition-colors ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
            />
        </div>
    );
}
