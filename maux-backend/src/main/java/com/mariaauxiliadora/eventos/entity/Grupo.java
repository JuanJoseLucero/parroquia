package com.mariaauxiliadora.eventos.entity;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(schema = "eventos", name = "tgrupo")
public class Grupo implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "nombre_grupo", nullable = false)
    private String nombreGrupo;

    @Column(name = "edad")
    private Integer edad;

    @Column(name = "anotaciones")
    private String anotaciones;

    @Column(nullable = false)
    private Boolean activo = true;

    public Grupo() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getNombreGrupo() { return nombreGrupo; }
    public void setNombreGrupo(String nombreGrupo) { this.nombreGrupo = nombreGrupo; }

    public Integer getEdad() { return edad; }
    public void setEdad(Integer edad) { this.edad = edad; }

    public String getAnotaciones() { return anotaciones; }
    public void setAnotaciones(String anotaciones) { this.anotaciones = anotaciones; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
