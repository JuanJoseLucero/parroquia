package com.mariaauxiliadora.eventos.resource;

import com.mariaauxiliadora.eventos.dto.PageResponse;
import com.mariaauxiliadora.eventos.entity.Asistencia;
import com.mariaauxiliadora.eventos.facade.AsistenciaFacade;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.json.JsonObject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/asistencias")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Stateless
public class AsistenciaResource {

    @Inject
    private AsistenciaFacade facade;

    @POST
    @Path("/listar")
    public Response listar(JsonObject json) {
        int page = json.getInt("page", 0);
        int size = json.getInt("size", 20);
        var data = facade.findAll(page, size);
        var total = facade.count();
        return Response.ok(new PageResponse<>(data, page, size, total)).build();
    }

    @POST
    @Path("/listar-admin")
    public Response listarAdmin(JsonObject json) {
        int page = json.getInt("page", 0);
        int size = json.getInt("size", 20);
        var data = facade.findAllRaw(page, size);
        var total = facade.countRaw();
        return Response.ok(new PageResponse<>(data, page, size, total)).build();
    }

    @POST
    @Path("/obtener")
    public Response obtener(JsonObject json) {
        int id = json.getInt("id");
        return facade.findByIdActivo(id)
                .map(e -> Response.ok(e).build())
                .orElse(Response.status(Response.Status.NOT_FOUND).build());
    }

    @POST
    @Path("/crear")
    public Response crear(JsonObject json) {
        Asistencia entity = new Asistencia();
        entity.setCninio(json.getInt("cninio", 0));
        entity.setCfechaasistencia(json.getInt("cfechaasistencia", 0));
        entity.setCestadoasistencia(json.getInt("cestadoasistencia", 0));
        entity.setObservaciones(json.getString("observaciones", null));
        if (json.containsKey("horaRegistro") && !json.isNull("horaRegistro")) entity.setHoraRegistro(java.time.LocalTime.parse(json.getString("horaRegistro")));
        var created = facade.create(entity);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @POST
    @Path("/actualizar")
    public Response actualizar(JsonObject json) {
        int id = json.getInt("id");
        Asistencia entity = new Asistencia();
        entity.setId(id);
        if (json.containsKey("cninio")) entity.setCninio(json.getInt("cninio"));
        if (json.containsKey("cfechaasistencia")) entity.setCfechaasistencia(json.getInt("cfechaasistencia"));
        if (json.containsKey("cestadoasistencia")) entity.setCestadoasistencia(json.getInt("cestadoasistencia"));
        if (json.containsKey("observaciones")) entity.setObservaciones(json.getString("observaciones", null));
        if (json.containsKey("horaRegistro")) { if (json.isNull("horaRegistro")) entity.setHoraRegistro(null); else entity.setHoraRegistro(java.time.LocalTime.parse(json.getString("horaRegistro"))); }
        var updated = facade.update(entity);
        return Response.ok(updated).build();
    }

    @POST
    @Path("/eliminar")
    public Response eliminar(JsonObject json) {
        int id = json.getInt("id");
        facade.softDelete(id);
        return Response.noContent().build();
    }
}
