import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.PROD
  ? "/api"
  : "/maux-backend/api";

async function post(endpoint, body = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "Error desconocido");
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

const emptyNino = {
  cedula: "",
  nombres: "",
  apellidos: "",
  fechaNacimiento: "",
  sexo: "",
  alergias: "",
  condicionesMedicas: "",
  ctaller: "",
  ctaller2: "",
  bautizado: "",
  bautizadoFecha: "",
  bautizadoParroquia: "",
  eucaristia: "",
  eucaristiaFecha: "",
  eucaristiaParroquia: "",
  nivelCatequesis: "",
  turno: "",
};

const emptyFicha = { sectorResidencia: "", tipoInstitucion: "", institucionEducativa: "", nivelEducativo: "", comoConocio: "", comoConocioOtro: "" };

const emptyPadre = { nombre: "", ocupacion: "", lugarTrabajo: "", telefono: "" };

export default function InscripcionPublica() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [rep, setRep] = useState({
    cedula: "",
    nombres: "",
    apellidos: "",
    direccion: "",
    email: "",
    celular: "",
    contactoEmergenciaNombre: "",
    contactoEmergenciaTelefono: "",
    estadoCivil: "",
    ocupacion: "",
    lugarTrabajo: "",
  });
  const [ninos, setNinos] = useState([{ ...emptyNino }]);
  const [fichas, setFichas] = useState([{ ...emptyFicha }]);
  const [talleresDeportivos, setTalleresDeportivos] = useState([]);
  const [talleresAulicos, setTalleresAulicos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const handleFichaChange = (index, field, value) => {
    setFichas(prev => { const u = [...prev]; u[index] = { ...u[index], [field]: value }; return u; });
  };

  const [padres, setPadres] = useState([{ ...emptyPadre }, { ...emptyPadre }]);
  const [showPadres, setShowPadres] = useState(false);
  const [nivelesCatequesis, setNivelesCatequesis] = useState([]);
  const [turnos, setTurnos] = useState([]);

  const handlePadreChange = (index, field, value) => {
    setPadres(prev => { const u = [...prev]; u[index] = { ...u[index], [field]: value }; return u; });
  };

  const [repEncontrado, setRepEncontrado] = useState(false);
  const [consultandoCedula, setConsultandoCedula] = useState(false);
  const [ninosDuplicados, setNinosDuplicados] = useState({});
  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  const [showTermsWarning, setShowTermsWarning] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    post("/talleres/por-tipo", { tipo: "deportivo"}).then(setTalleresDeportivos).catch(() => {});
  }, []);

  useEffect(() => {
    post("/talleres/por-tipo", { tipo: "aulico"}).then(setTalleresAulicos).catch(() => {});
  }, []);

  useEffect(() => {
    post("/niveles-catequesis/listar", { page: 0, size: 100 }).then(res => setNivelesCatequesis(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    post("/turnos/listar", { page: 0, size: 100 }).then(res => setTurnos(res.data || [])).catch(() => {});
  }, []);

  const handleRepChange = (e) =>
    setRep({ ...rep, [e.target.name]: e.target.value });

  const maskText = (text) => {
    if (!text || text.length <= 2) return text || "";
    return (
      text[0] + "*".repeat(Math.min(text.length - 2, 6)) + text[text.length - 1]
    );
  };

  const handleCedulaBlur = async () => {
    const cedula = rep.cedula.trim();
    if (!cedula || cedula.length < 10) return;
    setConsultandoCedula(true);
    try {
      const res = await post("/inscripciones/buscar-por-cedula", { cedula });
      if (res.existe) {
        setRepEncontrado(true);
        setRep((prev) => ({
          ...prev,
          nombres: res.nombres,
          apellidos: res.apellidos,
        }));
      } else {
        setRepEncontrado(false);
        setRep((prev) => ({ ...prev, nombres: "", apellidos: "" }));
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
      const res = await post("/inscripciones/buscar-por-cedula", {
        cedula: cd,
      });
      setNinosDuplicados((prev) => ({
        ...prev,
        [index]: res.yaInscrito,
      }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!rep.cedula || !rep.nombres || !rep.apellidos) {
      setError(
        "Complete los datos del representante (cédula, nombres, apellidos)."
      );
      return;
    }

    if (!aceptoTerminos) {
      setShowTermsWarning(true);
      return;
    }

    setShowTermsWarning(false);

    for (let i = 0; i < ninos.length; i++) {
      const n = ninos[i];
      if (!n.cedula || !n.nombres || !n.apellidos) {
        setError(
          `Complete todos los campos del niño #${i + 1} (cédula, nombres, apellidos).`
        );
        return;
      }
      if (n.fechaNacimiento) {
        const edad = calcularEdad(n.fechaNacimiento);
        const rango = getRangoEdad(edad);
        if (!rango) {
          setError(`La edad del niño #${i + 1} debe estar entre 7 y 15 años.`);
          return;
        }
        if (!n.sexo) {
          setError(`Seleccione el sexo del niño #${i + 1}.`);
          return;
        }
        if (!n.ctaller || !n.ctaller2) {
          setError(`Seleccione ambos talleres para el niño #${i + 1}.`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const result = await post("/inscripciones/crear-completa", {
        representante: {
          cedula: rep.cedula,
          nombres: repEncontrado ? rep.nombres : rep.nombres.toUpperCase(),
          apellidos: repEncontrado
            ? rep.apellidos
            : rep.apellidos.toUpperCase(),
          direccion: rep.direccion ? rep.direccion.toUpperCase() : null,
          email: rep.email || null,
          celular: rep.celular || null,
          contactoEmergenciaNombre: rep.contactoEmergenciaNombre
            ? rep.contactoEmergenciaNombre.toUpperCase()
            : null,
          contactoEmergenciaTelefono: rep.contactoEmergenciaTelefono || null,
          estadoCivil: rep.estadoCivil || null,
          ocupacion: rep.ocupacion ? rep.ocupacion.toUpperCase() : null,
          lugarTrabajo: rep.lugarTrabajo ? rep.lugarTrabajo.toUpperCase() : null,
        },
        ninos: ninos
          .map((n, i) => ({
            cedula: n.cedula,
            nombres: n.nombres.toUpperCase(),
            apellidos: n.apellidos.toUpperCase(),
            fechaNacimiento: n.fechaNacimiento || null,
            sexo: n.sexo || null,
            alergias: n.alergias ? n.alergias.toUpperCase() : null,
            condicionesMedicas: n.condicionesMedicas
              ? n.condicionesMedicas.toUpperCase()
              : null,
            ctaller: n.ctaller
              ? Number(n.ctaller)
              : null,
            ctaller2: n.ctaller2
              ? Number(n.ctaller2)
              : null,
            bautizado: n.bautizado === "true",
            bautizadoFecha: n.bautizadoFecha || null,
            bautizadoParroquia: n.bautizadoParroquia ? n.bautizadoParroquia.toUpperCase() : null,
            eucaristia: n.eucaristia === "true",
            eucaristiaFecha: n.eucaristiaFecha || null,
            eucaristiaParroquia: n.eucaristiaParroquia ? n.eucaristiaParroquia.toUpperCase() : null,
            nivelCatequesis: n.nivelCatequesis ? Number(n.nivelCatequesis) : null,
            turno: n.turno ? Number(n.turno) : null,
          }))
          .filter((_, i) => !ninosDuplicados[i]),
        padres: padres.filter(p => p.nombre.trim() !== '').map((p, i) => ({
          tipoPadre: i === 0 ? "padre" : "madre",
          nombre: p.nombre.toUpperCase(),
          ocupacion: p.ocupacion ? p.ocupacion.toUpperCase() : null,
          lugarTrabajo: p.lugarTrabajo ? p.lugarTrabajo.toUpperCase() : null,
          telefono: p.telefono || null,
        })),
        fichas: fichas.map(f => ({
          sectorResidencia: f.sectorResidencia
            ? f.sectorResidencia.toUpperCase()
            : null,
          tipoInstitucion: f.tipoInstitucion || null,
          institucionEducativa: f.institucionEducativa
            ? f.institucionEducativa.toUpperCase()
            : null,
          nivelEducativo: f.nivelEducativo || null,
          comoConocio: f.comoConocio || null,
          comoConocioOtro: f.comoConocio === "Otros" && f.comoConocioOtro
            ? f.comoConocioOtro.toUpperCase()
            : null,
        })),
        cusuario: 1,
      });

      setSuccess({
        idCabecera: result.idCabecera,
        total: result.totalNinos,
        nombres: result.detalles.map((d) => d.nombre),
        rechazados: result.rechazados || [],
      });

      setRep({
        cedula: "",
        nombres: "",
        apellidos: "",
        direccion: "",
        email: "",
        celular: "",
        contactoEmergenciaNombre: "",
        contactoEmergenciaTelefono: "",
        estadoCivil: "",
        ocupacion: "",
        lugarTrabajo: "",
      });
      setNinos([{ ...emptyNino }]);
      setFichas([{ ...emptyFicha }]);
      setPadres([{ ...emptyPadre }, { ...emptyPadre }]);
      setRepEncontrado(false);
      setNinosDuplicados({});
      setAceptoTerminos(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    formRef.current?.requestSubmit();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="bg-blue-700 text-white py-8 text-center shadow-lg">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold tracking-tight">
            María Auxiliadora
          </h1>
          <p className="text-blue-200 mt-2 text-lg">
            Inscripción Colonias Vacacionales 2026
          </p>
          <p className="text-blue-300 text-sm mt-1">
            Complete el formulario para inscribir a los niños
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {success && (
          <div className="mb-8 p-6 bg-green-50 border-2 border-green-300 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-lg font-bold text-green-800">
                  Inscripción exitosa
                </p>
                <p className="text-sm text-green-700">
                  Inscripción #{success.idCabecera} — {success.total} niño(s)
                  inscrito(s)
                </p>
              </div>
            </div>
            <ul className="list-disc list-inside text-sm text-green-700 ml-11">
              {success.nombres.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
            {success.rechazados?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-green-200 ml-11">
                <p className="text-xs font-medium text-yellow-700 mb-1">
                  Niños no inscritos (cédula ya registrada):
                </p>
                <ul className="list-disc list-inside text-xs text-yellow-700">
                  {success.rechazados.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={() => {
                setSuccess(null);
                setRepEncontrado(false);
                setNinosDuplicados({});
                setAceptoTerminos(false);
              }}
              className="mt-4 px-5 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              Nueva Inscripción
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-6 bg-red-50 border-2 border-red-300 rounded-2xl text-center">
            <svg
              className="h-12 w-12 text-red-500 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-red-800 font-bold text-lg mb-1">
              Error de conexión
            </p>
            <p className="text-red-600 text-sm mb-5">
              No se pudo enviar la inscripción. Verifique su conexión e intente
              nuevamente.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleRetry}
                className="px-6 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                Intentar nuevamente
              </button>
              <button
                onClick={() => setError(null)}
                className="px-6 py-2.5 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {!success && (
          <form ref={formRef} onSubmit={handleSubmit}>
            {/* Representante */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Datos del Representante
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Persona responsable del niño
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Cédula *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="cedula"
                      maxLength={10}
                      value={rep.cedula}
                      onChange={handleRepChange}
                      onBlur={handleCedulaBlur}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      required
                    />
                    {consultandoCedula && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                    )}
                    {repEncontrado && !consultandoCedula && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-xs font-medium">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    name="nombres"
                    value={repEncontrado ? maskText(rep.nombres) : rep.nombres}
                    onChange={handleRepChange}
                    readOnly={repEncontrado}
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none transition-colors ${
                      repEncontrado
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    name="apellidos"
                    value={
                      repEncontrado ? maskText(rep.apellidos) : rep.apellidos
                    }
                    onChange={handleRepChange}
                    readOnly={repEncontrado}
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none transition-colors ${
                      repEncontrado
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    required
                  />
                </div>
                {repEncontrado && (
                  <div className="md:col-span-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <svg
                      className="h-4 w-4 text-green-600 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Persona ya registrada. Solo se solicitan cédula, nombres y
                    apellidos.
                  </div>
                )}
                {!repEncontrado && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Sector
                      </label>
                      <input
                        type="text"
                        name="direccion"
                        value={rep.direccion}
                        onChange={handleRepChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={rep.email}
                        onChange={handleRepChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Celular
                      </label>
                      <input
                        type="text"
                        name="celular"
                        value={rep.celular}
                        onChange={handleRepChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Estado Civil
                      </label>
                      <select
                        name="estadoCivil"
                        value={rep.estadoCivil}
                        onChange={handleRepChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-colors"
                      >
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
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Ocupación
                      </label>
                      <input
                        type="text"
                        name="ocupacion"
                        value={rep.ocupacion}
                        onChange={handleRepChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Lugar de Trabajo
                      </label>
                      <input
                        type="text"
                        name="lugarTrabajo"
                        value={rep.lugarTrabajo}
                        onChange={handleRepChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Contacto de emergencia */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Contacto de Emergencia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      name="contactoEmergenciaNombre"
                      value={rep.contactoEmergenciaNombre}
                      onChange={handleRepChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      name="contactoEmergenciaTelefono"
                      value={rep.contactoEmergenciaTelefono}
                      onChange={handleRepChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Padres */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
              <button type="button" onClick={() => setShowPadres(!showPadres)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors">
                <svg className={`h-4 w-4 transition-transform ${showPadres ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Datos del Padre y la Madre
              </button>
              {showPadres && (
                <div className="mt-4 space-y-4">
                  {['Padre', 'Madre'].map((label, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-xs font-semibold text-gray-600 mb-3 block">{label}</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
                          <input type="text" value={padres[i]?.nombre || ''} onChange={(e) => handlePadreChange(i, 'nombre', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Ocupación</label>
                          <input type="text" value={padres[i]?.ocupacion || ''} onChange={(e) => handlePadreChange(i, 'ocupacion', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Lugar de Trabajo</label>
                          <input type="text" value={padres[i]?.lugarTrabajo || ''} onChange={(e) => handlePadreChange(i, 'lugarTrabajo', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono</label>
                          <input type="text" value={padres[i]?.telefono || ''} onChange={(e) => handlePadreChange(i, 'telefono', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Niños */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                Niños a Inscribir
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Agregue los datos de cada niño
              </p>

              <div className="space-y-4">
                {ninos.map((nino, idx) => {
                  const edad = calcularEdad(nino.fechaNacimiento);
                  const rango = getRangoEdad(edad);
                  return (
                    <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-700">Niño #{idx + 1}</span>
                        {ninos.length > 1 && (
                          <button type="button" onClick={() => removeNino(idx)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-1 transition-colors" title="Quitar niño">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Cédula *</label>
                          <input type="text" name="cedula" maxLength={10} value={nino.cedula}
                            onChange={(e) => handleNinoChange(idx, e)}
                            onBlur={(e) => handleNinoCedulaBlur(idx, e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${ninosDuplicados[idx] ? "border-yellow-400 bg-yellow-50" : "border-gray-300"}`} required />
                          {ninosDuplicados[idx] && (
                            <p className="text-xs text-yellow-700 mt-1 flex items-center gap-1">
                              <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              Tenemos problemas para procesar esta identificación
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Nombres *</label>
                          <input type="text" name="nombres" value={nino.nombres} onChange={(e) => handleNinoChange(idx, e)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Apellidos *</label>
                          <input type="text" name="apellidos" value={nino.apellidos} onChange={(e) => handleNinoChange(idx, e)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Fecha Nacimiento</label>
                          <input type="date" name="fechaNacimiento" value={nino.fechaNacimiento} onChange={(e) => handleNinoChange(idx, e)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      <div className="md:col-span-2 grid grid-cols-2 gap-3">
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
                      <div className="md:col-span-2 border-t border-gray-200 pt-3 mt-2">
                        <h5 className="text-xs font-semibold text-gray-600 mb-2">Sacramentos</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Fecha Bautismo</label>
                                <input type="date" name="bautizadoFecha" value={nino.bautizadoFecha} onChange={(e) => handleNinoChange(idx, e)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Parroquia Bautismo</label>
                                <input type="text" name="bautizadoParroquia" value={nino.bautizadoParroquia} onChange={(e) => handleNinoChange(idx, e)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                              </div>
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
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Fecha Comunión</label>
                                <input type="date" name="eucaristiaFecha" value={nino.eucaristiaFecha} onChange={(e) => handleNinoChange(idx, e)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Parroquia Comunión</label>
                                <input type="text" name="eucaristiaParroquia" value={nino.eucaristiaParroquia} onChange={(e) => handleNinoChange(idx, e)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="md:col-span-2 border-t border-gray-200 pt-3 mt-2">
                        <h5 className="text-xs font-semibold text-gray-600 mb-2">Catequesis</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                        </div>
                      </div>
                      <div className="md:col-span-2 border-t border-gray-200 pt-3 mt-2">
                        <h5 className="text-xs font-semibold text-gray-600 mb-2">Ficha Sociodemográfica del Niño</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Sector de Residencia</label>
                            <input type="text" value={fichas[idx]?.sectorResidencia || ''}
                              onChange={(e) => handleFichaChange(idx, 'sectorResidencia', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                          </div>
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
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Institución Educativa</label>
                            <input type="text" value={fichas[idx]?.institucionEducativa || ''}
                              onChange={(e) => handleFichaChange(idx, 'institucionEducativa', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                          </div>
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
                            <select value={fichas[idx]?.comoConocio || ''} onChange={(e) => {
                              handleFichaChange(idx, 'comoConocio', e.target.value);
                              if (e.target.value !== "Otros") handleFichaChange(idx, 'comoConocioOtro', '');
                            }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                              <option value="">Seleccione</option>
                              <option value="Redes sociales">Redes sociales</option>
                              <option value="Contacto">Contacto</option>
                              <option value="Publicidad">Publicidad</option>
                              <option value="Parroquia">Parroquia</option>
                              <option value="Otros">Otros</option>
                            </select>
                            {(fichas[idx]?.comoConocio || '') === "Otros" && (
                              <input type="text" value={fichas[idx]?.comoConocioOtro || ''}
                                onChange={(e) => handleFichaChange(idx, 'comoConocioOtro', e.target.value)}
                                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={addNino}
                className="mt-4 w-full py-3 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 text-sm font-medium hover:bg-blue-50 hover:border-blue-400 transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Agregar otro niño
              </button>
            </div>



            {/* Contacto del Oratorio */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                Contacto del Oratorio
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Celular:</strong> +593 99 241 5352
              </p>
              <p className="text-sm text-gray-600">
                <strong>Correo:</strong> ocjmacuenca@gmail.com
              </p>
            </div>

            {/* Términos y Condiciones */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aceptoTerminos}
                  onChange={(e) => { setAceptoTerminos(e.target.checked); setShowTermsWarning(false); }}
                  className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  He leído y acepto los{" "}
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="text-blue-600 underline hover:text-blue-800 font-medium"
                  >
                    Términos y Condiciones
                  </button>{" "}
                  del tratamiento de datos personales.
                </span>
              </label>
              {showTermsWarning && (
                <p className="mt-3 text-xs text-red-600 flex items-center gap-1">
                  <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Debe aceptar los Términos y Condiciones para continuar.
                </p>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : null}
                {loading ? "Enviando..." : "Enviar Inscripción"}
              </button>
            </div>
          </form>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-gray-400">
        Iglesia María Auxiliadora — Colonias Vacacionales 2026
      </footer>

      {/* Modal Términos y Condiciones */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">
                Términos y Condiciones
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-4">
              <h4 className="font-bold text-gray-800">
                Política de Tratamiento de Datos Personales
              </h4>
              <p>
                La Parroquia María Auxiliadora, en cumplimiento de la legislación vigente sobre protección de datos personales, informa a los titulares de los datos el siguiente tratamiento:
              </p>
              <h5 className="font-semibold text-gray-700">1. Responsable del Tratamiento</h5>
              <p>
                Parroquia María Auxiliadora, con domicilio en la comunidad, es la responsable del tratamiento de los datos personales que usted proporcione a través de este formulario de inscripción.
              </p>
              <h5 className="font-semibold text-gray-700">2. Finalidad del Tratamiento</h5>
              <p>
                Los datos personales recopilados (cédula, nombres, apellidos, dirección, correo electrónico, teléfono y fecha de nacimiento) serán utilizados exclusivamente para:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Gestión de inscripciones a las Colonias Vacacionales 2026</li>
                <li>Control de asistencia de los participantes</li>
                <li>Comunicación con padres o representantes durante el evento</li>
                <li>Elaboración de informes internos de la parroquia</li>
              </ul>
              <h5 className="font-semibold text-gray-700">3. Confidencialidad y Seguridad</h5>
              <p>
                La Parroquia María Auxiliadora se compromete a mantener la confidencialidad de los datos proporcionados. Se implementan medidas técnicas y organizativas para evitar el acceso no autorizado, la alteración, pérdida o divulgación indebida de la información.
              </p>
              <h5 className="font-semibold text-gray-700">4. No Cesión a Terceros</h5>
              <p>
                Los datos personales no serán cedidos, vendidos ni compartidos con terceros ajenos a la Parroquia María Auxiliadora, salvo obligación legal expresa.
              </p>
              <h5 className="font-semibold text-gray-700">5. Período de Conservación</h5>
              <p>
                Los datos serán conservados durante el tiempo necesario para cumplir con la finalidad para la cual fueron recopilados y durante el plazo establecido por la normativa aplicable.
              </p>
              <h5 className="font-semibold text-gray-700">6. Derechos del Titular</h5>
              <p>
                Usted tiene derecho a acceder, rectificar, cancelar y oponerse al tratamiento de sus datos personales, así como a revocar el consentimiento otorgado, dirigiéndose a la secretaría de la Parroquia María Auxiliadora.
              </p>
              <h5 className="font-semibold text-gray-700">7. Consentimiento</h5>
              <p>
                Al marcar la casilla de aceptación y enviar este formulario, usted declara haber leído y comprendido los presentes términos, y otorga su consentimiento expreso para el tratamiento de sus datos personales conforme a lo aquí establecido.
              </p>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  setAceptoTerminos(true);
                  setShowModal(false);
                }}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Aceptar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
