package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.entity.*;
import com.mariaauxiliadora.eventos.util.EmailService;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.json.JsonArray;
import jakarta.json.JsonObject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Stateless
@Transactional
public class InscripcionCompletaFacade {

    @PersistenceContext(unitName = "MAUXPU")
    private EntityManager em;

    @Inject
    private EmailService emailService;

    public Map<String, Object> crearInscripcionCompleta(JsonObject json) {
        JsonObject repJson = json.getJsonObject("representante");
        JsonArray ninosJson = json.getJsonArray("ninos");
        int cusuario = json.getInt("cusuario", 1);
        Integer cevento = hasValue(json, "cevento") ? json.getInt("cevento") : null;
        if (cevento == null) {
            throw new IllegalArgumentException("El evento de la inscripción es obligatorio: no hay un evento activo configurado para el año actual.");
        }
        Evento evento = em.createQuery(
            "SELECT e FROM Evento e WHERE e.id = :cevento AND e.activo = true",
            Evento.class
        ).setParameter("cevento", cevento).getResultStream().findFirst().orElse(null);
        if (evento == null) {
            throw new IllegalArgumentException("El evento indicado no existe o no está activo.");
        }

        String repCedula = getString(repJson, "cedula");

        // 1. Persona representante — buscar o crear
        Persona personaRep = em.createQuery(
            "SELECT p FROM Persona p WHERE p.cedula = :cedula AND p.activo = true",
            Persona.class
        ).setParameter("cedula", repCedula).getResultStream().findFirst().orElse(null);

        if (personaRep == null) {
            personaRep = new Persona();
            personaRep.setCedula(repCedula);
            personaRep.setNombres(getString(repJson, "nombres"));
            personaRep.setApellidos(getString(repJson, "apellidos"));
            personaRep.setDireccion(getString(repJson, "direccion"));
            personaRep.setEmail(getString(repJson, "email"));
            personaRep.setCelular(getString(repJson, "celular"));
            personaRep.setEstadoCivil(getString(repJson, "estadoCivil"));
            personaRep.setActivo(true);
            em.persist(personaRep);
        } else if (hasValue(repJson, "estadoCivil")) {
            personaRep.setEstadoCivil(getString(repJson, "estadoCivil"));
            em.merge(personaRep);
        }

        // 2. Representante — buscar o crear
        Representante representante = em.createQuery(
            "SELECT r FROM Representante r WHERE r.cpersona = :cpersona AND r.activo = true",
            Representante.class
        ).setParameter("cpersona", personaRep.getId()).getResultStream().findFirst().orElse(null);

        if (representante == null) {
            representante = new Representante();
            representante.setCpersona(personaRep.getId());
            representante.setActivo(true);
        }
        representante.setContactoEmergenciaNombre(getString(repJson, "contactoEmergenciaNombre"));
        representante.setContactoEmergenciaTelefono(getString(repJson, "contactoEmergenciaTelefono"));
        representante.setOcupacion(getString(repJson, "ocupacion"));
        representante.setLugarTrabajo(getString(repJson, "lugarTrabajo"));
        if (representante.getId() == null) {
            em.persist(representante);
        } else {
            em.merge(representante);
        }

        // 3. Cabecera de inscripción
        InscripcionCabecera cabecera = new InscripcionCabecera();
        cabecera.setFecha(LocalDate.now());
        cabecera.setCusuario(cusuario);
        cabecera.setCrepresentante(representante.getId());
        cabecera.setCevento(cevento);
        cabecera.setNotas(getString(json, "notas"));
        cabecera.setActivo(true);
        em.persist(cabecera);

        // 3.1 Padres (padre y madre) si se envían
        JsonArray padresJson = json.containsKey("padres") && !json.isNull("padres")
            ? json.getJsonArray("padres") : null;
        Integer idPadre = null;
        Integer idMadre = null;
        if (padresJson != null) {
            for (int p = 0; p < padresJson.size(); p++) {
                JsonObject padreJson = padresJson.getJsonObject(p);
                String tipoPadre = getString(padreJson, "tipoPadre");
                if (tipoPadre == null || tipoPadre.isBlank()) continue;

                Persona personaPadre = null;
                String padreCedula = getString(padreJson, "cedula");
                if (padreCedula != null && !padreCedula.isBlank()) {
                    personaPadre = em.createQuery(
                        "SELECT p FROM Persona p WHERE p.cedula = :cedula AND p.activo = true",
                        Persona.class
                    ).setParameter("cedula", padreCedula).getResultStream().findFirst().orElse(null);
                }

                if (personaPadre == null) {
                    personaPadre = new Persona();
                    personaPadre.setCedula(padreCedula);
                    personaPadre.setNombres(getString(padreJson, "nombres"));
                    personaPadre.setApellidos(getString(padreJson, "apellidos"));
                    personaPadre.setCelular(getString(padreJson, "telefono"));
                    personaPadre.setActivo(true);
                    em.persist(personaPadre);
                }

                Padre padre = new Padre();
                padre.setCpersona(personaPadre.getId());
                padre.setTipoPadre(tipoPadre);
                padre.setOcupacion(getString(padreJson, "ocupacion"));
                padre.setLugarTrabajo(getString(padreJson, "lugarTrabajo"));
                padre.setActivo(true);
                em.persist(padre);

                if ("padre".equals(tipoPadre)) {
                    idPadre = padre.getId();
                } else if ("madre".equals(tipoPadre)) {
                    idMadre = padre.getId();
                }
            }
        }

        // 4. Leer fichas por niño
        JsonArray fichasJson = json.containsKey("fichas") && !json.isNull("fichas")
            ? json.getJsonArray("fichas") : null;

        // 5. Por cada niño: crear o reutilizar persona, validar no duplicado
        List<Map<String, Object>> detalles = new ArrayList<>();
        List<String> rechazados = new ArrayList<>();

        for (int i = 0; i < ninosJson.size(); i++) {
            JsonObject ninJson = ninosJson.getJsonObject(i);
            String ninCedula = getString(ninJson, "cedula");

            Persona personaNin = em.createQuery(
                "SELECT p FROM Persona p WHERE p.cedula = :cedula AND p.activo = true",
                Persona.class
            ).setParameter("cedula", ninCedula).getResultStream().findFirst().orElse(null);

            if (personaNin != null) {
                String dupQuery = "SELECT n FROM Ninio n JOIN InscripcionDetalle d ON d.tninio = n.id " +
                    "JOIN InscripcionCabecera c ON c.id = d.cinscripcionCabecera " +
                    "WHERE n.cpersona = :cpersona AND n.activo = true AND d.activo = true";
                if (cevento != null) {
                    dupQuery += " AND c.cevento = :cevento";
                }
                var dupTypedQuery = em.createQuery(dupQuery, Ninio.class)
                    .setParameter("cpersona", personaNin.getId());
                if (cevento != null) {
                    dupTypedQuery.setParameter("cevento", cevento);
                }
                Ninio existente = dupTypedQuery.getResultStream().findFirst().orElse(null);

                if (existente != null) {
                    rechazados.add(personaNin.getNombres() + " " + personaNin.getApellidos());
                    continue;
                }
            } else {
                personaNin = new Persona();
                personaNin.setCedula(ninCedula);
                personaNin.setNombres(getString(ninJson, "nombres"));
                personaNin.setApellidos(getString(ninJson, "apellidos"));
                personaNin.setDireccion(getString(ninJson, "direccion"));
                if (hasValue(ninJson, "fechaNacimiento")) {
                    personaNin.setFechaNacimiento(LocalDate.parse(ninJson.getString("fechaNacimiento")));
                }
                personaNin.setActivo(true);
                em.persist(personaNin);
            }

            Ninio ninio = new Ninio();
            ninio.setCpersona(personaNin.getId());
            ninio.setSexo(getString(ninJson, "sexo"));
            ninio.setAlergias(getString(ninJson, "alergias"));
            ninio.setCondicionesMedicas(getString(ninJson, "condicionesMedicas"));
            ninio.setCpadre(idPadre);
            ninio.setCmadre(idMadre);
            ninio.setCrepresentante(representante.getId());
            ninio.setActivo(true);
            em.persist(ninio);

            InscripcionDetalle detalle = new InscripcionDetalle();
            detalle.setCinscripcionCabecera(cabecera.getId());
            detalle.setTninio(ninio.getId());
            detalle.setCestadoinscripcion(1);
            if (hasValue(ninJson, "nivelCatequesis")) {
                detalle.setCnivelcatequesis(getInt(ninJson, "nivelCatequesis"));
            }
            if (hasValue(ninJson, "turno")) {
                detalle.setCturno(getInt(ninJson, "turno"));
            }
            detalle.setCatequistaAnterior(getString(ninJson, "catequistaAnterior"));
            detalle.setParroquiaAnterior(getString(ninJson, "parroquiaAnterior"));
            detalle.setActivo(true);
            em.persist(detalle);

            // Sacramento por niño (bautizo, eucaristía)
            if (hasValue(ninJson, "bautizado") || hasValue(ninJson, "eucaristia")) {
                Sacramento sacramento = new Sacramento();
                sacramento.setTninio(ninio.getId());
                sacramento.setBautizado(getBoolean(ninJson, "bautizado", false));
                if (hasValue(ninJson, "bautizadoFecha")) {
                    sacramento.setBautizadoFecha(LocalDate.parse(ninJson.getString("bautizadoFecha")));
                }
                sacramento.setBautizadoParroquia(getString(ninJson, "bautizadoParroquia"));
                sacramento.setEucaristia(getBoolean(ninJson, "eucaristia", false));
                if (hasValue(ninJson, "eucaristiaFecha")) {
                    sacramento.setEucaristiaFecha(LocalDate.parse(ninJson.getString("eucaristiaFecha")));
                }
                sacramento.setEucaristiaParroquia(getString(ninJson, "eucaristiaParroquia"));
                sacramento.setActivo(true);
                em.persist(sacramento);
            }

            // Ficha sociodemográfica por niño
            if (fichasJson != null && i < fichasJson.size()) {
                JsonObject fichaJson = fichasJson.getJsonObject(i);
                FichaSociodemografica ficha = new FichaSociodemografica();
                ficha.setCinscripcionDetalle(detalle.getId());
                ficha.setSectorResidencia(getString(fichaJson, "sectorResidencia"));
                ficha.setTipoInstitucion(getString(fichaJson, "tipoInstitucion"));
                ficha.setInstitucionEducativa(getString(fichaJson, "institucionEducativa"));
                ficha.setNivelEducativo(getString(fichaJson, "nivelEducativo"));
                ficha.setActivo(true);
                em.persist(ficha);
            }

            Map<String, Object> d = new HashMap<>();
            d.put("idDetalle", detalle.getId());
            d.put("ninioId", ninio.getId());
            d.put("personaId", personaNin.getId());
            d.put("nombre", personaNin.getNombres() + " " + personaNin.getApellidos());
            detalles.add(d);
        }

        em.flush();

        if (personaRep.getEmail() != null && !personaRep.getEmail().isBlank()) {
            List<Map<String, String>> niniosInfo = new ArrayList<>();
            for (Map<String, Object> det : detalles) {
                Map<String, String> ninio = new HashMap<>();
                ninio.put("nombre", (String) det.get("nombre"));
                niniosInfo.add(ninio);
            }
            emailService.enviarCorreoInscripcion(personaRep, niniosInfo, cabecera.getId());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("idCabecera", cabecera.getId());
        result.put("totalNinos", detalles.size());
        result.put("detalles", detalles);
        result.put("rechazados", rechazados);
        result.put("totalRechazados", rechazados.size());
        return result;
    }

    private String getString(JsonObject json, String key) {
        if (json.containsKey(key) && !json.isNull(key)) {
            return json.getString(key);
        }
        return null;
    }

    private Integer getInt(JsonObject json, String key) {
        if (json.containsKey(key) && !json.isNull(key)) {
            return json.getInt(key);
        }
        return null;
    }

    private boolean hasValue(JsonObject json, String key) {
        return json.containsKey(key) && !json.isNull(key);
    }

    private boolean getBoolean(JsonObject json, String key, boolean defaultValue) {
        if (json.containsKey(key) && !json.isNull(key)) {
            return json.getBoolean(key);
        }
        return defaultValue;
    }
}
