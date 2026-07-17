package com.mariaauxiliadora.eventos.resource;

import com.mariaauxiliadora.eventos.dto.PageResponse;
import com.mariaauxiliadora.eventos.entity.Taller;
import com.mariaauxiliadora.eventos.facade.TallerFacade;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.json.JsonObject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.Map;

@Path("/talleres")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Stateless
public class TallerResource {

    @Inject
    private TallerFacade facade;

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
    @Path("/por-rango-edad")
    public Response listarPorRangoEdad(JsonObject json) {
        String rangoEdad = json.getString("rangoEdad");
        String tipo = json.containsKey("tipo") && !json.isNull("tipo") ? json.getString("tipo") : null;
        List<Taller> result;
        if (tipo != null) {
            result = facade.listarPorRangoEdadYTipo(rangoEdad, tipo);
        } else {
            result = facade.listarPorRangoEdad(rangoEdad);
        }
        return Response.ok(result).build();
    }
    
    @POST
    @Path("/por-tipo")
    public Response listarPorTipo(JsonObject json) {
        String tipo = json.containsKey("tipo") && !json.isNull("tipo") ? json.getString("tipo") : null;
        List<Taller> result = facade.listarPorTipo( tipo);
        return Response.ok(result).build();
    }

    @POST
    @Path("/listar-todos")
    public Response listarTodos() {
        List<Taller> result = facade.findAll(0, 100);
        return Response.ok(result).build();
    }

    @POST
    @Path("/crear")
    public Response crear(JsonObject json) {
        Taller entity = new Taller();
        entity.setSiglas(json.getString("siglas"));
        entity.setNombre(json.getString("nombre"));
        entity.setTipo(json.getString("tipo"));
        entity.setRangoEdad(json.getString("rangoEdad"));
        var created = facade.create(entity);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @POST
    @Path("/actualizar")
    public Response actualizar(JsonObject json) {
        int id = json.getInt("id");
        var opt = facade.findById(id);
        if (opt.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        Taller entity = opt.get();
        if (json.containsKey("siglas")) entity.setSiglas(json.getString("siglas"));
        if (json.containsKey("nombre")) entity.setNombre(json.getString("nombre"));
        if (json.containsKey("tipo")) entity.setTipo(json.getString("tipo"));
        if (json.containsKey("rangoEdad")) entity.setRangoEdad(json.getString("rangoEdad"));
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
