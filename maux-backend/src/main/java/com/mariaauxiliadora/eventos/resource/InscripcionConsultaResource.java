package com.mariaauxiliadora.eventos.resource;

import com.mariaauxiliadora.eventos.facade.InscripcionConsultaFacade;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.json.JsonObject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.Map;

@Path("/inscripciones")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Stateless
public class InscripcionConsultaResource {

    @Inject
    private InscripcionConsultaFacade facade;

    @POST
    @Path("/participantes-pendientes")
    public Response listarParticipantesPendientes() {
        try {
            List<Map<String, Object>> result = facade.listarParticipantesPendientes();
            return Response.ok(result).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/registrar-pago")
    public Response registrarPago(JsonObject json) {
        try {
            Map<String, Object> result = facade.registrarPago(json);
            return Response.status(Response.Status.CREATED).entity(result).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/buscar-por-cedula")
    public Response buscarPorCedula(JsonObject json) {
        try {
            String cedula = json.getString("cedula");
            Map<String, Object> result = facade.buscarPersonaPorCedula(cedula);
            return Response.ok(result).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }
}
