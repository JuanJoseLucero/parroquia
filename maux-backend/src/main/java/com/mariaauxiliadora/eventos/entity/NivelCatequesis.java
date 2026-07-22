package com.mariaauxiliadora.eventos.entity;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(schema = "eventos", name = "tnivelcatequesis")
public class NivelCatequesis implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false)
    private Boolean activo = true;

    public NivelCatequesis() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
