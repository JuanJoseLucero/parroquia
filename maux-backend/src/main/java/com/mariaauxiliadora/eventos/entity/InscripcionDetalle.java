package com.mariaauxiliadora.eventos.entity;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(schema = "catequesis", name = "tinscripcionDetalle")
public class InscripcionDetalle implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "cinscripcionCabecera")
    private Integer cinscripcionCabecera;

    @Column(name = "tninio")
    private Integer tninio;

    @Column(name = "cestadoinscripcion")
    private Integer cestadoinscripcion;

    @Column(name = "cnivelcatequesis")
    private Integer cnivelcatequesis;

    @Column(name = "cturno")
    private Integer cturno;

    @Column(name = "catequista_anterior")
    private String catequistaAnterior;

    @Column(name = "parroquia_anterior")
    private String parroquiaAnterior;

    @Column(nullable = false)
    private Boolean activo = true;

    public InscripcionDetalle() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getCinscripcionCabecera() { return cinscripcionCabecera; }
    public void setCinscripcionCabecera(Integer cinscripcionCabecera) { this.cinscripcionCabecera = cinscripcionCabecera; }

    public Integer getTninio() { return tninio; }
    public void setTninio(Integer tninio) { this.tninio = tninio; }

    public Integer getCestadoinscripcion() { return cestadoinscripcion; }
    public void setCestadoinscripcion(Integer cestadoinscripcion) { this.cestadoinscripcion = cestadoinscripcion; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public Integer getCnivelcatequesis() { return cnivelcatequesis; }
    public void setCnivelcatequesis(Integer cnivelcatequesis) { this.cnivelcatequesis = cnivelcatequesis; }

    public Integer getCturno() { return cturno; }
    public void setCturno(Integer cturno) { this.cturno = cturno; }

    public String getCatequistaAnterior() { return catequistaAnterior; }
    public void setCatequistaAnterior(String catequistaAnterior) { this.catequistaAnterior = catequistaAnterior; }

    public String getParroquiaAnterior() { return parroquiaAnterior; }
    public void setParroquiaAnterior(String parroquiaAnterior) { this.parroquiaAnterior = parroquiaAnterior; }
}
