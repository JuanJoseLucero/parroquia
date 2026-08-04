import { useState, useRef, useEffect } from 'react';

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

function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nac = new Date(fechaNacimiento + "T12:00:00");
    let edad = hoy.getFullYear() - nac.getFullYear();
    const mes = hoy.getMonth() - nac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
}

function getRangoEdad(edad) {
    if (edad >= 7 && edad <= 9) return "7-9";
    if (edad >= 10 && edad <= 15) return "10-15";
    return null;
}

const onlyAlpha = (v) => v.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '');
const onlyDigits = (v) => v.replace(/\D/g, '');
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const upper = (v) => v ? v.toUpperCase() : null;

const STEPS = ['Datos Familiares', 'Niños'];
const emptyNino = {
    cedula: '', nombres: '', apellidos: '', fechaNacimiento: '', sexo: '', alergias: '', condicionesMedicas: '',
    bautizado: '', bautizadoFecha: '', bautizadoParroquia: '',
    eucaristia: '', eucaristiaFecha: '', eucaristiaParroquia: '',
    nivelCatequesis: '', turno: '', catequistaAnterior: '', parroquiaAnterior: ''
};
const emptyPadre = {
    nombres: '', apellidos: '', ocupacion: '', lugarTrabajo: '', telefono: '',
    esRepresentante: false,
    cedula: '', direccion: '', email: '', celular: '',
    estadoCivil: ''
};

const emptyFicha = { tipoInstitucion: '', institucionEducativa: '', nivelEducativo: '' };

const maskText = (text) => {
    if (!text || text.length <= 2) return text || '';
    return text[0] + '*'.repeat(Math.min(text.length - 2, 6)) + text[text.length - 1];
};

