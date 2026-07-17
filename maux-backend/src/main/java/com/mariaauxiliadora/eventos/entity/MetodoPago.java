package com.mariaauxiliadora.eventos.entity;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(schema = "eventos", name = "tmetodopago")
public class MetodoPago implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "descripcion")
    private String descripcion;

    @Column(name = "requiere_referencia")
    private Boolean requiereReferencia;

    @Column(nullable = false)
    private Boolean activo = true;

    public MetodoPago() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public Boolean getRequiereReferencia() { return requiereReferencia; }
    public void setRequiereReferencia(Boolean requiereReferencia) { this.requiereReferencia = requiereReferencia; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
