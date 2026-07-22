import { post } from '../apiClient';

export const padreService = {
    listar: (page = 0, size = 20) => post('/padres/listar', { page, size }),
    listarAdmin: (page = 0, size = 20) => post('/padres/listar-admin', { page, size }),
    obtener: (id) => post('/padres/obtener', { id }),
    crear: (data) => post('/padres/crear', data),
    actualizar: (data) => post('/padres/actualizar', data),
    eliminar: (id) => post('/padres/eliminar', { id }),
};

export const sacramentoService = {
    listar: (page = 0, size = 20) => post('/sacramentos/listar', { page, size }),
    obtener: (id) => post('/sacramentos/obtener', { id }),
    crear: (data) => post('/sacramentos/crear', data),
    actualizar: (data) => post('/sacramentos/actualizar', data),
};

export const nivelCatequesisService = {
    listar: (page = 0, size = 100) => post('/niveles-catequesis/listar', { page, size }),
    obtener: (id) => post('/niveles-catequesis/obtener', { id }),
};

export const turnoService = {
    listar: (page = 0, size = 100) => post('/turnos/listar', { page, size }),
    obtener: (id) => post('/turnos/obtener', { id }),
};
