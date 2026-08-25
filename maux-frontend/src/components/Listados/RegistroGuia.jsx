import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { personaService, guiaService, representanteService, nivelCatequesisService } from '../../api/services/personaService';

const emptyForm = {
    cedula: '',
    nombres: '',
    apellidos: '',
    fechaNacimiento: '',
    estadoCivil: '',
    direccion: '',
    barrio: '',
    celular: '',
    email: '',
    nombrePadre: '',
    nombreMadre: '',
    bautizado: false,
    bautizadoFecha: '',
    primeraComunionFecha: '',
    confirmacionFecha: '',
    matrimonio: false,
    matrimonioFecha: '',
    parroquia: '',
    grupoMovimiento: '',
    aniosExperiencia: '',
    cnivelCatequesis: '',
    disponibilidadHorario: '',
    tipoSangre: '',
    alergiasEnfermedades: '',
    contactoEmergenciaNombre: '',
    contactoEmergenciaTelefono: '',
    aceptaReglamento: false,
    autorizaDatos: false,
    autorizaFotos: false,
};

const emptyRep = { nombres: '', apellidos: '', celular: '' };

const TIPOS_SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ESTADOS_CIVILES = ['Soltero', 'Casado', 'Unión Libre', 'Divorciado', 'Viudo'];

const up = (v) => {
    const t = v?.trim();
    return t ? t.toUpperCase() : null;
};

function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nac = new Date(fechaNacimiento + 'T12:00:00');
    let edad = hoy.getFullYear() - nac.getFullYear();
    const mes = hoy.getMonth() - nac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
}

function Seccion({ titulo, children }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-4">{titulo}</h3>
            {children}
        </div>
    );
}

function Campo({ label, required, children }) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
                {label}{required && <span className="text-red-500"> *</span>}
            </label>
            {children}
        </div>
    );
}

