package com.mariaauxiliadora.eventos.resource;

import com.mariaauxiliadora.eventos.dto.PageResponse;
import com.mariaauxiliadora.eventos.entity.InscripcionDetalle;
import com.mariaauxiliadora.eventos.facade.InscripcionDetalleFacade;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.json.JsonObject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/inscripcion-detalles")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Stateless
public class InscripcionDetalleResource {

    @Inject
    private InscripcionDetalleFacade facade;

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
        InscripcionDetalle entity = new InscripcionDetalle();
        entity.setCinscripcionCabecera(json.getInt("cinscripcionCabecera", 0));
        entity.setTninio(json.getInt("tninio", 0));
        entity.setCestadoinscripcion(json.getInt("cestadoinscripcion", 1));
        var created = facade.create(entity);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @POST
    @Path("/actualizar")
    public Response actualizar(JsonObject json) {
        int id = json.getInt("id");
        InscripcionDetalle entity = new InscripcionDetalle();
        entity.setId(id);
        if (json.containsKey("cinscripcionCabecera")) entity.setCinscripcionCabecera(json.getInt("cinscripcionCabecera"));
        if (json.containsKey("tninio")) entity.setTninio(json.getInt("tninio"));
        if (json.containsKey("cestadoinscripcion")) entity.setCestadoinscripcion(json.getInt("cestadoinscripcion"));
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
