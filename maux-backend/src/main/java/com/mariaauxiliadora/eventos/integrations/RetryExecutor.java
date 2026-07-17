package com.mariaauxiliadora.eventos.integrations;

public class RetryExecutor {

    public static void execute(int maxRetries, long delayMs, RetryableOperation operation) throws Exception {
        int attempt = 0;
        while (true) {
            try {
                operation.execute();
                return;
            } catch (Exception e) {
                attempt++;
                if (attempt >= maxRetries) {
                    throw new RuntimeException("Falló después de " + attempt + " intentos", e);
                }
                System.out.println("Reintentando intento " + attempt);
                Thread.sleep(delayMs);
            }
        }
    }

    @FunctionalInterface
    public interface RetryableOperation {
        void execute() throws Exception;
    }
}
