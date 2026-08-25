package com.mariaauxiliadora.eventos.resource;

import com.mariaauxiliadora.eventos.dto.PageResponse;
import com.mariaauxiliadora.eventos.entity.Persona;
import com.mariaauxiliadora.eventos.facade.PersonaFacade;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.json.JsonObject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/personas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Stateless
public class PersonaResource {

    @Inject
    private PersonaFacade facade;

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
        Persona entity = new Persona();
        if (json.containsKey("cedula") && !json.isNull("cedula")) entity.setCedula(json.getString("cedula"));
        entity.setNombres(json.getString("nombres", null));
        entity.setApellidos(json.getString("apellidos", null));
        entity.setDireccion(json.getString("direccion", null));
        entity.setBarrio(json.getString("barrio", null));
        entity.setEmail(json.getString("email", null));
        entity.setCelular(json.getString("celular", null));
        if (json.containsKey("fechaNacimiento") && !json.isNull("fechaNacimiento")) entity.setFechaNacimiento(java.time.LocalDate.parse(json.getString("fechaNacimiento")));
        entity.setAniosCumplidos(json.getInt("aniosCumplidos", 0));
        entity.setEstadoCivil(json.getString("estadoCivil", null));
        var created = facade.create(entity);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @POST
    @Path("/actualizar")
    public Response actualizar(JsonObject json) {
        int id = json.getInt("id");
        Persona entity = new Persona();
        entity.setId(id);
        if (json.containsKey("cedula")) entity.setCedula(json.getString("cedula"));
        if (json.containsKey("nombres")) entity.setNombres(json.getString("nombres", null));
        if (json.containsKey("apellidos")) entity.setApellidos(json.getString("apellidos", null));
        if (json.containsKey("direccion")) entity.setDireccion(json.getString("direccion", null));
        if (json.containsKey("barrio")) entity.setBarrio(json.getString("barrio", null));
        if (json.containsKey("email")) entity.setEmail(json.getString("email", null));
        if (json.containsKey("celular")) entity.setCelular(json.getString("celular", null));
        if (json.containsKey("fechaNacimiento")) { if (json.isNull("fechaNacimiento")) entity.setFechaNacimiento(null); else entity.setFechaNacimiento(java.time.LocalDate.parse(json.getString("fechaNacimiento"))); }
        if (json.containsKey("aniosCumplidos")) entity.setAniosCumplidos(json.getInt("aniosCumplidos"));
        if (json.containsKey("estadoCivil")) entity.setEstadoCivil(json.getString("estadoCivil", null));
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
