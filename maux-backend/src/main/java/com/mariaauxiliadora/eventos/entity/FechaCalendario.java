package com.mariaauxiliadora.eventos.entity;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(schema = "catequesis", name = "tfechascalendario")
public class FechaCalendario implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "fecha", nullable = false)
    private String fecha;

    @Column(name = "descripcion_dia")
    private String descripcionDia;

    @Column(nullable = false)
    private Boolean activo = true;

    public FechaCalendario() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }

    public String getDescripcionDia() { return descripcionDia; }
    public void setDescripcionDia(String descripcionDia) { this.descripcionDia = descripcionDia; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
