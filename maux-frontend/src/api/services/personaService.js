import { post } from '../apiClient';

export const personaService = {
    listar: (page = 0, size = 20) => post('/personas/listar', { page, size }),
    listarAdmin: (page = 0, size = 20) => post('/personas/listar-admin', { page, size }),
    obtener: (id) => post('/personas/obtener', { id }),
    crear: (data) => post('/personas/crear', data),
    actualizar: (data) => post('/personas/actualizar', data),
    eliminar: (id) => post('/personas/eliminar', { id }),
};

export const representanteService = {
    listar: (page = 0, size = 20) => post('/representantes/listar', { page, size }),
    listarAdmin: (page = 0, size = 20) => post('/representantes/listar-admin', { page, size }),
    crear: (data) => post('/representantes/crear', data),
    obtener: (id) => post('/representantes/obtener', { id }),
};

export const ninioService = {
    listar: (page = 0, size = 20) => post('/ninios/listar', { page, size }),
    listarAdmin: (page = 0, size = 20) => post('/ninios/listar-admin', { page, size }),
    obtener: (id) => post('/ninios/obtener', { id }),
    crear: (data) => post('/ninios/crear', data),
    eliminar: (id) => post('/ninios/eliminar', { id }),
};

export const grupoService = {
    listar: () => post('/grupos/listar', { page: 0, size: 100 }),
    listarAdmin: () => post('/grupos/listar-admin', { page: 0, size: 100 }),
    obtener: (id) => post('/grupos/obtener', { id }),
    crear: (data) => post('/grupos/crear', data),
};

export const grupoGuiaService = {
    listar: () => post('/grupo-guias/listar', { page: 0, size: 1000 }),
    crear: (data) => post('/grupo-guias/crear', data),
    eliminar: (id) => post('/grupo-guias/eliminar', { id }),
};

export const guiaService = {
    listar: (page = 0, size = 20) => post('/guias/listar', { page, size }),
    listarAdmin: (page = 0, size = 20) => post('/guias/listar-admin', { page, size }),
    obtener: (id) => post('/guias/obtener', { id }),
    crear: (data) => post('/guias/crear', data),
    actualizar: (data) => post('/guias/actualizar', data),
    eliminar: (id) => post('/guias/eliminar', { id }),
};

export const nivelCatequesisService = {
    listar: () => post('/niveles-catequesis/listar', { page: 0, size: 100 }),
};

export const eventoService = {
    listar: () => post('/eventos/listar', { page: 0, size: 10 }),
};