export default function NuevaInscripcion() {
    const formRef = useRef(null);
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    const [rep, setRep] = useState({ cedula: '', nombres: '', apellidos: '', direccion: '', email: '', celular: '', estadoCivil: '', ocupacion: '', lugarTrabajo: '' });
    const [ninos, setNinos] = useState([{ ...emptyNino }]);
    const [nivelesCatequesis, setNivelesCatequesis] = useState([]);
    const [turnos, setTurnos] = useState([]);
    const [eventoActual, setEventoActual] = useState(null);
    const [padres, setPadres] = useState([{ ...emptyPadre }, { ...emptyPadre }]);
    const [fichas, setFichas] = useState([{ ...emptyFicha }]);

    const [repEncontrado, setRepEncontrado] = useState(false);
    const [consultandoCedula, setConsultandoCedula] = useState(false);
    const [consultandoPadre, setConsultandoPadre] = useState({ 0: false, 1: false });
    const [padreEncontrado, setPadreEncontrado] = useState({ 0: false, 1: false });
    const [ninosDuplicados, setNinosDuplicados] = useState({});

    useEffect(() => {
        post("/niveles-catequesis/listar", { page: 0, size: 100 }).then(res => setNivelesCatequesis(res.data || [])).catch(() => {});
    }, []);

    useEffect(() => {
        post("/turnos/listar", { page: 0, size: 100 }).then(res => setTurnos(res.data || [])).catch(() => {});
    }, []);

    useEffect(() => {
        post("/eventos/actual", {}).then(setEventoActual).catch(() => {});
    }, []);

    const handleRepChange = (e) => {
        const { name, value } = e.target;
        if (name === 'cedula') setRepEncontrado(false);
        let sanitized = value;
        if (['nombres', 'apellidos', 'ocupacion', 'lugarTrabajo'].includes(name)) sanitized = onlyAlpha(value);
        if (name === 'celular') sanitized = onlyDigits(value);
        setRep({ ...rep, [name]: sanitized });
    };

    const handlePadreChange = (index, field, value) => {
        let sanitized = value;
        if (field !== 'esRepresentante') {
            if (['nombres', 'apellidos', 'ocupacion', 'lugarTrabajo'].includes(field)) sanitized = onlyAlpha(value);
            if (['telefono', 'cedula'].includes(field)) sanitized = onlyDigits(value);
        }
        if (field === 'cedula') setPadreEncontrado(prev => ({ ...prev, [index]: false }));
        setPadres(prev => {
            const u = [...prev];
            if (field === 'esRepresentante' && value) {
                u[0] = { ...u[0], esRepresentante: index === 0 };
                u[1] = { ...u[1], esRepresentante: index === 1 };
            } else {
                u[index] = { ...u[index], [field]: sanitized };
            }
            return u;
        });
    };

    const handleCedulaBlur = async () => {
        const cedula = rep.cedula.trim();
        if (!cedula || cedula.length < 10) return;
        setConsultandoCedula(true);
        try {
            const res = await post('/inscripciones/buscar-por-cedula', { cedula });
            if (res.existe) {
                setRepEncontrado(true);
                setRep((prev) => ({ ...prev, nombres: res.nombres, apellidos: res.apellidos }));
            } else {
                setRepEncontrado(false);
            }
        } catch {
            setRepEncontrado(false);
        } finally {
            setConsultandoCedula(false);
        }
    };

    const handleParentCedulaBlur = async (index) => {
        const cedula = padres[index].cedula.trim();
        if (!cedula || cedula.length < 10) return;
        setConsultandoPadre(prev => ({ ...prev, [index]: true }));
        try {
            const res = await post('/inscripciones/buscar-por-cedula', { cedula });
            if (res.existe) {
                setPadreEncontrado(prev => ({ ...prev, [index]: true }));
                setPadres(prev => {
                    const u = [...prev];
                    u[index] = { ...u[index], nombres: res.nombres, apellidos: res.apellidos };
                    return u;
                });
            } else {
                setPadreEncontrado(prev => ({ ...prev, [index]: false }));
            }
        } catch {
            setPadreEncontrado(prev => ({ ...prev, [index]: false }));
        } finally {
            setConsultandoPadre(prev => ({ ...prev, [index]: false }));
        }
    };

    const handleNinoCedulaBlur = async (index, cedula) => {
        const cd = cedula.trim();
        if (!cd || cd.length < 10) return;
        setConsultandoCedula(true);
        try {
            const res = await post('/inscripciones/buscar-por-cedula', { cedula: cd });
            setNinosDuplicados((prev) => ({ ...prev, [index]: res.yaInscrito }));
        } catch {
            setNinosDuplicados((prev) => ({ ...prev, [index]: false }));
        } finally {
            setConsultandoCedula(false);
        }
    };

    const handleNinoChange = (index, e) => {
        const updated = [...ninos];
        const { name, value } = e.target;
        let sanitized = value;
        if (['nombres', 'apellidos'].includes(name)) sanitized = onlyAlpha(value);
        updated[index] = { ...updated[index], [name]: sanitized };

        setNinos(updated);
    };

    const handleFichaChange = (index, field, value) => {
        setFichas(prev => { const u = [...prev]; u[index] = { ...u[index], [field]: value }; return u; });
    };

    const addNino = () => {
        setNinos([...ninos, { ...emptyNino }]);
        setFichas([...fichas, { ...emptyFicha }]);
    };
    const removeNino = (index) => {
        if (ninos.length === 1) return;
        setNinos(ninos.filter((_, i) => i !== index));
        setFichas(fichas.filter((_, i) => i !== index));
    };

    const nextStep = () => {
        setError(null);
        if (step === 0) {
            if (padres[0].esRepresentante) {
                if (!padres[0].cedula) {
                    setError('Cédula del padre (representante legal) es requerida.');
                    return;
                }
            } else if (padres[1].esRepresentante) {
                if (!padres[1].cedula) {
                    setError('Cédula de la madre (representante legal) es requerida.');
                    return;
                }
            } else {
                if (!rep.cedula || !rep.nombres || !rep.apellidos) {
                    setError('Cédula, nombres y apellidos del representante legal son requeridos.');
                    return;
                }
            }

            const repEmail = padres[0].esRepresentante
                ? padres[0].email
                : padres[1].esRepresentante
                ? padres[1].email
                : rep.email;
            if (repEmail && !isValidEmail(repEmail)) {
                setError('El correo electrónico del representante no tiene un formato válido.');
                return;
            }
        }
        setStep(step + 1);
    };

    const prevStep = () => setStep(Math.max(0, step - 1));

    const getRepresentanteEfectivo = () => {
        if (padres[0].esRepresentante) return {
            cedula: padres[0].cedula,
            nombres: upper(padres[0].nombres),
            apellidos: upper(padres[0].apellidos),
            direccion: padres[0].direccion ? padres[0].direccion.toUpperCase() : null,
            email: padres[0].email || null,
            celular: padres[0].celular || padres[0].telefono || null,
            estadoCivil: padres[0].estadoCivil || null,
            ocupacion: padres[0].ocupacion ? padres[0].ocupacion.toUpperCase() : null,
            lugarTrabajo: padres[0].lugarTrabajo ? padres[0].lugarTrabajo.toUpperCase() : null,
        };
        if (padres[1].esRepresentante) return {
            cedula: padres[1].cedula,
            nombres: upper(padres[1].nombres),
            apellidos: upper(padres[1].apellidos),
            direccion: padres[1].direccion ? padres[1].direccion.toUpperCase() : null,
            email: padres[1].email || null,
            celular: padres[1].celular || padres[1].telefono || null,
            estadoCivil: padres[1].estadoCivil || null,
            ocupacion: padres[1].ocupacion ? padres[1].ocupacion.toUpperCase() : null,
            lugarTrabajo: padres[1].lugarTrabajo ? padres[1].lugarTrabajo.toUpperCase() : null,
        };
        return {
            cedula: rep.cedula,
            nombres: upper(rep.nombres),
            apellidos: upper(rep.apellidos),
            direccion: rep.direccion ? rep.direccion.toUpperCase() : null,
            email: rep.email || null,
            celular: rep.celular || null,
            estadoCivil: rep.estadoCivil || null,
            ocupacion: rep.ocupacion ? rep.ocupacion.toUpperCase() : null,
            lugarTrabajo: rep.lugarTrabajo ? rep.lugarTrabajo.toUpperCase() : null,
        };
    };

    const handleSubmit = async () => {
        setError(null);
        setSuccess(null);

        if (!eventoActual) {
            setError('No hay un evento activo configurado para realizar la inscripción.');
            return;
        }

        for (let i = 0; i < ninos.length; i++) {
            const n = ninos[i];
            if (!n.cedula || !n.nombres || !n.apellidos) {
                setError(`Complete todos los campos del niño #${i + 1} (cédula, nombres, apellidos).`);
                return;
            }
        }

        setLoading(true);
        try {
            const result = await post('/inscripciones/crear-completa', {
                representante: getRepresentanteEfectivo(),
                ninos: ninos.map(n => ({
                    cedula: n.cedula,
                    nombres: upper(n.nombres),
                    apellidos: upper(n.apellidos),
                    fechaNacimiento: n.fechaNacimiento || null,
                    sexo: n.sexo || null,
                    alergias: n.alergias ? n.alergias.toUpperCase() : null,
                    condicionesMedicas: n.condicionesMedicas ? n.condicionesMedicas.toUpperCase() : null,
                    bautizado: n.bautizado === 'true',
                    bautizadoFecha: n.bautizadoFecha || null,
                    bautizadoParroquia: n.bautizadoParroquia ? n.bautizadoParroquia.toUpperCase() : null,
                    eucaristia: n.eucaristia === 'true',
                    eucaristiaFecha: n.eucaristiaFecha || null,
                    eucaristiaParroquia: n.eucaristiaParroquia ? n.eucaristiaParroquia.toUpperCase() : null,
                    nivelCatequesis: n.nivelCatequesis ? Number(n.nivelCatequesis) : null,
                    turno: n.turno ? Number(n.turno) : null,
                    catequistaAnterior: n.catequistaAnterior ? n.catequistaAnterior.toUpperCase() : null,
                    parroquiaAnterior: n.parroquiaAnterior ? n.parroquiaAnterior.toUpperCase() : null,
                })),
                fichas: fichas.map(f => ({
                    tipoInstitucion: f.tipoInstitucion || null,
                    institucionEducativa: f.institucionEducativa ? f.institucionEducativa.toUpperCase() : null,
                    nivelEducativo: f.nivelEducativo || null,
                })),
                padres: padres.filter(p => p.nombres.trim() !== '').map((p, i) => ({
                    tipoPadre: i === 0 ? 'padre' : 'madre',
                    cedula: p.cedula || null,
                    nombre: `${p.nombres} ${p.apellidos}`.trim().toUpperCase(),
                    ocupacion: p.ocupacion ? p.ocupacion.toUpperCase() : null,
                    lugarTrabajo: p.lugarTrabajo ? p.lugarTrabajo.toUpperCase() : null,
                    telefono: p.telefono || null,
                })),
                cusuario: 1,
                cevento: eventoActual.id,
            });

            setSuccess({
                idCabecera: result.idCabecera,
                total: result.totalNinos,
                nombres: result.detalles.map(d => d.nombre),
            });
            setStep(0);
            setRep({ cedula: '', nombres: '', apellidos: '', direccion: '', email: '', celular: '', estadoCivil: '', ocupacion: '', lugarTrabajo: '' });
            setNinos([{ ...emptyNino }]);
            setFichas([{ ...emptyFicha }]);
            setPadres([{ ...emptyPadre }, { ...emptyPadre }]);
            setRepEncontrado(false);
            setConsultandoCedula(false);
            setPadreEncontrado({ 0: false, 1: false });
            setNinosDuplicados({});
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Nueva Inscripción</h2>

            {success && (
                <div className="mb-6 p-5 bg-green-50 border-2 border-green-300 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                        <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="font-bold text-green-800">Inscripción #{success.idCabecera} completada</p>
                            <p className="text-sm text-green-700">{success.total} niño(s) inscrito(s)</p>
                        </div>
                    </div>
                    <ul className="list-disc list-inside text-sm text-green-700 ml-10">
                        {success.nombres.map((n, i) => <li key={i}>{n}</li>)}
                    </ul>
                    <button onClick={() => setSuccess(null)}
                        className="mt-3 px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                        Nueva Inscripción
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
                    <div className="flex justify-center gap-3">
                        <button onClick={() => setError(null)}
                            className="px-5 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors">
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            {!success && (
                <>
                    {/* Stepper */}
                    <div className="flex items-center mb-8">
                        {STEPS.map((s, i) => (
                            <div key={s} className="flex-1 flex items-center">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                    i <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                                }`}>{i + 1}</div>
                                <span className={`ml-2 text-sm ${i <= step ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>{s}</span>
                                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

                        {/* Step 0: Datos Familiares */}
                        {step === 0 && (
                            <div className="space-y-5">
                                {/* --- PADRE --- */}
                                <ParentSection
                                    label="Padre"
                                    data={padres[0]}
                                    onChange={(field, value) => handlePadreChange(0, field, value)}
                                    onCedulaBlur={() => handleParentCedulaBlur(0)}
                                    consultando={consultandoPadre[0]}
                                    encontrado={padreEncontrado[0]} />

                                {/* --- MADRE --- */}
                                <ParentSection
                                    label="Madre"
                                    data={padres[1]}
                                    onChange={(field, value) => handlePadreChange(1, field, value)}
                                    onCedulaBlur={() => handleParentCedulaBlur(1)}
                                    consultando={consultandoPadre[1]}
                                    encontrado={padreEncontrado[1]} />

                                {/* --- REPRESENTANTE LEGAL (manual) --- */}
                                {!padres[0].esRepresentante && !padres[1].esRepresentante && (
                                    <div className="border-t border-gray-200 pt-4">
                                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Datos del Representante Legal</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Cédula *</label>
                                                <div className="relative">
                                                    <input type="text" name="cedula" maxLength={10} value={rep.cedula} onChange={handleRepChange} onBlur={handleCedulaBlur}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                                    {consultandoCedula && (
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                                                    )}
                                                    {repEncontrado && !consultandoCedula && (
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-xs font-medium">✓</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Nombres *</label>
                                                <input type="text" name="nombres" value={repEncontrado ? maskText(rep.nombres) : rep.nombres} onChange={handleRepChange} maxLength={200}
                                                    readOnly={repEncontrado}
                                                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none transition-colors ${repEncontrado ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Apellidos *</label>
                                                <input type="text" name="apellidos" value={repEncontrado ? maskText(rep.apellidos) : rep.apellidos} onChange={handleRepChange} maxLength={200}
                                                    readOnly={repEncontrado}
                                                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none transition-colors ${repEncontrado ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`} />
                                            </div>
                                            {repEncontrado && (
                                                <div className="col-span-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                                    <svg className="h-4 w-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Persona ya registrada. Solo se solicitan cédula, nombres y apellidos.
                                                </div>
                                            )}
                                            {!repEncontrado && (
                                                <>
                                                    <Input label="Sector" name="direccion" value={rep.direccion} onChange={handleRepChange} />
                                                    <Input label="Email" name="email" type="email" value={rep.email} onChange={handleRepChange} />
                                                    <Input label="Celular" name="celular" value={rep.celular} onChange={handleRepChange} maxLength={15} />
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-600 mb-1">Estado Civil</label>
                                                        <select name="estadoCivil" value={rep.estadoCivil} onChange={handleRepChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                                                            <option value="">Seleccione</option>
                                                            <option value="Casados Civil">Casados Civil</option>
                                                            <option value="Casados Eclesiastico">Casados Eclesiástico</option>
                                                            <option value="Union Libre">Unión Libre</option>
                                                            <option value="Divorciado">Divorciado</option>
                                                            <option value="Viudo">Viudo</option>
                                                            <option value="Soltero">Soltero</option>
                                                            <option value="Otro">Otro</option>
                                                        </select>
                                                    </div>
                                                    <Input label="Ocupación" name="ocupacion" value={rep.ocupacion} onChange={handleRepChange} maxLength={200} />
                                                    <Input label="Lugar de Trabajo" name="lugarTrabajo" value={rep.lugarTrabajo} onChange={handleRepChange} maxLength={200} />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 1: Niños */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700">Niños a Inscribir</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Agregue los datos de cada niño</p>
                                </div>

                                <div className="space-y-3">
                                    {ninos.map((nino, idx) => {
                                        const edad = calcularEdad(nino.fechaNacimiento);
                                        const rango = getRangoEdad(edad);
                                        return (
                                        <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-semibold text-gray-700">Niño #{idx + 1}</span>
                                                {ninos.length > 1 && (
                                                    <button type="button" onClick={() => removeNino(idx)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-1 transition-colors" title="Quitar">
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Cédula *</label>
                                                    <input type="text" name="cedula" maxLength={10} value={nino.cedula} onChange={(e) => handleNinoChange(idx, e)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Nombres *</label>
                                                    <input type="text" name="nombres" value={nino.nombres} onChange={(e) => handleNinoChange(idx, e)} maxLength={200}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Apellidos *</label>
                                                    <input type="text" name="apellidos" value={nino.apellidos} onChange={(e) => handleNinoChange(idx, e)} maxLength={200}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Fecha Nacimiento</label>
                                                    <input type="date" name="fechaNacimiento" value={nino.fechaNacimiento} onChange={(e) => handleNinoChange(idx, e)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Sexo *</label>
                                                    <select name="sexo" value={nino.sexo} onChange={(e) => handleNinoChange(idx, e)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                                                        <option value="">Seleccione</option>
                                                        <option value="M">Masculino</option>
                                                        <option value="F">Femenino</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Alergias</label>
                                                    <input type="text" name="alergias" value={nino.alergias} onChange={(e) => handleNinoChange(idx, e)} maxLength={200}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Condiciones Médicas</label>
                                                    <input type="text" name="condicionesMedicas" value={nino.condicionesMedicas} onChange={(e) => handleNinoChange(idx, e)} maxLength={200}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                                </div>
                                            </div>
                                            <div className="col-span-2 border-t border-gray-200 pt-3 mt-2">
                                                <h5 className="text-xs font-semibold text-gray-600 mb-2">Sacramentos</h5>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Bautizado</label>
                                                        <select name="bautizado" value={nino.bautizado} onChange={(e) => handleNinoChange(idx, e)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                                                            <option value="">Seleccione</option>
                                                            <option value="true">Sí</option>
                                                            <option value="false">No</option>
                                                        </select>
                                                    </div>
                                                    {nino.bautizado === 'true' && (
                                                        <>
                                                            <Input label="Fecha Bautismo" name="bautizadoFecha" type="date" value={nino.bautizadoFecha} onChange={(e) => handleNinoChange(idx, e)} />
                                                            <Input label="Parroquia Bautismo" name="bautizadoParroquia" value={nino.bautizadoParroquia} onChange={(e) => handleNinoChange(idx, e)} />
                                                        </>
                                                    )}
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Primera Comunión</label>
                                                        <select name="eucaristia" value={nino.eucaristia} onChange={(e) => handleNinoChange(idx, e)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                                                            <option value="">Seleccione</option>
                                                            <option value="true">Sí</option>
                                                            <option value="false">No</option>
                                                        </select>
                                                    </div>
                                                    {nino.eucaristia === 'true' && (
                                                        <>
                                                            <Input label="Fecha Comunión" name="eucaristiaFecha" type="date" value={nino.eucaristiaFecha} onChange={(e) => handleNinoChange(idx, e)} />
                                                            <Input label="Parroquia Comunión" name="eucaristiaParroquia" value={nino.eucaristiaParroquia} onChange={(e) => handleNinoChange(idx, e)} />
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-span-2 border-t border-gray-200 pt-3 mt-2">
                                                <h5 className="text-xs font-semibold text-gray-600 mb-2">Catequesis</h5>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Nivel de Catequesis</label>
                                                        <select name="nivelCatequesis" value={nino.nivelCatequesis} onChange={(e) => handleNinoChange(idx, e)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                                                            <option value="">Seleccione</option>
                                                            {nivelesCatequesis.map((nc) => (
                                                                <option key={nc.id} value={nc.id}>{nc.nombre}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Turno</label>
                                                        <select name="turno" value={nino.turno} onChange={(e) => handleNinoChange(idx, e)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                                                            <option value="">Seleccione</option>
                                                            {turnos.map((t) => (
                                                                <option key={t.id} value={t.id}>{t.nombre}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <Input label="Catequista anterior" name="catequistaAnterior" value={nino.catequistaAnterior} onChange={(e) => handleNinoChange(idx, e)} />
                                                    <Input label="Parroquia anterior" name="parroquiaAnterior" value={nino.parroquiaAnterior} onChange={(e) => handleNinoChange(idx, e)} />
                                                </div>
                                            </div>
                                            <div className="col-span-2 border-t border-gray-200 pt-3 mt-2">
                                                <h5 className="text-xs font-semibold text-gray-600 mb-2">Datos Educativos</h5>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Institución Educativa</label>
                                                        <select value={fichas[idx]?.tipoInstitucion || ''} onChange={(e) => handleFichaChange(idx, 'tipoInstitucion', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                                                            <option value="">Seleccione</option>
                                                            <option value="Fiscal">Fiscal</option>
                                                            <option value="Fiscomisional">Fiscomisional</option>
                                                            <option value="Particular">Particular</option>
                                                            <option value="Municipal">Municipal</option>
                                                            <option value="Educacion en casa">Educación en casa</option>
                                                            <option value="No estudia">No estudia</option>
                                                        </select>
                                                    </div>
                                                    <Input label="Institución Educativa" name="institucionEducativa" value={fichas[idx]?.institucionEducativa || ''}
                                                        onChange={(e) => handleFichaChange(idx, 'institucionEducativa', e.target.value)} />
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Nivel Educativo</label>
                                                        <select value={fichas[idx]?.nivelEducativo || ''} onChange={(e) => handleFichaChange(idx, 'nivelEducativo', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                                                            <option value="">Seleccione</option>
                                                            <option value="Inicial">Inicial</option>
                                                            <option value="1° de basica">1° de basica</option>
                                                            <option value="2° de basica">2° de basica</option>
                                                            <option value="3° de basica">3° de basica</option>
                                                            <option value="4° de basica">4° de basica</option>
                                                            <option value="5° de basica">5° de basica</option>
                                                            <option value="6° de basica">6° de basica</option>
                                                            <option value="7° de basica">7° de basica</option>
                                                            <option value="8° de basica">8° de basica</option>
                                                            <option value="9° de basica">9° de basica</option>
                                                            <option value="10° de basica">10° de basica</option>
                                                            <option value="1° Bachillerato">1° Bachillerato</option>
                                                            <option value="2° Bachillerato">2° Bachillerato</option>
                                                            <option value="3° Bachillerato">3° Bachillerato</option>
                                                            <option value="No estudia">No estudia</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                        );
                                    })}
                                </div>

                                <button type="button" onClick={addNino}
                                    className="w-full py-2.5 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 text-sm font-medium hover:bg-blue-50 hover:border-blue-400 transition-colors flex items-center justify-center gap-2">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Agregar otro niño
                                </button>

                                {/* Summary */}
                                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <h4 className="text-sm font-semibold text-blue-800 mb-2">Resumen</h4>
                                    <p className="text-xs text-blue-700"><strong>Representante:</strong> {(() => {
                                        const r = padres[0].esRepresentante ? padres[0] : padres[1].esRepresentante ? padres[1] : rep;
                                        return `${r.nombres || ''} ${r.apellidos || ''} — CI: ${r.cedula || '—'}`;
                                    })()}</p>
                                    {padres.some(p => p.nombres.trim()) && (
                                        <p className="text-xs text-blue-700 mt-1"><strong>Padres:</strong> {padres.filter(p => p.nombres.trim()).map(p => `${p.nombres} ${p.apellidos}`).join(' / ')}</p>
                                    )}
                                    <p className="text-xs text-blue-700 mt-1"><strong>Niños:</strong></p>
                                    <ul className="list-disc list-inside text-xs text-blue-700 ml-2">
                                        {ninos.map((n, i) => {
                                            const nc = n.nivelCatequesis ? nivelesCatequesis.find(nc => nc.id === Number(n.nivelCatequesis)) : null;
                                            const tg = n.turno ? turnos.find(t => t.id === Number(n.turno)) : null;
                                            return (
                                            <li key={i}>
                                                {n.nombres} {n.apellidos} — CI: {n.cedula || '—'}
                                                {n.sexo ? ` — ${n.sexo === 'M' ? 'Masculino' : 'Femenino'}` : ''}
                                                {nc ? ` — ${nc.nombre}` : ''}
                                                {tg ? ` (${tg.nombre})` : ''}
                                            </li>
                                        );})}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Navigation buttons */}
                        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
                            <button onClick={prevStep} disabled={step === 0}
                                className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition-colors">
                                Anterior
                            </button>
                            {step < 1 ? (
                                <button onClick={nextStep}
                                    className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                                    Siguiente
                                </button>
                            ) : (
                                <button onClick={handleSubmit} disabled={loading}
                                    className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                                    {loading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
                                    {loading ? 'Guardando...' : 'Confirmar Inscripción'}
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

const estadoCivilOptions = [
    'Casados Civil', 'Casados Eclesiastico', 'Union Libre',
    'Divorciado', 'Viudo', 'Soltero', 'Otro'
];

function ParentSection({ label, data, onChange, onCedulaBlur, consultando, encontrado }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">{`Datos del ${label}`}</span>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                    <input type="checkbox" checked={data.esRepresentante}
                        onChange={() => onChange('esRepresentante', !data.esRepresentante)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    Actúa como representante legal
                </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Cédula</label>
                    <div className="relative">
                        <input type="text" value={data.cedula} onChange={(e) => onChange('cedula', onlyDigits(e.target.value))} maxLength={10}
                            onBlur={onCedulaBlur}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        {consultando && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                        )}
                        {encontrado && !consultando && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-xs font-medium">✓</span>
                        )}
                    </div>
                </div>
                <Input label="Nombres" value={data.nombres} onChange={(e) => onChange('nombres', e.target.value)} sanitize="alpha" maxLength={200} readOnly={encontrado} />
                <Input label="Apellidos" value={data.apellidos} onChange={(e) => onChange('apellidos', e.target.value)} sanitize="alpha" maxLength={200} readOnly={encontrado} />
                <Input label="Ocupación" value={data.ocupacion} onChange={(e) => onChange('ocupacion', e.target.value)} sanitize="alpha" maxLength={200} />
                <Input label="Lugar de Trabajo" value={data.lugarTrabajo} onChange={(e) => onChange('lugarTrabajo', e.target.value)} sanitize="alpha" maxLength={200} />
                <Input label="Teléfono" value={data.telefono} onChange={(e) => onChange('telefono', e.target.value)} sanitize="digit" maxLength={15} />
            </div>
            {encontrado && (
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <svg className="h-4 w-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Persona ya registrada.
                </div>
            )}
            {data.esRepresentante && (
                <div className="border-t border-gray-100 pt-3 space-y-3">
                    <span className="text-xs font-semibold text-gray-600 block">Datos del Representante Legal</span>
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Cédula *" value={data.cedula} onChange={(e) => onChange('cedula', e.target.value)} maxLength={10} />
                        <Input label="Email" type="email" value={data.email} onChange={(e) => onChange('email', e.target.value)} />
                        <Input label="Sector" value={data.direccion} onChange={(e) => onChange('direccion', e.target.value)} />
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Estado Civil</label>
                            <select value={data.estadoCivil} onChange={(e) => onChange('estadoCivil', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                                <option value="">Seleccione</option>
                                {estadoCivilOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    </div>
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