export default function RegistroGuia() {
    const { id } = useParams();
    const navigate = useNavigate();
    const esEdicion = Boolean(id);

    const [form, setForm] = useState(emptyForm);
    const [rep, setRep] = useState(emptyRep);
    const [repOriginal, setRepOriginal] = useState(null);
    const [niveles, setNiveles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        nivelCatequesisService.listar().then(res => setNiveles(res?.data || [])).catch(() => {});
    }, []);

    useEffect(() => {
        if (!esEdicion) return;
        setLoading(true);
        (async () => {
            try {
                const guia = await guiaService.obtener(Number(id));
                const persona = guia.cpersona ? await personaService.obtener(guia.cpersona).catch(() => null) : null;
                const f = {
                    ...emptyForm,
                    cedula: persona?.cedula || '',
                    nombres: persona?.nombres || '',
                    apellidos: persona?.apellidos || '',
                    fechaNacimiento: persona?.fechaNacimiento || '',
                    estadoCivil: persona?.estadoCivil || '',
                    direccion: persona?.direccion || '',
                    barrio: persona?.barrio || '',
                    celular: persona?.celular || '',
                    email: persona?.email || '',
                    nombrePadre: guia.nombrePadre || '',
                    nombreMadre: guia.nombreMadre || '',
                    bautizado: !!guia.bautizado,
                    bautizadoFecha: guia.bautizadoFecha || '',
                    primeraComunionFecha: guia.primeraComunionFecha || '',
                    confirmacionFecha: guia.confirmacionFecha || '',
                    matrimonio: !!guia.matrimonio,
                    matrimonioFecha: guia.matrimonioFecha || '',
                    parroquia: guia.parroquia || '',
                    grupoMovimiento: guia.grupoMovimiento || '',
                    aniosExperiencia: guia.aniosExperiencia ?? '',
                    cnivelCatequesis: guia.cnivelCatequesis ?? '',
                    disponibilidadHorario: guia.disponibilidadHorario || '',
                    tipoSangre: guia.tipoSangre || '',
                    alergiasEnfermedades: guia.alergiasEnfermedades || '',
                    contactoEmergenciaNombre: guia.contactoEmergenciaNombre || '',
                    contactoEmergenciaTelefono: guia.contactoEmergenciaTelefono || '',
                    aceptaReglamento: !!guia.aceptaReglamento,
                    autorizaDatos: !!guia.autorizaDatos,
                    autorizaFotos: !!guia.autorizaFotos,
                };
                setForm(f);
                if (guia.crepresentante) {
                    const r = await representanteService.obtener(guia.crepresentante).catch(() => null);
                    if (r?.cpersona) {
                        const rp = await personaService.obtener(r.cpersona).catch(() => null);
                        if (rp) {
                            const datos = { nombres: rp.nombres || '', apellidos: rp.apellidos || '', celular: rp.celular || '' };
                            setRep(datos);
                            setRepOriginal(datos);
                        }
                    }
                }
            } catch (e) {
                setError('No se pudo cargar la ficha del catequista');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, esEdicion]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleRepChange = (e) => {
        setRep(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const edad = calcularEdad(form.fechaNacimiento);
    const esMenor = edad !== null && edad < 18;
    const repConDatos = rep.nombres.trim() !== '' || rep.apellidos.trim() !== '' || rep.celular.trim() !== '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!form.nombres.trim() || !form.apellidos.trim()) {
            setError('Nombres y apellidos son obligatorios');
            return;
        }
        if (esMenor && !rep.nombres.trim()) {
            setError('El catequista es menor de edad: ingrese nombre del representante');
            return;
        }
        if (esMenor && !rep.celular.trim()) {
            setError('El catequista es menor de edad: ingrese teléfono del representante');
            return;
        }
        if (!form.aceptaReglamento || !form.autorizaDatos) {
            setError('Debe aceptar el reglamento y la autorización de tratamiento de datos personales');
            return;
        }

        const persona = {
            cedula: form.cedula.trim() || null,
            nombres: up(form.nombres),
            apellidos: up(form.apellidos),
            direccion: up(form.direccion),
            barrio: up(form.barrio),
            email: form.email.trim() || null,
            celular: form.celular.trim() || null,
            fechaNacimiento: form.fechaNacimiento || null,
            aniosCumplidos: edad ?? 0,
            estadoCivil: form.estadoCivil || null,
        };

        const ficha = {
            nombrePadre: up(form.nombrePadre),
            nombreMadre: up(form.nombreMadre),
            bautizado: form.bautizado,
            bautizadoFecha: form.bautizadoFecha || null,
            primeraComunionFecha: form.primeraComunionFecha || null,
            confirmacionFecha: form.confirmacionFecha || null,
            matrimonio: form.matrimonio,
            matrimonioFecha: form.matrimonioFecha || null,
            parroquia: up(form.parroquia),
            grupoMovimiento: up(form.grupoMovimiento),
            aniosExperiencia: form.aniosExperiencia === '' ? null : Number(form.aniosExperiencia),
            cnivelCatequesis: form.cnivelCatequesis ? Number(form.cnivelCatequesis) : null,
            disponibilidadHorario: up(form.disponibilidadHorario),
            tipoSangre: form.tipoSangre || null,
            alergiasEnfermedades: up(form.alergiasEnfermedades),
            contactoEmergenciaNombre: up(form.contactoEmergenciaNombre),
            contactoEmergenciaTelefono: form.contactoEmergenciaTelefono.trim() || null,
            aceptaReglamento: form.aceptaReglamento,
            autorizaDatos: form.autorizaDatos,
            autorizaFotos: form.autorizaFotos,
        };

        let representante = null;
        const repModificado = !repOriginal || JSON.stringify(rep) !== JSON.stringify(repOriginal);
        if (repConDatos && (!esEdicion || repModificado)) {
            representante = {
                nombres: up(rep.nombres),
                apellidos: up(rep.apellidos),
                celular: rep.celular.trim() || null,
            };
        }

        setSaving(true);
        try {
            if (esEdicion) {
                await guiaService.actualizar({ id: Number(id), persona, ...(representante ? { representante } : {}) , ...ficha });
            } else {
                await guiaService.crear({ persona, ...(representante ? { representante } : {}), ...ficha });
            }
            navigate('/guias');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-gray-400">Cargando ficha...</div>;
    }

    const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";
    const checkCls = "h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500";

    return (
        <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    {esEdicion ? 'Editar Ficha de Catequista' : 'Registrar Nuevo Catequista'}
                </h2>
                <button onClick={() => navigate('/guias')}
                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Volver</button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
            )}

            <form onSubmit={handleSubmit}>
                <Seccion titulo="Datos Personales">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Campo label="Cédula">
                            <input type="text" name="cedula" maxLength={10} value={form.cedula} onChange={handleChange} className={inputCls} />
                        </Campo>
                        <Campo label="Estado Civil">
                            <select name="estadoCivil" value={form.estadoCivil} onChange={handleChange} className={`${inputCls} bg-white`}>
                                <option value="">Seleccione</option>
                                {ESTADOS_CIVILES.map(ec => <option key={ec} value={ec}>{ec}</option>)}
                            </select>
                        </Campo>
                        <Campo label="Nombres" required>
                            <input type="text" name="nombres" value={form.nombres} onChange={handleChange} className={inputCls} required />
                        </Campo>
                        <Campo label="Apellidos" required>
                            <input type="text" name="apellidos" value={form.apellidos} onChange={handleChange} className={inputCls} required />
                        </Campo>
                        <Campo label="Fecha de Nacimiento">
                            <input type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} className={inputCls} />
                        </Campo>
                        <Campo label="Edad">
                            <input type="text" value={edad !== null ? `${edad} años${esMenor ? ' (menor de edad)' : ''}` : ''} readOnly
                                className={`${inputCls} bg-gray-100 text-gray-500`} />
                        </Campo>
                        <Campo label="Dirección Domiciliaria">
                            <input type="text" name="direccion" value={form.direccion} onChange={handleChange} className={inputCls} />
                        </Campo>
                        <Campo label="Barrio o Sector">
                            <input type="text" name="barrio" value={form.barrio} onChange={handleChange} className={inputCls} />
                        </Campo>
                        <Campo label="Teléfono Celular">
                            <input type="text" name="celular" maxLength={10} value={form.celular} onChange={handleChange} className={inputCls} />
                        </Campo>
                        <Campo label="Correo Electrónico">
                            <input type="email" name="email" value={form.email} onChange={handleChange} className={inputCls} />
                        </Campo>
                    </div>
                </Seccion>

                <Seccion titulo="Información Familiar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Campo label="Nombre del Padre">
                            <input type="text" name="nombrePadre" value={form.nombrePadre} onChange={handleChange} className={inputCls} />
                        </Campo>
                        <Campo label="Nombre de la Madre">
                            <input type="text" name="nombreMadre" value={form.nombreMadre} onChange={handleChange} className={inputCls} />
                        </Campo>
                    </div>
                    {(esMenor || repConDatos) && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-600 mb-3">
                                Representante {esMenor && <span className="text-red-500">(obligatorio por ser menor de edad)</span>}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Campo label="Nombres" required={esMenor}>
                                    <input type="text" name="nombres" value={rep.nombres} onChange={handleRepChange} className={inputCls} required={esMenor} />
                                </Campo>
                                <Campo label="Apellidos">
                                    <input type="text" name="apellidos" value={rep.apellidos} onChange={handleRepChange} className={inputCls} />
                                </Campo>
                                <Campo label="Teléfono" required={esMenor}>
                                    <input type="text" name="celular" maxLength={10} value={rep.celular} onChange={handleRepChange} className={inputCls} required={esMenor} />
                                </Campo>
                            </div>
                        </div>
                    )}
                </Seccion>

                <Seccion titulo="Información Sacramental">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" name="bautizado" checked={form.bautizado} onChange={handleChange} className={checkCls} />
                                Bautismo
                            </label>
                            {form.bautizado && (
                                <input type="date" name="bautizadoFecha" value={form.bautizadoFecha} onChange={handleChange} className={`${inputCls} max-w-xs`} />
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Campo label="Fecha Primera Comunión">
                                <input type="date" name="primeraComunionFecha" value={form.primeraComunionFecha} onChange={handleChange} className={inputCls} />
                            </Campo>
                            <Campo label="Fecha Confirmación">
                                <input type="date" name="confirmacionFecha" value={form.confirmacionFecha} onChange={handleChange} className={inputCls} />
                            </Campo>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" name="matrimonio" checked={form.matrimonio} onChange={handleChange} className={checkCls} />
                                Matrimonio
                            </label>
                            {form.matrimonio && (
                                <input type="date" name="matrimonioFecha" value={form.matrimonioFecha} onChange={handleChange} className={`${inputCls} max-w-xs`} />
                            )}
                        </div>
                    </div>
                </Seccion>

                <Seccion titulo="Información Pastoral">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Campo label="Parroquia a la que pertenece">
                            <input type="text" name="parroquia" value={form.parroquia} onChange={handleChange} className={inputCls} />
                        </Campo>
                        <Campo label="Grupo o movimiento (si aplica)">
                            <input type="text" name="grupoMovimiento" value={form.grupoMovimiento} onChange={handleChange} className={inputCls} />
                        </Campo>
                        <Campo label="Años de experiencia como catequista">
                            <input type="number" min="0" name="aniosExperiencia" value={form.aniosExperiencia} onChange={handleChange} className={inputCls} />
                        </Campo>
                        <Campo label="Nivel de catequesis que sirve o desea servir">
                            <select name="cnivelCatequesis" value={form.cnivelCatequesis} onChange={handleChange} className={`${inputCls} bg-white`}>
                                <option value="">Seleccione</option>
                                {niveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                            </select>
                        </Campo>
                    </div>
                    <div className="mt-4">
                        <Campo label="Disponibilidad de horario">
                            <textarea name="disponibilidadHorario" rows={2} value={form.disponibilidadHorario} onChange={handleChange}
                                placeholder="Ej: Sábados de 9h00 a 12h00" className={inputCls} />
                        </Campo>
                    </div>
                </Seccion>

                <Seccion titulo="Información de Salud">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Campo label="Tipo de Sangre (opcional)">
                            <select name="tipoSangre" value={form.tipoSangre} onChange={handleChange} className={`${inputCls} bg-white`}>
                                <option value="">Seleccione</option>
                                {TIPOS_SANGRE.map(ts => <option key={ts} value={ts}>{ts}</option>)}
                            </select>
                        </Campo>
                        <Campo label="Contacto de Emergencia">
                            <input type="text" name="contactoEmergenciaNombre" value={form.contactoEmergenciaNombre} onChange={handleChange} className={inputCls} />
                        </Campo>
                        <Campo label="Teléfono de Emergencia">
                            <input type="text" name="contactoEmergenciaTelefono" maxLength={10} value={form.contactoEmergenciaTelefono} onChange={handleChange} className={inputCls} />
                        </Campo>
                    </div>
                    <div className="mt-4">
                        <Campo label="Alergias o enfermedades importantes">
                            <textarea name="alergiasEnfermedades" rows={2} value={form.alergiasEnfermedades} onChange={handleChange} className={inputCls} />
                        </Campo>
                    </div>
                </Seccion>

                <Seccion titulo="Autorizaciones">
                    <div className="space-y-3">
                        <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" name="aceptaReglamento" checked={form.aceptaReglamento} onChange={handleChange} className={`mt-0.5 ${checkCls}`} />
                            <span>Acepto el reglamento del servicio de catequesis <span className="text-red-500">*</span></span>
                        </label>
                        <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" name="autorizaDatos" checked={form.autorizaDatos} onChange={handleChange} className={`mt-0.5 ${checkCls}`} />
                            <span>Autorizo el tratamiento de mis datos personales <span className="text-red-500">*</span></span>
                        </label>
                        <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" name="autorizaFotos" checked={form.autorizaFotos} onChange={handleChange} className={`mt-0.5 ${checkCls}`} />
                            <span>Autorizo el uso de fotografías y videos en actividades pastorales</span>
                        </label>
                    </div>
                </Seccion>

                <div className="flex justify-end gap-3 mb-8">
                    <button type="button" onClick={() => navigate('/guias')}
                        className="px-5 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                    <button type="submit" disabled={saving}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        {saving ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Registrar Catequista'}
                    </button>
                </div>
            </form>
        </div>
    );
}
