package com.mariaauxiliadora.eventos.integrations;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AsyncEmailSender {

    private final ExecutorService executor = Executors.newFixedThreadPool(3);

    public void enviarAsync(Runnable tarea) {
        executor.submit(tarea);
    }

    public void shutdown() {
        executor.shutdown();
    }
}
