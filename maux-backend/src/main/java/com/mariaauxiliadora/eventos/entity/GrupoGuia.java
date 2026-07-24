package com.mariaauxiliadora.eventos.entity;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(schema = "catequesis", name = "tgrupoGuia")
public class GrupoGuia implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "cgrupo")
    private Integer cgrupo;

    @Column(name = "cguia")
    private Integer cguia;

    @Column(name = "rol")
    private String rol;

    @Column(nullable = false)
    private Boolean activo = true;

    public GrupoGuia() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getCgrupo() { return cgrupo; }
    public void setCgrupo(Integer cgrupo) { this.cgrupo = cgrupo; }

    public Integer getCguia() { return cguia; }
    public void setCguia(Integer cguia) { this.cguia = cguia; }

    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
