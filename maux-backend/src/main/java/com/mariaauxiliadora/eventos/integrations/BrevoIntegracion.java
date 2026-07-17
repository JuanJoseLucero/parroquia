package com.mariaauxiliadora.eventos.integrations;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.nio.charset.StandardCharsets;
import java.util.Map;

public class BrevoIntegracion extends AbstractIntegracionTercero<Object> {

    private final ObjectMapper mapper = new ObjectMapper();

    public BrevoIntegracion(String apiUrl, Map<String, String> headers) {
        super(apiUrl, headers);
    }

    @Override
    public void enviar(Object payload) throws Exception {
        RetryExecutor.execute(3, 2000, () -> {
            HttpURLConnection conn = crearConexion("POST", apiUrl);
            String json = mapper.writeValueAsString(payload);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(json.getBytes(StandardCharsets.UTF_8));
            }

            int responseCode = conn.getResponseCode();
            if (responseCode >= 200 && responseCode < 300) {
                System.out.println("Email enviado correctamente con BREVO");
            } else {
                System.out.println("Error HTTP: " + responseCode);
            }
        });
    }

    @Override
    public Object recuperar(String id) throws Exception {
        HttpURLConnection conn = crearConexion("GET", apiUrl + "/" + id);
        return conn.getResponseCode();
    }
}
