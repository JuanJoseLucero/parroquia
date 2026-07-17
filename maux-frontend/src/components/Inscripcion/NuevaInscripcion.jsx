import { useState, useRef, useEffect } from 'react';

const API_BASE = import.meta.env.PROD
    ? '/api'
    : '/maux-backend/api';

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

const STEPS = ['Representante', 'Niños'];
const emptyNino = { cedula: '', nombres: '', apellidos: '', fechaNacimiento: '', sexo: '', alergias: '', condicionesMedicas: '', ctaller: '', ctaller2: '' };
const emptyFicha = { sectorResidencia: '', tipoInstitucion: '', institucionEducativa: '', nivelEducativo: '', comoConocio: '', comoConocioOtro: '' };

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

    const [rep, setRep] = useState({ cedula: '', nombres: '', apellidos: '', direccion: '', email: '', celular: '', contactoEmergenciaNombre: '', contactoEmergenciaTelefono: '' });
    const [ninos, setNinos] = useState([{ ...emptyNino }]);
    const [fichas, setFichas] = useState([{ ...emptyFicha }]);
    const [talleresDeportivos, setTalleresDeportivos] = useState([]);
    const [talleresAulicos, setTalleresAulicos] = useState([]);
    const handleFichaChange = (index, field, value) => {
        setFichas(prev => { const u = [...prev]; u[index] = { ...u[index], [field]: value }; return u; });
    };

    const [repEncontrado, setRepEncontrado] = useState(false);
    const [consultandoCedula, setConsultandoCedula] = useState(false);
    const [ninosDuplicados, setNinosDuplicados] = useState({});

    useEffect(() => {
        post("/talleres/por-tipo", { tipo: "deportivo"}).then(setTalleresDeportivos).catch(() => {});
      }, []);
    
      useEffect(() => {
        post("/talleres/por-tipo", { tipo: "aulico"}).then(setTalleresAulicos).catch(() => {});
      }, []);

    const handleRepChange = (e) => {
        if (e.target.name === 'cedula') setRepEncontrado(false);
        setRep({ ...rep, [e.target.name]: e.target.value });
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
        updated[index] = { ...updated[index], [name]: value };

        setNinos(updated);
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
            if (!rep.cedula || !rep.nombres || !rep.apellidos) {
                setError('Cédula, nombres y apellidos del representante son requeridos.');
                return;
            }
        }
        setStep(step + 1);
    };

    const prevStep = () => setStep(Math.max(0, step - 1));

    const handleSubmit = async () => {
        setError(null);
        setSuccess(null);

        for (let i = 0; i < ninos.length; i++) {
            const n = ninos[i];
            if (!n.cedula || !n.nombres || !n.apellidos) {
                setError(`Complete todos los campos del niño #${i + 1} (cédula, nombres, apellidos).`);
                return;
            }
            if (!n.ctaller || !n.ctaller2) {
                setError(`Seleccione ambos talleres para el niño #${i + 1}.`);
                return;
            }
        }

        setLoading(true);
        try {
            const result = await post('/inscripciones/crear-completa', {
                representante: {
                    cedula: rep.cedula,
                    nombres: rep.nombres.toUpperCase(),
                    apellidos: rep.apellidos.toUpperCase(),
                    direccion: rep.direccion ? rep.direccion.toUpperCase() : null,
                    email: rep.email || null,
                    celular: rep.celular || null,
                    contactoEmergenciaNombre: rep.contactoEmergenciaNombre
                        ? rep.contactoEmergenciaNombre.toUpperCase() : null,
                    contactoEmergenciaTelefono: rep.contactoEmergenciaTelefono || null,
                },
                ninos: ninos.map(n => ({
                    cedula: n.cedula,
                    nombres: n.nombres.toUpperCase(),
                    apellidos: n.apellidos.toUpperCase(),
                    fechaNacimiento: n.fechaNacimiento || null,
                    sexo: n.sexo || null,
                    alergias: n.alergias ? n.alergias.toUpperCase() : null,
                    condicionesMedicas: n.condicionesMedicas ? n.condicionesMedicas.toUpperCase() : null,
                    ctaller: n.ctaller ? Number(n.ctaller) : null,
                    ctaller2: n.ctaller2 ? Number(n.ctaller2) : null,
                })),
                fichas: fichas.map(f => ({
                    sectorResidencia: f.sectorResidencia ? f.sectorResidencia.toUpperCase() : null,
                    tipoInstitucion: f.tipoInstitucion || null,
                    institucionEducativa: f.institucionEducativa ? f.institucionEducativa.toUpperCase() : null,
                    nivelEducativo: f.nivelEducativo || null,
                    comoConocio: f.comoConocio || null,
                    comoConocioOtro: f.comoConocio === "Otros" && f.comoConocioOtro ? f.comoConocioOtro.toUpperCase() : null,
                })),
                cusuario: 1,
            });

            setSuccess({
                idCabecera: result.idCabecera,
                total: result.totalNinos,
                nombres: result.detalles.map(d => d.nombre),
            });
            setStep(0);
            setRep({ cedula: '', nombres: '', apellidos: '', direccion: '', email: '', celular: '', contactoEmergenciaNombre: '', contactoEmergenciaTelefono: '' });
            setNinos([{ ...emptyNino }]);
            setFichas([{ ...emptyFicha }]);
            setRepEncontrado(false);
            setConsultandoCedula(false);
            setNinosDuplicados({});
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        setError(null);
        handleSubmit();
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
                    <p className="text-red-800 font-bold mb-1">Error de conexión</p>
                    <p className="text-red-600 text-sm mb-4">No se pudo enviar la inscripción. Verifique su conexión e intente nuevamente.</p>
                    <div className="flex justify-center gap-3">
                        <button onClick={handleRetry}
                            className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors">
                            Intentar nuevamente
                        </button>
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

                        {/* Step 0: Representante */}
                        {step === 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-700">Datos del Representante</h3>
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
                                        <input type="text" name="nombres" value={repEncontrado ? maskText(rep.nombres) : rep.nombres} onChange={handleRepChange}
                                            readOnly={repEncontrado}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none transition-colors ${repEncontrado ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Apellidos *</label>
                                        <input type="text" name="apellidos" value={repEncontrado ? maskText(rep.apellidos) : rep.apellidos} onChange={handleRepChange}
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
                                            <Input label="Celular" name="celular" value={rep.celular} onChange={handleRepChange} />
                                        </>
                                    )}
                                </div>
                                <div className="border-t border-gray-100 pt-4">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Contacto de Emergencia</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Nombre" name="contactoEmergenciaNombre" value={rep.contactoEmergenciaNombre} onChange={handleRepChange} />
                                        <Input label="Teléfono" name="contactoEmergenciaTelefono" value={rep.contactoEmergenciaTelefono} onChange={handleRepChange} />
                                    </div>
                                </div>
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
                                                    <input type="text" name="nombres" value={nino.nombres} onChange={(e) => handleNinoChange(idx, e)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Apellidos *</label>
                                                    <input type="text" name="apellidos" value={nino.apellidos} onChange={(e) => handleNinoChange(idx, e)}
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
                                                    <input type="text" name="alergias" value={nino.alergias} onChange={(e) => handleNinoChange(idx, e)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Condiciones Médicas</label>
                                                    <input type="text" name="condicionesMedicas" value={nino.condicionesMedicas} onChange={(e) => handleNinoChange(idx, e)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                                </div>
                                            </div>
                                            <div className="col-span-2 grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Taller deportivo *</label>
                                                    <select name="ctaller" value={nino.ctaller} onChange={(e) => handleNinoChange(idx, e)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                                                        <option value="">Seleccione</option>
                                                        {talleresDeportivos.filter((t) => t.activo).map((t) => (
                                                            <option key={t.id} value={t.id}>{t.siglas} — {t.nombre}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Taller áulico *</label>
                                                    <select name="ctaller2" value={nino.ctaller2} onChange={(e) => handleNinoChange(idx, e)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                                                        <option value="">Seleccione</option>
                                                        {talleresAulicos.filter((t) => t.activo).map((t) => (
                                                            <option key={t.id} value={t.id}>{t.siglas} — {t.nombre}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-span-2 border-t border-gray-200 pt-3 mt-2">
                                                <h5 className="text-xs font-semibold text-gray-600 mb-2">Ficha Sociodemográfica del Niño</h5>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Input label="Sector de Residencia" name="sectorResidencia" value={fichas[idx]?.sectorResidencia || ''}
                                                        onChange={(e) => handleFichaChange(idx, 'sectorResidencia', e.target.value)} />
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
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">¿Cómo conoció el Oratorio?</label>
                                                        <select value={fichas[idx]?.comoConocio || ''} onChange={(e) => handleFichaChange(idx, 'comoConocio', e.target.value === "Otros" ? e.target.value : e.target.value)}
                                                            onBlur={(e) => { if (e.target.value !== "Otros") handleFichaChange(idx, 'comoConocioOtro', ''); }}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                                                            <option value="">Seleccione</option>
                                                            <option value="Redes sociales">Redes sociales</option>
                                                            <option value="Contacto">Contacto</option>
                                                            <option value="Publicidad">Publicidad</option>
                                                            <option value="Parroquia">Parroquia</option>
                                                            <option value="Otros">Otros</option>
                                                        </select>
                                                        {(fichas[idx]?.comoConocio || '') === "Otros" && (
                                                            <input type="text" value={fichas[idx]?.comoConocioOtro || ''} onChange={(e) => handleFichaChange(idx, 'comoConocioOtro', e.target.value)}
                                                                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                                        )}
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
                                    <p className="text-xs text-blue-700"><strong>Representante:</strong> {rep.nombres} {rep.apellidos} — CI: {rep.cedula}</p>
                                    {rep.contactoEmergenciaNombre && (
                                        <p className="text-xs text-blue-700"><strong>Contacto emergencia:</strong> {rep.contactoEmergenciaNombre} — {rep.contactoEmergenciaTelefono}</p>
                                    )}
                                    <p className="text-xs text-blue-700 mt-1"><strong>Niños:</strong></p>
                                    <ul className="list-disc list-inside text-xs text-blue-700 ml-2">
                                        {ninos.map((n, i) => {
                                            const t1 = n.ctaller ? talleres.find(t => t.id === Number(n.ctaller)) : null;
                                            const t2 = n.ctaller2 ? talleres.find(t => t.id === Number(n.ctaller2)) : null;
                                            return (
                                            <li key={i}>
                                                {n.nombres} {n.apellidos} — CI: {n.cedula || '—'}
                                                {n.sexo ? ` — ${n.sexo === 'M' ? 'Masculino' : 'Femenino'}` : ''}
                                                {t1 ? ` — ${t1.siglas}` : ''}{t2 ? ` + ${t2.siglas}` : ''}
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

function Input({ label, name, type = 'text', value, onChange, maxLength }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                maxLength={maxLength}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
        </div>
    );
}
