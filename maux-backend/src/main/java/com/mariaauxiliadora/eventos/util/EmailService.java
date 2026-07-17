package com.mariaauxiliadora.eventos.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mariaauxiliadora.eventos.entity.InscripcionCabecera;
import com.mariaauxiliadora.eventos.entity.InscripcionDetalle;
import com.mariaauxiliadora.eventos.entity.Ninio;
import com.mariaauxiliadora.eventos.entity.Persona;
import com.mariaauxiliadora.eventos.entity.Representante;
import com.mariaauxiliadora.eventos.integrations.AsyncEmailSender;
import com.mariaauxiliadora.eventos.integrations.BrevoIntegracion;
import com.mariaauxiliadora.eventos.integrations.IntegracionTercero;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

@Stateless
public class EmailService {

    @Inject
    private EmailProperties emailProperties;

    @PersistenceContext(unitName = "MAUXPU")
    private EntityManager em;

    private static final AsyncEmailSender asyncEmailSender = new AsyncEmailSender();
    private static final Logger log = Logger.getLogger(EmailService.class.getName());

    public void enviarCorreoInscripcion(Persona representante, List<Map<String, String>> ninios, Integer idCabecera) {
        if (representante == null || representante.getEmail() == null || representante.getEmail().isBlank()) {
            return;
        }

        String repName = representante.getNombres() + " " + representante.getApellidos();
        String html = buildHtml(representante, ninios, idCabecera);
        String subject = "Inscripción Registrada #" + idCabecera + " - " + repName;

        Map<String, String> attachment = null;
        try {
            Path filePath = Path.of("/opt", "CONSENTIMIENTO COLONIA OCJSMA 2026.docx");
            if (Files.exists(filePath)) {
                byte[] content = Files.readAllBytes(filePath);
                String base64 = Base64.getEncoder().encodeToString(content);
                attachment = Map.of("name", "CONSENTIMIENTO_COLONIA_OCJSMA_2026.docx", "content", base64);
            }
        } catch (Exception e) {
            log.warning("No se pudo adjuntar consentimiento: " + e.getMessage());
        }

        enviarEmailAsync(representante, subject, html, idCabecera, attachment);
    }

    public void enviarCorreoPagoTotal(Integer idCabecera) {
        if (idCabecera == null) return;

        try {
            InscripcionCabecera cab = em.find(InscripcionCabecera.class, idCabecera);
            if (cab == null || !cab.getActivo()) return;

            List<InscripcionDetalle> detalles = em.createQuery(
                    "SELECT d FROM InscripcionDetalle d WHERE d.cinscripcionCabecera = :idC AND d.activo = true",
                    InscripcionDetalle.class)
                    .setParameter("idC", idCabecera)
                    .getResultList();

            if (detalles.isEmpty()) return;

            boolean todosPagados = detalles.stream()
                    .allMatch(d -> d.getCestadoinscripcion() != null && d.getCestadoinscripcion() == 2);
            if (!todosPagados) return;

            Representante rep = em.find(Representante.class, cab.getCrepresentante());
            if (rep == null) return;
            Persona persona = em.find(Persona.class, rep.getCpersona());
            if (persona == null || persona.getEmail() == null || persona.getEmail().isBlank()) return;

            List<Map<String, String>> ninios = new ArrayList<>();
            for (InscripcionDetalle d : detalles) {
                Ninio n = em.find(Ninio.class, d.getTninio());
                if (n != null) {
                    Persona p = em.find(Persona.class, n.getCpersona());
                    if (p != null) {
                        Map<String, String> ninio = new HashMap<>();
                        ninio.put("nombre", p.getNombres() + " " + p.getApellidos());
                        ninios.add(ninio);
                    }
                }
            }

            String repName = persona.getNombres() + " " + persona.getApellidos();
            String html = buildPagoTotalHtml(persona, ninios, idCabecera);
            String subject = "Pago Completado - Inscripción #" + idCabecera + " - " + repName;
            enviarEmailAsync(persona, subject, html, idCabecera, null);

        } catch (Exception e) {
            log.severe("Error al enviar email de pago total #" + idCabecera + ": " + e.getMessage());
        }
    }

    private void enviarEmailAsync(Persona destinatario, String subject, String html, Integer idCabecera, Map<String, String> attachment) {
        try {
            Map<String, String> headers = new HashMap<>();
            headers.put("accept", "application/json");
            headers.put("api-key", emailProperties.get("api.key"));
            headers.put("content-type", "application/json");

            IntegracionTercero<Object> servicio = new BrevoIntegracion(
                    "https://api.brevo.com/v3/smtp/email",
                    headers);

            ObjectMapper mapper = new ObjectMapper();
            ObjectNode payload = mapper.createObjectNode();

            ObjectNode sender = mapper.createObjectNode();
            sender.put("name", emailProperties.get("sender.name"));
            sender.put("email", emailProperties.get("sender.email"));
            payload.set("sender", sender);

            ArrayNode toArray = mapper.createArrayNode();
            ObjectNode to = mapper.createObjectNode();
            to.put("email", destinatario.getEmail());
            to.put("name", destinatario.getNombres() + " " + destinatario.getApellidos());
            toArray.add(to);
            payload.set("to", toArray);

            payload.put("subject", subject);
            payload.put("htmlContent", html);

            if (attachment != null) {
                ArrayNode attArray = mapper.createArrayNode();
                ObjectNode att = mapper.createObjectNode();
                att.put("name", attachment.get("name"));
                att.put("content", attachment.get("content"));
                attArray.add(att);
                payload.set("attachment", attArray);
            }

            asyncEmailSender.enviarAsync(() -> {
                try {
                    servicio.enviar(payload);
                    log.info("Email enviado a " + destinatario.getEmail() + " - " + subject);
                } catch (Exception e) {
                    log.severe("Error al enviar email a " + destinatario.getEmail() + ": " + e.getMessage());
                }
            });

        } catch (Exception e) {
            log.severe("Error al preparar email: " + e.getMessage());
        }
    }

