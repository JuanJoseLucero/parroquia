package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.entity.*;
import jakarta.ejb.Stateless;
import jakarta.json.JsonArray;
import jakarta.json.JsonObject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

/**
 * Lectura y edición completa de una inscripción (cabecera + representante + padres + niños).
 * La actualización se hace campo por campo sobre entidades gestionadas para evitar el
 * borrado de columnas a NULL que produce el merge con entidades parciales.
 */
@Stateless
@Transactional
public class InscripcionEdicionFacade {

    @PersistenceContext(unitName = "MAUXPU")
    private EntityManager em;

    public Map<String, Object> obtenerCompleta(Integer idCabecera) {
        InscripcionCabecera cabecera = em.find(InscripcionCabecera.class, idCabecera);
        if (cabecera == null || !Boolean.TRUE.equals(cabecera.getActivo())) {
            throw new IllegalArgumentException("La inscripción no existe o no está activa.");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("idCabecera", cabecera.getId());
        result.put("fecha", cabecera.getFecha());
        result.put("notas", cabecera.getNotas());
        result.put("cevento", cabecera.getCevento());

        if (cabecera.getCrepresentante() != null) {
            Representante rep = em.find(Representante.class, cabecera.getCrepresentante());
            if (rep != null) {
                Map<String, Object> repMap = new HashMap<>();
                repMap.put("id", rep.getId());
                repMap.put("personaId", rep.getCpersona());
                repMap.put("contactoEmergenciaNombre", rep.getContactoEmergenciaNombre());
                repMap.put("contactoEmergenciaTelefono", rep.getContactoEmergenciaTelefono());
                repMap.put("ocupacion", rep.getOcupacion());
                repMap.put("lugarTrabajo", rep.getLugarTrabajo());
                repMap.put("persona", personaToMap(em.find(Persona.class, rep.getCpersona())));
                result.put("representante", repMap);
            }
        }

        List<InscripcionDetalle> detalles = em.createQuery(
            "SELECT d FROM InscripcionDetalle d WHERE d.cinscripcionCabecera = :cab AND d.activo = true ORDER BY d.id",
            InscripcionDetalle.class
        ).setParameter("cab", idCabecera).getResultList();

        List<Map<String, Object>> ninos = new ArrayList<>();
        List<Integer> padreIds = new ArrayList<>();
        for (InscripcionDetalle det : detalles) {
            Ninio ninio = em.find(Ninio.class, det.getTninio());
            if (ninio == null || !Boolean.TRUE.equals(ninio.getActivo())) continue;

            Map<String, Object> n = new HashMap<>();
            n.put("detalleId", det.getId());
            n.put("ninioId", ninio.getId());
            n.put("personaId", ninio.getCpersona());
            n.put("persona", personaToMap(em.find(Persona.class, ninio.getCpersona())));

            Map<String, Object> ninoData = new HashMap<>();
            ninoData.put("sexo", ninio.getSexo());
            ninoData.put("alergias", ninio.getAlergias());
            ninoData.put("condicionesMedicas", ninio.getCondicionesMedicas());
            ninoData.put("cpadre", ninio.getCpadre());
            ninoData.put("cmadre", ninio.getCmadre());
            n.put("nino", ninoData);

            Map<String, Object> detData = new HashMap<>();
            detData.put("cestadoinscripcion", det.getCestadoinscripcion());
            detData.put("cnivelcatequesis", det.getCnivelcatequesis());
            detData.put("cturno", det.getCturno());
            detData.put("catequistaAnterior", det.getCatequistaAnterior());
            detData.put("parroquiaAnterior", det.getParroquiaAnterior());
            n.put("detalle", detData);

            List<Sacramento> sacs = em.createQuery(
                "SELECT s FROM Sacramento s WHERE s.tninio = :tn AND s.activo = true",
                Sacramento.class
            ).setParameter("tn", ninio.getId()).getResultList();
            if (!sacs.isEmpty()) {
                Sacramento s = sacs.get(0);
                Map<String, Object> sMap = new HashMap<>();
                sMap.put("id", s.getId());
                sMap.put("bautizado", s.getBautizado());
                sMap.put("bautizadoFecha", s.getBautizadoFecha());
                sMap.put("bautizadoParroquia", s.getBautizadoParroquia());
                sMap.put("eucaristia", s.getEucaristia());
                sMap.put("eucaristiaFecha", s.getEucaristiaFecha());
                sMap.put("eucaristiaParroquia", s.getEucaristiaParroquia());
                n.put("sacramento", sMap);
            }

            List<FichaSociodemografica> fichas = em.createQuery(
                "SELECT f FROM FichaSociodemografica f WHERE f.cinscripcionDetalle = :idDet",
                FichaSociodemografica.class
            ).setParameter("idDet", det.getId()).getResultList();
            if (!fichas.isEmpty()) {
                FichaSociodemografica f = fichas.get(0);
                Map<String, Object> fMap = new HashMap<>();
                fMap.put("id", f.getId());
                fMap.put("sectorResidencia", f.getSectorResidencia());
                fMap.put("tipoInstitucion", f.getTipoInstitucion());
                fMap.put("institucionEducativa", f.getInstitucionEducativa());
                fMap.put("nivelEducativo", f.getNivelEducativo());
                n.put("ficha", fMap);
            }

            ninos.add(n);
            if (ninio.getCpadre() != null) padreIds.add(ninio.getCpadre());
            if (ninio.getCmadre() != null) padreIds.add(ninio.getCmadre());
        }
        result.put("ninos", ninos);

        List<Map<String, Object>> padres = new ArrayList<>();
        for (Integer pid : new LinkedHashSet<>(padreIds)) {
            Padre p = em.find(Padre.class, pid);
            if (p == null || !Boolean.TRUE.equals(p.getActivo())) continue;
            Map<String, Object> pMap = new HashMap<>();
            pMap.put("id", p.getId());
            pMap.put("personaId", p.getCpersona());
            pMap.put("tipoPadre", p.getTipoPadre());
            pMap.put("ocupacion", p.getOcupacion());
            pMap.put("lugarTrabajo", p.getLugarTrabajo());
            pMap.put("persona", personaToMap(em.find(Persona.class, p.getCpersona())));
            padres.add(pMap);
        }
        result.put("padres", padres);

        return result;
    }

    public Map<String, Object> actualizarCompleta(JsonObject json) {
        Integer idCabecera = json.getInt("idCabecera");
        InscripcionCabecera cabecera = em.find(InscripcionCabecera.class, idCabecera);
        if (cabecera == null || !Boolean.TRUE.equals(cabecera.getActivo())) {
            throw new IllegalArgumentException("La inscripción no existe o no está activa.");
        }
        Integer cevento = cabecera.getCevento();

        // 1. Cabecera: solo observaciones (el resto no se edita)
        if (json.containsKey("notas")) cabecera.setNotas(json.isNull("notas") ? null : json.getString("notas"));

        // 2. Padres: construir mapa tipoPadre -> padreId y eliminar los marcados
        Map<String, Integer> padresIds = new HashMap<>();
        if (hasValue(json, "padres")) {
            JsonArray padresJson = json.getJsonArray("padres");
            for (int i = 0; i < padresJson.size(); i++) {
                JsonObject padreJson = padresJson.getJsonObject(i);
                String tipoPadre = getString(padreJson, "tipoPadre");
                String nombre = getString(padreJson, "nombre");
                if (tipoPadre == null || nombre == null || nombre.isBlank()) continue;

                Integer padreId = hasValue(padreJson, "id") ? getInt(padreJson, "id") : null;
                Padre padre = padreId != null ? em.find(Padre.class, padreId) : null;
                if (padre != null && !Boolean.TRUE.equals(padre.getActivo())) padre = null;

                boolean personaNueva = false;
                Persona personaPadre = null;
                if (padre != null) {
                    personaPadre = em.find(Persona.class, padre.getCpersona());
                    if (personaPadre == null) {
                        personaPadre = new Persona();
                        personaPadre.setActivo(true);
                        personaNueva = true;
                        em.persist(personaPadre);
                        padre.setCpersona(personaPadre.getId());
                    }
                } else {
                    String cedula = getString(padreJson, "cedula");
                    personaPadre = findPersonaPorCedula(cedula);
                    if (personaPadre == null) {
                        personaPadre = new Persona();
                        personaPadre.setActivo(true);
                        personaNueva = true;
                        em.persist(personaPadre);
                    }
                    padre = new Padre();
                    padre.setActivo(true);
                }

                // Solo las personas recién creadas reciben el nombre combinado como fallback.
                // Las personas existentes (p.ej. madre que es también representante) no se
                // sobrescriben con el nombre completo si el payload no trae nombres/apellidos.
                if (personaNueva) {
                    actualizarPersona(personaPadre, padreJson, nombre);
                } else {
                    actualizarPersona(personaPadre, padreJson);
                }
                padre.setTipoPadre(tipoPadre);
                padre.setOcupacion(getString(padreJson, "ocupacion"));
                padre.setLugarTrabajo(getString(padreJson, "lugarTrabajo"));
                if (padre.getId() == null) {
                    em.persist(padre);
                } else {
                    em.merge(padre);
                }
                padresIds.put(tipoPadre, padre.getId());
            }
        }

        if (hasValue(json, "padresEliminados")) {
            JsonArray elimJson = json.getJsonArray("padresEliminados");
            for (int i = 0; i < elimJson.size(); i++) {
                Integer pid = elimJson.getInt(i);
                Padre p = em.find(Padre.class, pid);
                if (p != null && Boolean.TRUE.equals(p.getActivo())) {
                    p.setActivo(false);
                    em.merge(p);
                }
                em.createQuery("UPDATE Ninio n SET n.cpadre = null WHERE n.cpadre = :pid")
                    .setParameter("pid", pid).executeUpdate();
                em.createQuery("UPDATE Ninio n SET n.cmadre = null WHERE n.cmadre = :pid")
                    .setParameter("pid", pid).executeUpdate();
            }
        }

        // 3. Representante
        if (hasValue(json, "representante")) {
            JsonObject repJson = json.getJsonObject("representante");
            Representante rep = em.find(Representante.class, cabecera.getCrepresentante());
            boolean repNuevo = rep == null;
            if (repNuevo) {
                rep = new Representante();
                rep.setActivo(true);
            }

            String tipoPadreRep = getString(repJson, "tipoPadre");
            if ("padre".equals(tipoPadreRep) || "madre".equals(tipoPadreRep)) {
                // Representante es uno de los padres: re-apuntar a la persona de ese padre.
                Integer padreId = padresIds.get(tipoPadreRep);
                if (padreId == null) {
                    throw new IllegalArgumentException("El padre seleccionado como representante legal no tiene datos válidos.");
                }
                Padre padre = em.find(Padre.class, padreId);
                if (padre == null || padre.getCpersona() == null) {
                    throw new IllegalArgumentException("El padre seleccionado como representante legal no tiene una persona asociada.");
                }
                Persona personaPadre = em.find(Persona.class, padre.getCpersona());
                if (personaPadre == null) {
                    throw new IllegalArgumentException("No se encontró la persona del representante legal.");
                }
                rep.setCpersona(personaPadre.getId());
                // La persona compartida ya fue actualizada en el bloque de padres
                // (nombres/apellidos/cedula). Aquí solo se aplican los campos propios
                // del representante (email, celular, estado civil, sector).
                actualizarPersona(personaPadre, repJson);
            } else {
                // Representante independiente: buscar o crear persona por cédula.
                String repCedula = getString(repJson, "cedula");
                if (repCedula == null || repCedula.isBlank()) {
                    throw new IllegalArgumentException("La cédula del representante legal es obligatoria.");
                }
                Persona personaRep = findPersonaPorCedula(repCedula);
                boolean personaNueva = false;
                if (personaRep == null) {
                    personaRep = new Persona();
                    personaRep.setCedula(repCedula);
                    personaRep.setActivo(true);
                    personaNueva = true;
                    em.persist(personaRep);
                }
                if (personaNueva) {
                    actualizarPersona(personaRep, repJson, getString(repJson, "nombres"));
                } else {
                    actualizarPersona(personaRep, repJson);
                }
                rep.setCpersona(personaRep.getId());
            }

            rep.setContactoEmergenciaNombre(getString(repJson, "contactoEmergenciaNombre"));
            rep.setContactoEmergenciaTelefono(getString(repJson, "contactoEmergenciaTelefono"));
            rep.setOcupacion(getString(repJson, "ocupacion"));
            rep.setLugarTrabajo(getString(repJson, "lugarTrabajo"));
            if (repNuevo) {
                em.persist(rep);
                cabecera.setCrepresentante(rep.getId());
                em.merge(cabecera);
                em.createQuery(
                    "UPDATE Ninio n SET n.crepresentante = :rid WHERE n.id IN " +
                    "(SELECT d.tninio FROM InscripcionDetalle d WHERE d.cinscripcionCabecera = :cab)")
                    .setParameter("rid", rep.getId())
                    .setParameter("cab", idCabecera)
                    .executeUpdate();
            } else {
                em.merge(rep);
            }
        }

        // 4. Niños
        JsonArray ninosJson = json.getJsonArray("ninos");
        List<String> rechazados = new ArrayList<>();
        List<Map<String, Object>> detalles = new ArrayList<>();

        for (int i = 0; i < ninosJson.size(); i++) {
            JsonObject ninJson = ninosJson.getJsonObject(i);
            if (ninJson.getBoolean("eliminar", false)) {
                eliminarNino(ninJson);
                continue;
            }

            Integer detalleId = hasValue(ninJson, "detalleId") ? getInt(ninJson, "detalleId") : null;
            if (detalleId != null) {
                detalles.add(actualizarNino(ninJson, detalleId, cevento, rechazados));
            } else {
                detalles.add(crearNino(ninJson, cevento, idCabecera, cabecera.getCrepresentante(), padresIds, rechazados));
            }
        }

        em.flush();

        Map<String, Object> result = new HashMap<>();
        result.put("idCabecera", idCabecera);
        result.put("detalles", detalles);
        result.put("rechazados", rechazados);
        result.put("totalRechazados", rechazados.size());
        return result;
    }

    private Map<String, Object> crearNino(JsonObject ninJson, Integer cevento, Integer idCabecera,
                                          Integer crepresentante, Map<String, Integer> padresIds,
                                          List<String> rechazados) {
        String cedula = getString(ninJson, "cedula");
        Persona persona = findPersonaPorCedula(cedula);
        if (persona != null) {
            Ninio duplicado = buscarDuplicado(persona.getId(), cevento, -1);
            if (duplicado != null) {
                rechazados.add(persona.getNombres() + " " + persona.getApellidos());
                return null;
            }
        } else {
            persona = new Persona();
            persona.setCedula(cedula);
            persona.setActivo(true);
            em.persist(persona);
        }

        actualizarPersonaNino(persona, ninJson);

        Ninio ninio = new Ninio();
        ninio.setCpersona(persona.getId());
        ninio.setSexo(getString(ninJson, "sexo"));
        ninio.setAlergias(getString(ninJson, "alergias"));
        ninio.setCondicionesMedicas(getString(ninJson, "condicionesMedicas"));
        ninio.setCpadre(padresIds.get("padre"));
        ninio.setCmadre(padresIds.get("madre"));
        ninio.setCrepresentante(crepresentante);
        ninio.setActivo(true);
        em.persist(ninio);

        InscripcionDetalle detalle = new InscripcionDetalle();
        detalle.setCinscripcionCabecera(idCabecera);
        detalle.setTninio(ninio.getId());
        detalle.setCestadoinscripcion(1);
        if (hasValue(ninJson, "nivelCatequesis")) detalle.setCnivelcatequesis(getInt(ninJson, "nivelCatequesis"));
        if (hasValue(ninJson, "turno")) detalle.setCturno(getInt(ninJson, "turno"));
        detalle.setCatequistaAnterior(getString(ninJson, "catequistaAnterior"));
        detalle.setParroquiaAnterior(getString(ninJson, "parroquiaAnterior"));
        detalle.setActivo(true);
        em.persist(detalle);

        guardarSacramento(ninJson, ninio.getId(), null);
        guardarFicha(ninJson, detalle.getId(), null);

        Map<String, Object> d = new HashMap<>();
        d.put("idDetalle", detalle.getId());
        d.put("nombre", persona.getNombres() + " " + persona.getApellidos());
        return d;
    }

    private Map<String, Object> actualizarNino(JsonObject ninJson, Integer detalleId, Integer cevento,
                                               List<String> rechazados) {
        InscripcionDetalle detalle = em.find(InscripcionDetalle.class, detalleId);
        if (detalle == null) return null;
        Ninio ninio = em.find(Ninio.class, detalle.getTninio());
        if (ninio == null) return null;
        Persona persona = em.find(Persona.class, ninio.getCpersona());

        String cedula = getString(ninJson, "cedula");
        if (cedula != null && persona != null && !cedula.equals(persona.getCedula())) {
            Persona porCedula = findPersonaPorCedula(cedula);
            if (porCedula != null && !porCedula.getId().equals(persona.getId())) {
                throw new IllegalArgumentException("La cédula " + cedula + " ya está registrada en otra persona.");
            }
        }

        if (persona != null) {
            actualizarPersonaNino(persona, ninJson);
            Ninio duplicado = buscarDuplicado(persona.getId(), cevento, detalleId);
            if (duplicado != null) {
                rechazados.add(persona.getNombres() + " " + persona.getApellidos());
                return null;
            }
        }

        if (ninio != null) {
            ninio.setSexo(getString(ninJson, "sexo"));
            ninio.setAlergias(getString(ninJson, "alergias"));
            ninio.setCondicionesMedicas(getString(ninJson, "condicionesMedicas"));
            ninio.setCpadre(getNullableInt(ninJson, "cpadre", ninio.getCpadre()));
            ninio.setCmadre(getNullableInt(ninJson, "cmadre", ninio.getCmadre()));
            em.merge(ninio);
        }

        // El estado de pago NO se edita (queda derivado de los pagos)
        detalle.setCnivelcatequesis(getNullableInt(ninJson, "nivelCatequesis", detalle.getCnivelcatequesis()));
        detalle.setCturno(getNullableInt(ninJson, "turno", detalle.getCturno()));
        detalle.setCatequistaAnterior(getString(ninJson, "catequistaAnterior"));
        detalle.setParroquiaAnterior(getString(ninJson, "parroquiaAnterior"));
        em.merge(detalle);

        Sacramento sacramento = em.createQuery(
            "SELECT s FROM Sacramento s WHERE s.tninio = :tn AND s.activo = true",
            Sacramento.class
        ).setParameter("tn", ninio.getId()).getResultStream().findFirst().orElse(null);
        guardarSacramento(ninJson, ninio.getId(), sacramento);

        FichaSociodemografica ficha = em.createQuery(
            "SELECT f FROM FichaSociodemografica f WHERE f.cinscripcionDetalle = :idDet",
            FichaSociodemografica.class
        ).setParameter("idDet", detalle.getId()).getResultStream().findFirst().orElse(null);
        guardarFicha(ninJson, detalle.getId(), ficha);

        Map<String, Object> d = new HashMap<>();
        d.put("idDetalle", detalle.getId());
        d.put("nombre", persona != null ? persona.getNombres() + " " + persona.getApellidos() : "");
        return d;
    }

    private void eliminarNino(JsonObject ninJson) {
        Integer detalleId = getInt(ninJson, "detalleId");
        if (detalleId == null) return;
        InscripcionDetalle detalle = em.find(InscripcionDetalle.class, detalleId);
        if (detalle != null && Boolean.TRUE.equals(detalle.getActivo())) {
            Integer ninioId = detalle.getTninio();
            detalle.setActivo(false);
            em.merge(detalle);
            em.createQuery("UPDATE FichaSociodemografica f SET f.activo = false WHERE f.cinscripcionDetalle = :idDet")
                .setParameter("idDet", detalleId).executeUpdate();
            if (ninioId != null) {
                em.createQuery("UPDATE Sacramento s SET s.activo = false WHERE s.tninio = :tn")
                    .setParameter("tn", ninioId).executeUpdate();
                Ninio ninio = em.find(Ninio.class, ninioId);
                if (ninio != null) {
                    ninio.setActivo(false);
                    em.merge(ninio);
                }
            }
        }
    }

    private void guardarSacramento(JsonObject ninJson, Integer tninio, Sacramento sacramento) {
        boolean bautizado = getBoolean(ninJson, "bautizado", false);
        boolean eucaristia = getBoolean(ninJson, "eucaristia", false);
        if (!bautizado && !eucaristia) {
            if (sacramento != null) {
                sacramento.setActivo(false);
                em.merge(sacramento);
            }
            return;
        }
        if (sacramento == null) {
            sacramento = new Sacramento();
            sacramento.setTninio(tninio);
            sacramento.setActivo(true);
            em.persist(sacramento);
        }
        sacramento.setBautizado(bautizado);
        if (hasValue(ninJson, "bautizadoFecha")) {
            sacramento.setBautizadoFecha(LocalDate.parse(ninJson.getString("bautizadoFecha")));
        } else {
            sacramento.setBautizadoFecha(null);
        }
        sacramento.setBautizadoParroquia(getString(ninJson, "bautizadoParroquia"));
        sacramento.setEucaristia(eucaristia);
        if (hasValue(ninJson, "eucaristiaFecha")) {
            sacramento.setEucaristiaFecha(LocalDate.parse(ninJson.getString("eucaristiaFecha")));
        } else {
            sacramento.setEucaristiaFecha(null);
        }
        sacramento.setEucaristiaParroquia(getString(ninJson, "eucaristiaParroquia"));
        if (sacramento.getId() != null) em.merge(sacramento);
    }

    private void guardarFicha(JsonObject ninJson, Integer idDetalle, FichaSociodemografica ficha) {
        JsonObject fichaJson = hasValue(ninJson, "ficha") ? ninJson.getJsonObject("ficha") : null;
        boolean tieneDatos = fichaJson != null && (
            hasValue(fichaJson, "sectorResidencia") || hasValue(fichaJson, "tipoInstitucion") ||
            hasValue(fichaJson, "institucionEducativa") || hasValue(fichaJson, "nivelEducativo"));

        if (!tieneDatos) {
            if (ficha != null) {
                ficha.setActivo(false);
                em.merge(ficha);
            }
            return;
        }
        if (ficha == null) {
            ficha = new FichaSociodemografica();
            ficha.setCinscripcionDetalle(idDetalle);
            ficha.setActivo(true);
            em.persist(ficha);
        }
        ficha.setSectorResidencia(getString(fichaJson, "sectorResidencia"));
        ficha.setTipoInstitucion(getString(fichaJson, "tipoInstitucion"));
        ficha.setInstitucionEducativa(getString(fichaJson, "institucionEducativa"));
        ficha.setNivelEducativo(getString(fichaJson, "nivelEducativo"));
        if (ficha.getId() != null) em.merge(ficha);
    }

    private void actualizarPersona(Persona persona, JsonObject json) {
        actualizarPersona(persona, json, null);
    }

    private void actualizarPersona(Persona persona, JsonObject json, String nombresFallback) {
        if (json.containsKey("nombres") && !json.isNull("nombres")) {
            persona.setNombres(json.getString("nombres"));
        } else if (nombresFallback != null) {
            persona.setNombres(nombresFallback);
        }
        if (json.containsKey("apellidos") && !json.isNull("apellidos")) persona.setApellidos(json.getString("apellidos"));
        if (json.containsKey("cedula") && !json.isNull("cedula")) persona.setCedula(json.getString("cedula"));
        if (json.containsKey("direccion")) persona.setDireccion(json.isNull("direccion") ? null : json.getString("direccion"));
        if (json.containsKey("email")) persona.setEmail(json.isNull("email") ? null : json.getString("email"));
        if (json.containsKey("celular")) persona.setCelular(json.isNull("celular") ? null : json.getString("celular"));
        if (json.containsKey("estadoCivil")) persona.setEstadoCivil(json.isNull("estadoCivil") ? null : json.getString("estadoCivil"));
        if (persona.getId() == null) {
            em.persist(persona);
        } else {
            em.merge(persona);
        }
    }

    private void actualizarPersonaNino(Persona persona, JsonObject json) {
        if (json.containsKey("nombres") && !json.isNull("nombres")) persona.setNombres(json.getString("nombres"));
        if (json.containsKey("apellidos") && !json.isNull("apellidos")) persona.setApellidos(json.getString("apellidos"));
        if (json.containsKey("cedula") && !json.isNull("cedula")) persona.setCedula(json.getString("cedula"));
        if (json.containsKey("direccion")) persona.setDireccion(json.isNull("direccion") ? null : json.getString("direccion"));
        if (hasValue(json, "fechaNacimiento")) {
            persona.setFechaNacimiento(LocalDate.parse(json.getString("fechaNacimiento")));
        }
        if (persona.getId() == null) {
            em.persist(persona);
        } else {
            em.merge(persona);
        }
    }

    private Persona findPersonaPorCedula(String cedula) {
        if (cedula == null || cedula.isBlank()) return null;
        return em.createQuery(
            "SELECT p FROM Persona p WHERE p.cedula = :cedula AND p.activo = true",
            Persona.class
        ).setParameter("cedula", cedula).getResultStream().findFirst().orElse(null);
    }

    private Ninio buscarDuplicado(Integer cpersona, Integer cevento, Integer excluirDetalleId) {
        return em.createQuery(
            "SELECT n FROM Ninio n JOIN InscripcionDetalle d ON d.tninio = n.id " +
            "JOIN InscripcionCabecera c ON c.id = d.cinscripcionCabecera " +
            "WHERE n.cpersona = :cp AND n.activo = true AND d.activo = true " +
            "AND d.id <> :excluir AND c.cevento = :ev",
            Ninio.class
        ).setParameter("cp", cpersona)
         .setParameter("excluir", excluirDetalleId)
         .setParameter("ev", cevento)
         .getResultStream().findFirst().orElse(null);
    }

    public Map<String, Object> darDeBaja(JsonObject json) {
        Integer idDetalle = json.getInt("idDetalle");
        InscripcionDetalle detalle = em.find(InscripcionDetalle.class, idDetalle);
        if (detalle == null || !Boolean.TRUE.equals(detalle.getActivo())) {
            throw new IllegalArgumentException("El detalle de inscripción no existe o ya está dado de baja.");
        }

        detalle.setActivo(false);

        Integer idNinio = detalle.getTninio();
        if (idNinio != null) {
            Ninio ninio = em.find(Ninio.class, idNinio);
            if (ninio != null) ninio.setActivo(false);
        }

        boolean cabeceraDesactivada = false;
        Integer idCabecera = detalle.getCinscripcionCabecera();
        if (idCabecera != null) {
            Long activos = em.createQuery(
                "SELECT COUNT(d) FROM InscripcionDetalle d WHERE d.cinscripcionCabecera = :cab AND d.activo = true",
                Long.class
            ).setParameter("cab", idCabecera).getSingleResult();
            if (activos == 0L) {
                InscripcionCabecera cabecera = em.find(InscripcionCabecera.class, idCabecera);
                if (cabecera != null) {
                    cabecera.setActivo(false);
                    cabeceraDesactivada = true;
                }
            }
        }

        em.flush();

        Map<String, Object> result = new HashMap<>();
        result.put("idDetalle", detalle.getId());
        result.put("ninioId", idNinio);
        result.put("cabeceraDesactivada", cabeceraDesactivada);
        return result;
    }

    private Map<String, Object> personaToMap(Persona p) {
        Map<String, Object> m = new HashMap<>();
        if (p == null) return m;
        m.put("id", p.getId());
        m.put("cedula", p.getCedula());
        m.put("nombres", p.getNombres());
        m.put("apellidos", p.getApellidos());
        m.put("direccion", p.getDireccion());
        m.put("email", p.getEmail());
        m.put("celular", p.getCelular());
        m.put("fechaNacimiento", p.getFechaNacimiento());
        m.put("estadoCivil", p.getEstadoCivil());
        return m;
    }

    private String getString(JsonObject json, String key) {
        if (json.containsKey(key) && !json.isNull(key)) return json.getString(key);
        return null;
    }

    private Integer getInt(JsonObject json, String key) {
        if (json.containsKey(key) && !json.isNull(key)) return json.getInt(key);
        return null;
    }

    private Integer getNullableInt(JsonObject json, String key, Integer current) {
        if (!json.containsKey(key)) return current;
        if (json.isNull(key)) return null;
        return json.getInt(key);
    }

    private boolean hasValue(JsonObject json, String key) {
        return json.containsKey(key) && !json.isNull(key);
    }

    private boolean getBoolean(JsonObject json, String key, boolean defaultValue) {
        if (json.containsKey(key) && !json.isNull(key)) return json.getBoolean(key);
        return defaultValue;
    }
}
