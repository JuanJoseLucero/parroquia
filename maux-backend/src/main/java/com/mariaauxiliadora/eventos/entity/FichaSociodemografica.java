package com.mariaauxiliadora.eventos.entity;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(schema = "catequesis", name = "tfichasociodemografica")
public class FichaSociodemografica implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "cinscripciondetalle", nullable = false, unique = true)
    private Integer cinscripcionDetalle;

    @Column(name = "sector_residencia", length = 100)
    private String sectorResidencia;

    @Column(name = "tipo_institucion", length = 30)
    private String tipoInstitucion;

    @Column(name = "institucion_educativa", length = 200)
    private String institucionEducativa;

    @Column(name = "nivel_educativo", length = 50)
    private String nivelEducativo;

    @Column(name = "como_conocio", length = 30)
    private String comoConocio;

    @Column(name = "como_conocio_otro", columnDefinition = "TEXT")
    private String comoConocioOtro;

    @Column(nullable = false)
    private Boolean activo = true;

    public FichaSociodemografica() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getCinscripcionDetalle() { return cinscripcionDetalle; }
    public void setCinscripcionDetalle(Integer cinscripcionDetalle) { this.cinscripcionDetalle = cinscripcionDetalle; }

    public String getSectorResidencia() { return sectorResidencia; }
    public void setSectorResidencia(String sectorResidencia) { this.sectorResidencia = sectorResidencia; }

    public String getTipoInstitucion() { return tipoInstitucion; }
    public void setTipoInstitucion(String tipoInstitucion) { this.tipoInstitucion = tipoInstitucion; }

    public String getInstitucionEducativa() { return institucionEducativa; }
    public void setInstitucionEducativa(String institucionEducativa) { this.institucionEducativa = institucionEducativa; }

    public String getNivelEducativo() { return nivelEducativo; }
    public void setNivelEducativo(String nivelEducativo) { this.nivelEducativo = nivelEducativo; }

    public String getComoConocio() { return comoConocio; }
    public void setComoConocio(String comoConocio) { this.comoConocio = comoConocio; }

    public String getComoConocioOtro() { return comoConocioOtro; }
    public void setComoConocioOtro(String comoConocioOtro) { this.comoConocioOtro = comoConocioOtro; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