    private String buildHtml(Persona representante, List<Map<String, String>> ninios, Integer idCabecera) {
        StringBuilder sb = new StringBuilder();
        sb.append("<html><body style=\"font-family: Arial, sans-serif;\">");
        sb.append("<h1>¡Inscripción Registrada!</h1>");
        sb.append("<p>Estimado/a <strong>").append(representante.getNombres()).append(" ").append(representante.getApellidos()).append("</strong>,</p>");
        sb.append("<p>Su inscripción ha sido registrada exitosamente con el código <strong>#").append(idCabecera).append("</strong>.</p>");

        if (ninios != null && !ninios.isEmpty()) {
            sb.append("<h3>Niños inscritos:</h3>");
            sb.append("<ul>");
            for (Map<String, String> ninio : ninios) {
                sb.append("<li>").append(ninio.getOrDefault("nombre", "—")).append("</li>");
            }
            sb.append("</ul>");
        }

        sb.append("<br/><p style=\"color: #d9534f; font-weight: bold;\">IMPORTANTE: Para confirmar la inscripción, debe realizar el pago correspondiente. Presente el código <strong>#").append(idCabecera).append("</strong> en secretaría para cancelar el valor de la matrícula.</p>");

        sb.append("<p style=\"color: #856404; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 8px; padding: 12px; margin-top: 15px;\">");
        sb.append("<strong>📄 Documentos requeridos:</strong> Para completar el proceso, por favor envíe una copia de la cédula del representante y de cada niño inscrito al <strong>WhatsApp 099 241 5352</strong> o al correo <strong>ocjmacuenca@gmail.com</strong>.");
        sb.append("</p>");

        sb.append("<div style=\"background:#f8f9fa;border:1px solid #ddd;border-radius:8px;padding:15px;margin-top:20px\">");
        sb.append("<h3>📌 Información del Oratorio</h3>");
        sb.append("<p><strong>📅 Fechas:</strong> 26 de Julio al 14 de Agosto</p>");
        sb.append("<p><strong>🕐 Horario:</strong> Lunes a Jueves 14:00–18:00, Viernes 8:00–18:00</p>");
        sb.append("<p><strong>📋 Permisos:</strong> Debe firmar y enviar los permisos para sus niños. Acérquese a secretaría o revise el archivo adjunto.</p>");
        sb.append("<p><strong>💳 Transferencia:</strong></p>");
        sb.append("<ul>");
        sb.append("<li>Parroquia María Auxiliadora</li>");
        sb.append("<li>Banco Pacífico — Cta. Cte. 0089078-2</li>");
        sb.append("<li>RUC 0190323609001</li>");
        sb.append("<li>mariauxiliadora@salesianos.org.ec</li>");
        sb.append("</ul>");
        sb.append("<p>Envíe el comprobante al <strong>WhatsApp 0992415352</strong></p>");
        sb.append("</div>");

        sb.append("<br/><p>Gracias por confiar en <strong>María Auxiliadora</strong>.</p>");
        sb.append("</body></html>");
        return sb.toString();
    }

    private String buildPagoTotalHtml(Persona representante, List<Map<String, String>> ninios, Integer idCabecera) {
        StringBuilder sb = new StringBuilder();
        sb.append("<html><body style=\"font-family: Arial, sans-serif;\">");
        sb.append("<h1 style=\"color: #28a745;\">¡Pago Completado!</h1>");
        sb.append("<p>Estimado/a <strong>").append(representante.getNombres()).append(" ").append(representante.getApellidos()).append("</strong>,</p>");
        sb.append("<p>Hemos recibido el pago total de la inscripción <strong>#").append(idCabecera).append("</strong>. Su registro está completamente confirmado.</p>");

        if (ninios != null && !ninios.isEmpty()) {
            sb.append("<h3>Niños inscritos:</h3>");
            sb.append("<ul>");
            for (Map<String, String> ninio : ninios) {
                sb.append("<li>").append(ninio.getOrDefault("nombre", "—")).append("</li>");
            }
            sb.append("</ul>");
        }

        sb.append("<br/><p>Ya puede acercarse a secretaría para retirar los materiales y recibir más información sobre el inicio de las colonias.</p>");
        sb.append("<br/><p>Gracias por confiar en <strong>María Auxiliadora</strong>.</p>");
        sb.append("</body></html>");
        return sb.toString();
    }
}
