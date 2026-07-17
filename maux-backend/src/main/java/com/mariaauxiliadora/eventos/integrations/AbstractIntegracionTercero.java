package com.mariaauxiliadora.eventos.integrations;

import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;

public class AbstractIntegracionTercero<T> implements IntegracionTercero<T> {

    protected String apiUrl;
    protected Map<String, String> headers;

    public AbstractIntegracionTercero(String apiUrl, Map<String, String> headers) {
        this.apiUrl = apiUrl;
        this.headers = headers;
    }

    protected HttpURLConnection crearConexion(String metodo, String urlStr) throws Exception {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod(metodo);
        conn.setDoOutput(true);
        headers.forEach(conn::setRequestProperty);
        return conn;
    }

    @Override
    public void connectar() throws Exception {
        System.out.println("Conectado a " + apiUrl);
    }

    @Override
    public void enviar(T payload) throws Exception {
    }

    @Override
    public T recuperar(String id) throws Exception {
        return null;
    }
}
