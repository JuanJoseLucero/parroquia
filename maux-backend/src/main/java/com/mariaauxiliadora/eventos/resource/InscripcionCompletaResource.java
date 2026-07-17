package com.mariaauxiliadora.eventos.resource;

import com.mariaauxiliadora.eventos.facade.InscripcionCompletaFacade;
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
public class InscripcionCompletaResource {

    @Inject
    private InscripcionCompletaFacade facade;

    @POST
    @Path("/crear-completa")
    public Response crearCompleta(JsonObject json) {
        try {
            Map<String, Object> result = facade.crearInscripcionCompleta(json);
            return Response.status(Response.Status.CREATED).entity(result).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
}
