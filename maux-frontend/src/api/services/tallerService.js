import { post } from '../apiClient';

export const tallerService = {
    listar: (page = 0, size = 20) => post('/talleres/listar', { page, size }),
    listarAdmin: (page = 0, size = 20) => post('/talleres/listar-admin', { page, size }),
    obtener: (id) => post('/talleres/obtener', { id }),
    listarTodos: () => post('/talleres/listar-todos'),
    porRangoEdad: (rangoEdad, tipo = null) => post('/talleres/por-rango-edad', { rangoEdad, tipo }),
    crear: (data) => post('/talleres/crear', data),
    actualizar: (data) => post('/talleres/actualizar', data),
    eliminar: (id) => post('/talleres/eliminar', { id }),
};
