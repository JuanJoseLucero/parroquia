package com.mariaauxiliadora.eventos.integrations;

public interface IntegracionTercero<T> {

    void connectar() throws Exception;

    void enviar(T payload) throws Exception;

    T recuperar(String id) throws Exception;
}
