package com.mariaauxiliadora.eventos.resource;

import com.mariaauxiliadora.eventos.dto.PageResponse;
import com.mariaauxiliadora.eventos.entity.Guia;
import com.mariaauxiliadora.eventos.entity.Persona;
import com.mariaauxiliadora.eventos.entity.Representante;
import com.mariaauxiliadora.eventos.facade.GuiaFacade;
import com.mariaauxiliadora.eventos.facade.PersonaFacade;
import com.mariaauxiliadora.eventos.facade.RepresentanteFacade;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.json.JsonObject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.LocalDate;

@Path("/guias")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Stateless
public class GuiaResource {

    @Inject
    private GuiaFacade facade;

    @Inject
    private PersonaFacade personaFacade;

    @Inject
    private RepresentanteFacade representanteFacade;

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
        Guia entity = new Guia();

        int cpersona = json.getInt("cpersona", 0);
        if (cpersona <= 0 && json.containsKey("persona") && !json.isNull("persona")) {
            Persona persona = new Persona();
            aplicarPersona(persona, json.getJsonObject("persona"));
            cpersona = personaFacade.create(persona).getId();
        }
        if (cpersona <= 0) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\":\"Se requiere cpersona o datos de persona\"}").build();
        }
        entity.setCpersona(cpersona);

        if (json.containsKey("siglas") && !json.isNull("siglas")) entity.setSiglas(json.getString("siglas"));

        aplicarFicha(entity, json);

        if (json.containsKey("representante") && !json.isNull("representante")) {
            entity.setCrepresentante(crearRepresentante(json.getJsonObject("representante")));
        }

        var created = facade.create(entity);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @POST
    @Path("/actualizar")
    public Response actualizar(JsonObject json) {
        int id = json.getInt("id");
        Guia entity = facade.findByIdActivo(id).orElse(null);
        if (entity == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        if (json.containsKey("cpersona")) entity.setCpersona(json.getInt("cpersona"));
        if (json.containsKey("siglas")) entity.setSiglas(json.getString("siglas", null));

        if (json.containsKey("persona") && !json.isNull("persona")) {
            personaFacade.findByIdActivo(entity.getCpersona()).ifPresent(p -> {
                aplicarPersona(p, json.getJsonObject("persona"));
                personaFacade.update(p);
            });
        }

        aplicarFicha(entity, json);

        if (json.containsKey("representante") && !json.isNull("representante")) {
            entity.setCrepresentante(crearRepresentante(json.getJsonObject("representante")));
        } else if (json.containsKey("crepresentante")) {
            entity.setCrepresentante(json.isNull("crepresentante") ? null : json.getInt("crepresentante"));
        }

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

    // ===== Helpers =====

    private void aplicarPersona(Persona p, JsonObject j) {
        if (j.containsKey("cedula")) p.setCedula(j.getString("cedula", null));
        if (j.containsKey("nombres")) p.setNombres(j.getString("nombres", null));
        if (j.containsKey("apellidos")) p.setApellidos(j.getString("apellidos", null));
        if (j.containsKey("direccion")) p.setDireccion(j.getString("direccion", null));
        if (j.containsKey("barrio")) p.setBarrio(j.getString("barrio", null));
        if (j.containsKey("email")) p.setEmail(j.getString("email", null));
        if (j.containsKey("celular")) p.setCelular(j.getString("celular", null));
        if (j.containsKey("fechaNacimiento")) {
            p.setFechaNacimiento(parseFecha(j, "fechaNacimiento"));
        }
        if (j.containsKey("aniosCumplidos")) p.setAniosCumplidos(j.getInt("aniosCumplidos", 0));
        if (j.containsKey("estadoCivil")) p.setEstadoCivil(j.getString("estadoCivil", null));
    }

    private void aplicarFicha(Guia e, JsonObject j) {
        // Información familiar
        if (j.containsKey("nombrePadre")) e.setNombrePadre(j.getString("nombrePadre", null));
        if (j.containsKey("nombreMadre")) e.setNombreMadre(j.getString("nombreMadre", null));

        // Información sacramental
        if (j.containsKey("bautizado")) e.setBautizado(j.getBoolean("bautizado", false));
        if (j.containsKey("bautizadoFecha")) e.setBautizadoFecha(parseFecha(j, "bautizadoFecha"));
        if (j.containsKey("primeraComunionFecha")) e.setPrimeraComunionFecha(parseFecha(j, "primeraComunionFecha"));
        if (j.containsKey("confirmacionFecha")) e.setConfirmacionFecha(parseFecha(j, "confirmacionFecha"));
        if (j.containsKey("matrimonio")) e.setMatrimonio(j.getBoolean("matrimonio", false));
        if (j.containsKey("matrimonioFecha")) e.setMatrimonioFecha(parseFecha(j, "matrimonioFecha"));

        // Información pastoral
        if (j.containsKey("parroquia")) e.setParroquia(j.getString("parroquia", null));
        if (j.containsKey("grupoMovimiento")) e.setGrupoMovimiento(j.getString("grupoMovimiento", null));
        if (j.containsKey("aniosExperiencia")) {
            e.setAniosExperiencia(j.isNull("aniosExperiencia") ? null : j.getInt("aniosExperiencia"));
        }
        if (j.containsKey("cnivelCatequesis")) {
            e.setCnivelCatequesis(j.isNull("cnivelCatequesis") ? null : j.getInt("cnivelCatequesis"));
        }
        if (j.containsKey("disponibilidadHorario")) e.setDisponibilidadHorario(j.getString("disponibilidadHorario", null));

        // Información de salud
        if (j.containsKey("tipoSangre")) e.setTipoSangre(j.getString("tipoSangre", null));
        if (j.containsKey("alergiasEnfermedades")) e.setAlergiasEnfermedades(j.getString("alergiasEnfermedades", null));
        if (j.containsKey("contactoEmergenciaNombre")) e.setContactoEmergenciaNombre(j.getString("contactoEmergenciaNombre", null));
        if (j.containsKey("contactoEmergenciaTelefono")) e.setContactoEmergenciaTelefono(j.getString("contactoEmergenciaTelefono", null));

        // Autorizaciones
        if (j.containsKey("aceptaReglamento")) e.setAceptaReglamento(j.getBoolean("aceptaReglamento", false));
        if (j.containsKey("autorizaDatos")) e.setAutorizaDatos(j.getBoolean("autorizaDatos", false));
        if (j.containsKey("autorizaFotos")) e.setAutorizaFotos(j.getBoolean("autorizaFotos", false));
    }

    private Integer crearRepresentante(JsonObject j) {
        int cpersonaRep = j.getInt("cpersona", 0);
        if (cpersonaRep <= 0 && j.containsKey("nombres")) {
            Persona persona = new Persona();
            aplicarPersona(persona, j);
            cpersonaRep = personaFacade.create(persona).getId();
        }
        Representante rep = new Representante();
        rep.setCpersona(cpersonaRep);
        return representanteFacade.create(rep).getId();
    }

    private LocalDate parseFecha(JsonObject j, String key) {
        if (!j.containsKey(key) || j.isNull(key)) return null;
        String v = j.getString(key, null);
        return (v == null || v.isBlank()) ? null : LocalDate.parse(v);
    }
}
