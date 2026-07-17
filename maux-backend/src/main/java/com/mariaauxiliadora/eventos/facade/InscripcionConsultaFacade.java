package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.entity.*;
import com.mariaauxiliadora.eventos.util.EmailService;
import jakarta.json.JsonObject;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Stateless
@Transactional
public class InscripcionConsultaFacade {

    @PersistenceContext(unitName = "MAUXPU")
    private EntityManager em;

    @Inject
    private EmailService emailService;

    public Map<String, Object> buscarPersonaPorCedula(String cedula) {
        Persona persona = em.createQuery(
            "SELECT p FROM Persona p WHERE p.cedula = :cedula AND p.activo = true",
            Persona.class
        ).setParameter("cedula", cedula).getResultStream().findFirst().orElse(null);

        Map<String, Object> result = new HashMap<>();
        if (persona != null) {
            result.put("existe", true);
            result.put("id", persona.getId());
            result.put("nombres", persona.getNombres());
            result.put("apellidos", persona.getApellidos());

            Ninio ninio = em.createQuery(
                "SELECT n FROM Ninio n JOIN InscripcionDetalle d ON d.tninio = n.id " +
                "WHERE n.cpersona = :cpersona AND n.activo = true AND d.activo = true",
                Ninio.class
            ).setParameter("cpersona", persona.getId()).getResultStream().findFirst().orElse(null);

            result.put("yaInscrito", ninio != null);
        } else {
            result.put("existe", false);
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listarParticipantesPendientes() {
        String jpql = "SELECT d.id, d.cinscripcionCabecera, d.tninio, " +
                      "p.nombres, p.apellidos, p.cedula, " +
                      "d.cestadoinscripcion, c.id AS cabeceraId, " +
                      "n.cgrupo " +
                      "FROM InscripcionDetalle d, Ninio n, Persona p, InscripcionCabecera c " +
                      "WHERE d.tninio = n.id AND n.cpersona = p.id " +
                      "AND d.cinscripcionCabecera = c.id " +
                      "AND d.activo = true AND n.activo = true " +
                      "AND c.activo = true AND d.cestadoinscripcion <> 3 " +
                      "ORDER BY p.apellidos, p.nombres";

        TypedQuery<Object[]> query = (TypedQuery<Object[]>) em.createQuery(jpql, Object[].class);
        List<Object[]> rows = query.getResultList();

        CostoInscripcion costoEntity = em.createQuery(
            "SELECT c FROM CostoInscripcion c WHERE c.activo = true ORDER BY c.id",
            CostoInscripcion.class
        ).setMaxResults(1).getResultStream().findFirst().orElse(null);
        BigDecimal costoBase = costoEntity != null ? costoEntity.getMonto() : BigDecimal.valueOf(15);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Integer idDetalle = (Integer) row[0];
            Integer idCabecera = (Integer) row[1];
            Integer idNinio = (Integer) row[2];
            String nombres = (String) row[3];
            String apellidos = (String) row[4];
            String cedula = (String) row[5];
            Integer cestadoinscripcion = (Integer) row[6];

            BigDecimal totalPagado = em.createQuery(
                "SELECT COALESCE(SUM(pg.monto), 0) FROM Pago pg WHERE pg.cinscripcionDetalle = :idDetalle AND pg.activo = true",
                BigDecimal.class
            ).setParameter("idDetalle", idDetalle).getSingleResult();

            Map<String, Object> item = new HashMap<>();
            item.put("idDetalle", idDetalle);
            item.put("idCabecera", idCabecera);
            item.put("idNinio", idNinio);
            item.put("nombres", nombres);
            item.put("apellidos", apellidos);
            item.put("nombreCompleto", nombres + " " + apellidos);
            item.put("cedula", cedula);
            item.put("cestadoinscripcion", cestadoinscripcion);
            item.put("totalPagado", totalPagado);
            item.put("costo", costoBase);
            item.put("pendiente", costoBase.subtract(totalPagado));
            result.add(item);
        }
        return result;
    }

    public Map<String, Object> registrarPago(JsonObject json) {
        Integer idDetalle = json.getInt("cinscripcionDetalle");
        int cusuario = json.getInt("cusuario", 1);
        BigDecimal monto = json.getJsonNumber("monto").bigDecimalValue();
        String fechaPago = json.getString("fechaPago");
        int cmetodopago = json.getInt("cmetodopago");
        String numeroReferencia = json.containsKey("numeroReferencia") && !json.isNull("numeroReferencia")
                ? json.getString("numeroReferencia") : null;
        String observaciones = json.containsKey("observaciones") && !json.isNull("observaciones")
                ? json.getString("observaciones") : null;

        Pago pago = new Pago();
        pago.setCinscripcionDetalle(idDetalle);
        pago.setCusuario(cusuario);
        pago.setMonto(monto);
        pago.setFechaPago(java.time.LocalDate.parse(fechaPago));
        pago.setCmetodopago(cmetodopago);
        pago.setNumeroReferencia(numeroReferencia);
        pago.setObservaciones(observaciones);
        pago.setActivo(true);
        em.persist(pago);

        BigDecimal totalPagado = em.createQuery(
            "SELECT COALESCE(SUM(pg.monto), 0) FROM Pago pg WHERE pg.cinscripcionDetalle = :idDetalle AND pg.activo = true",
            BigDecimal.class
        ).setParameter("idDetalle", idDetalle).getSingleResult();

        CostoInscripcion costoEntity = em.createQuery(
            "SELECT c FROM CostoInscripcion c WHERE c.activo = true ORDER BY c.id",
            CostoInscripcion.class
        ).setMaxResults(1).getResultStream().findFirst().orElse(null);
        BigDecimal costo = costoEntity != null ? costoEntity.getMonto() : BigDecimal.valueOf(15);

        Integer nuevoEstado;
        if (totalPagado.compareTo(costo) >= 0) {
            nuevoEstado = 2;
        } else if (totalPagado.compareTo(BigDecimal.ZERO) > 0) {
            nuevoEstado = 4;
        } else {
            nuevoEstado = 1;
        }

        InscripcionDetalle det = em.find(InscripcionDetalle.class, idDetalle);
        det.setCestadoinscripcion(nuevoEstado);

        em.flush();

        if (nuevoEstado == 2) {
            emailService.enviarCorreoPagoTotal(det.getCinscripcionCabecera());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("idPago", pago.getId());
        result.put("totalPagado", totalPagado);
        result.put("costo", costo);
        result.put("pendiente", costo.subtract(totalPagado));
        result.put("nuevoEstado", nuevoEstado);
        result.put("idDetalle", det.getId());
        return result;
    }
}
