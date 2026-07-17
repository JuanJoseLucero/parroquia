package com.mariaauxiliadora.eventos.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(schema = "eventos", name = "tpago")
public class Pago implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "cinscripcion_detalle")
    private Integer cinscripcionDetalle;

    @Column(name = "cusuario")
    private Integer cusuario;

    @Column(name = "monto")
    private BigDecimal monto;

    @Column(name = "fecha_pago")
    private LocalDate fechaPago;

    @Column(name = "cmetodopago")
    private Integer cmetodopago;

    @Column(name = "numero_referencia")
    private String numeroReferencia;

    @Column(name = "observaciones")
    private String observaciones;

    @Column(nullable = false)
    private Boolean activo = true;

    public Pago() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getCinscripcionDetalle() { return cinscripcionDetalle; }
    public void setCinscripcionDetalle(Integer cinscripcionDetalle) { this.cinscripcionDetalle = cinscripcionDetalle; }

    public Integer getCusuario() { return cusuario; }
    public void setCusuario(Integer cusuario) { this.cusuario = cusuario; }

    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }

    public LocalDate getFechaPago() { return fechaPago; }
    public void setFechaPago(LocalDate fechaPago) { this.fechaPago = fechaPago; }

    public Integer getCmetodopago() { return cmetodopago; }
    public void setCmetodopago(Integer cmetodopago) { this.cmetodopago = cmetodopago; }

    public String getNumeroReferencia() { return numeroReferencia; }
    public void setNumeroReferencia(String numeroReferencia) { this.numeroReferencia = numeroReferencia; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
