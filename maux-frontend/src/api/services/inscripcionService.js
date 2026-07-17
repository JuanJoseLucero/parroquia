import { post } from '../apiClient';

export const inscripcionCabeceraService = {
    listar: (page = 0, size = 20) => post('/inscripcion-cabeceras/listar', { page, size }),
    listarAdmin: (page = 0, size = 20) => post('/inscripcion-cabeceras/listar-admin', { page, size }),
    obtener: (id) => post('/inscripcion-cabeceras/obtener', { id }),
    crear: (data) => post('/inscripcion-cabeceras/crear', data),
    actualizar: (data) => post('/inscripcion-cabeceras/actualizar', data),
    eliminar: (id) => post('/inscripcion-cabeceras/eliminar', { id }),
};

export const inscripcionDetalleService = {
    listarAdmin: (page = 0, size = 20) => post('/inscripcion-detalles/listar-admin', { page, size }),
    crear: (data) => post('/inscripcion-detalles/crear', data),
    eliminar: (id) => post('/inscripcion-detalles/eliminar', { id }),
};

export const pagoService = {
    listar: (page = 0, size = 20) => post('/pagos/listar', { page, size }),
    listarAdmin: (page = 0, size = 2000) => post('/pagos/listar-admin', { page, size }),
    crear: (data) => post('/pagos/crear', data),
    eliminar: (id) => post('/pagos/eliminar', { id }),
};

export const costoInscripcionService = {
    listar: () => post('/costos-inscripcion/listar', { page: 0, size: 100 }),
};

export const estadoInscripcionService = {
    listar: () => post('/estados-inscripcion/listar', { page: 0, size: 20 }),
};

export const asistenciaService = {
    listarAdmin: (page = 0, size = 2000) => post('/asistencias/listar-admin', { page, size }),
};

export const fechaCalendarioService = {
    listar: () => post('/fechas-calendario/listar', { page: 0, size: 50 }),
};

export const metodoPagoService = {
    listar: () => post('/metodos-pago/listar', { page: 0, size: 20 }),
};
