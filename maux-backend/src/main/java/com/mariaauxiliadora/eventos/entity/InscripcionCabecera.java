package com.mariaauxiliadora.eventos.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;

@Entity
@Table(schema = "catequesis", name = "tinscripcionCabecera")
public class InscripcionCabecera implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "fecha")
    private LocalDate fecha;

    @Column(name = "cusuario")
    private Integer cusuario;

    @Column(name = "crepresentante")
    private Integer crepresentante;

    @Column(name = "cevento")
    private Integer cevento;

    @Column(name = "notas")
    private String notas;

    @Column(nullable = false)
    private Boolean activo = true;

    public InscripcionCabecera() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public Integer getCusuario() { return cusuario; }
    public void setCusuario(Integer cusuario) { this.cusuario = cusuario; }
    public Integer getCrepresentante() { return crepresentante; }
    public void setCrepresentante(Integer crepresentante) { this.crepresentante = crepresentante; }
    public Integer getCevento() { return cevento; }
    public void setCevento(Integer cevento) { this.cevento = cevento; }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
