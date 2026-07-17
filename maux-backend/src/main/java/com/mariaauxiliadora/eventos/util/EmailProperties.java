package com.mariaauxiliadora.eventos.util;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Named;
import java.io.Serializable;
import java.util.Properties;
import java.util.logging.Logger;

@Named
@ApplicationScoped
public class EmailProperties implements Serializable {

    private Properties properties;
    private static final Logger log = Logger.getLogger(EmailProperties.class.getName());

    @PostConstruct
    public void init() {
        properties = new Properties();
        try {
            properties.load(getClass().getClassLoader().getResourceAsStream("email.properties"));
        } catch (Exception e) {
            log.severe("Error loading email.properties: " + e.getMessage());
        }
    }

    public String get(String key) {
        return properties.getProperty(key);
    }
}
