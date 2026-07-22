package com.mariaauxiliadora.eventos.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;

@Entity
@Table(schema = "eventos", name = "tsacramentos")
public class Sacramento implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "tninio", nullable = false)
    private Integer tninio;

    @Column(name = "bautizado")
    private Boolean bautizado = false;

    @Column(name = "bautizado_fecha")
    private LocalDate bautizadoFecha;

    @Column(name = "bautizado_parroquia", length = 200)
    private String bautizadoParroquia;

    @Column(name = "eucaristia")
    private Boolean eucaristia = false;

    @Column(name = "eucaristia_fecha")
    private LocalDate eucaristiaFecha;

    @Column(name = "eucaristia_parroquia", length = 200)
    private String eucaristiaParroquia;

    @Column(nullable = false)
    private Boolean activo = true;

    public Sacramento() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getTninio() { return tninio; }
    public void setTninio(Integer tninio) { this.tninio = tninio; }

    public Boolean getBautizado() { return bautizado; }
    public void setBautizado(Boolean bautizado) { this.bautizado = bautizado; }

    public LocalDate getBautizadoFecha() { return bautizadoFecha; }
    public void setBautizadoFecha(LocalDate bautizadoFecha) { this.bautizadoFecha = bautizadoFecha; }

    public String getBautizadoParroquia() { return bautizadoParroquia; }
    public void setBautizadoParroquia(String bautizadoParroquia) { this.bautizadoParroquia = bautizadoParroquia; }

    public Boolean getEucaristia() { return eucaristia; }
    public void setEucaristia(Boolean eucaristia) { this.eucaristia = eucaristia; }

    public LocalDate getEucaristiaFecha() { return eucaristiaFecha; }
    public void setEucaristiaFecha(LocalDate eucaristiaFecha) { this.eucaristiaFecha = eucaristiaFecha; }

    public String getEucaristiaParroquia() { return eucaristiaParroquia; }
    public void setEucaristiaParroquia(String eucaristiaParroquia) { this.eucaristiaParroquia = eucaristiaParroquia; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
