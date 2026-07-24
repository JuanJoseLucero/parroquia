package com.mariaauxiliadora.eventos.entity;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(schema = "catequesis", name = "tpadre")
public class Padre implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "cpersona", nullable = false)
    private Integer cpersona;

    @Column(name = "tipo_padre", nullable = false, length = 10)
    private String tipoPadre;

    @Column(name = "ocupacion", length = 100)
    private String ocupacion;

    @Column(name = "lugar_trabajo", length = 200)
    private String lugarTrabajo;

    @Column(nullable = false)
    private Boolean activo = true;

    public Padre() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getCpersona() { return cpersona; }
    public void setCpersona(Integer cpersona) { this.cpersona = cpersona; }

    public String getTipoPadre() { return tipoPadre; }
    public void setTipoPadre(String tipoPadre) { this.tipoPadre = tipoPadre; }

    public String getOcupacion() { return ocupacion; }
    public void setOcupacion(String ocupacion) { this.ocupacion = ocupacion; }

    public String getLugarTrabajo() { return lugarTrabajo; }
    public void setLugarTrabajo(String lugarTrabajo) { this.lugarTrabajo = lugarTrabajo; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
