package com.mariaauxiliadora.eventos.resource;

import com.mariaauxiliadora.eventos.facade.InscripcionEdicionFacade;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.json.JsonObject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;

@Path("/inscripciones")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Stateless
public class InscripcionEdicionResource {

    @Inject
    private InscripcionEdicionFacade facade;

    @POST
    @Path("/obtener-completa")
    public Response obtenerCompleta(JsonObject json) {
        try {
            Map<String, Object> result = facade.obtenerCompleta(json.getInt("idCabecera"));
            return Response.ok(result).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/actualizar-completa")
    public Response actualizarCompleta(JsonObject json) {
        try {
            Map<String, Object> result = facade.actualizarCompleta(json);
            return Response.ok(result).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
}
