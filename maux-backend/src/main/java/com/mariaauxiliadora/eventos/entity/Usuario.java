package com.mariaauxiliadora.eventos.entity;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(schema = "catequesis", name = "tusuario")
public class Usuario implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "alias", nullable = false)
    private String alias;

    @Column(name = "cpersona")
    private Integer cpersona;

    @Column(nullable = false)
    private Boolean activo = true;

    public Usuario() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getAlias() { return alias; }
    public void setAlias(String alias) { this.alias = alias; }

    public Integer getCpersona() { return cpersona; }
    public void setCpersona(Integer cpersona) { this.cpersona = cpersona; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
