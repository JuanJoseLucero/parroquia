package com.mariaauxiliadora.eventos.resource;

import com.mariaauxiliadora.eventos.dto.PageResponse;
import com.mariaauxiliadora.eventos.entity.Evento;
import com.mariaauxiliadora.eventos.facade.EventoFacade;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.json.JsonObject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.Year;

@Path("/eventos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Stateless
public class EventoResource {

    @Inject
    private EventoFacade facade;

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
    @Path("/actual")
    public Response eventoActual(JsonObject json) {
        int anio = json.containsKey("anio") && !json.isNull("anio")
            ? json.getInt("anio") : Year.now().getValue();
        return facade.findActivoByAnio(anio)
                .map(e -> Response.ok(e).build())
                .orElse(Response.status(Response.Status.NOT_FOUND).build());
    }

    @POST
    @Path("/crear")
    public Response crear(JsonObject json) {
        Evento entity = new Evento();
        entity.setNombre(json.getString("nombre", null));
        if (json.containsKey("fechaInicio") && !json.isNull("fechaInicio")) entity.setFechaInicio(java.time.LocalDate.parse(json.getString("fechaInicio")));
        if (json.containsKey("fechaFin") && !json.isNull("fechaFin")) entity.setFechaFin(java.time.LocalDate.parse(json.getString("fechaFin")));
        entity.setAnio(json.getInt("anio", 0));
        entity.setDescripcion(json.getString("descripcion", null));
        var created = facade.create(entity);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @POST
    @Path("/actualizar")
    public Response actualizar(JsonObject json) {
        int id = json.getInt("id");
        Evento entity = new Evento();
        entity.setId(id);
        if (json.containsKey("nombre")) entity.setNombre(json.getString("nombre", null));
        if (json.containsKey("fechaInicio")) { if (json.isNull("fechaInicio")) entity.setFechaInicio(null); else entity.setFechaInicio(java.time.LocalDate.parse(json.getString("fechaInicio"))); }
        if (json.containsKey("fechaFin")) { if (json.isNull("fechaFin")) entity.setFechaFin(null); else entity.setFechaFin(java.time.LocalDate.parse(json.getString("fechaFin"))); }
        if (json.containsKey("anio")) entity.setAnio(json.getInt("anio"));
        if (json.containsKey("descripcion")) entity.setDescripcion(json.getString("descripcion", null));
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
