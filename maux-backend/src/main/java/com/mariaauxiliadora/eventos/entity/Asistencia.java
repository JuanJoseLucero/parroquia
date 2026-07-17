package com.mariaauxiliadora.eventos.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalTime;

@Entity
@Table(schema = "eventos", name = "tasistencias")
public class Asistencia implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "cninio")
    private Integer cninio;

    @Column(name = "cfechaasistencia")
    private Integer cfechaasistencia;

    @Column(name = "cestadoasistencia")
    private Integer cestadoasistencia;

    @Column(name = "observaciones")
    private String observaciones;

    @Column(name = "hora_registro")
    private LocalTime horaRegistro;

    @Column(nullable = false)
    private Boolean activo = true;

    public Asistencia() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getCninio() { return cninio; }
    public void setCninio(Integer cninio) { this.cninio = cninio; }

    public Integer getCfechaasistencia() { return cfechaasistencia; }
    public void setCfechaasistencia(Integer cfechaasistencia) { this.cfechaasistencia = cfechaasistencia; }

    public Integer getCestadoasistencia() { return cestadoasistencia; }
    public void setCestadoasistencia(Integer cestadoasistencia) { this.cestadoasistencia = cestadoasistencia; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public LocalTime getHoraRegistro() { return horaRegistro; }
    public void setHoraRegistro(LocalTime horaRegistro) { this.horaRegistro = horaRegistro; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
