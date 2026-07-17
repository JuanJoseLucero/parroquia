package com.mariaauxiliadora.eventos.entity;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(schema = "eventos", name = "ttaller")
public class Taller implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 10)
    private String siglas;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 10)
    private String tipo;

    @Column(name = "rango_edad", nullable = false, length = 5)
    private String rangoEdad;

    @Column(nullable = false)
    private Boolean activo = true;

    public Taller() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getSiglas() { return siglas; }
    public void setSiglas(String siglas) { this.siglas = siglas; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getRangoEdad() { return rangoEdad; }
    public void setRangoEdad(String rangoEdad) { this.rangoEdad = rangoEdad; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
