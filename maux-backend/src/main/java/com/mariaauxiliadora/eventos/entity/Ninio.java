package com.mariaauxiliadora.eventos.entity;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(schema = "catequesis", name = "tninio")
public class Ninio implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "cpersona")
    private Integer cpersona;

    @Column(name = "cgrupo")
    private Integer cgrupo;

    @Column(length = 1)
    private String sexo;

    @Column(columnDefinition = "TEXT")
    private String alergias;

    @Column(name = "condiciones_medicas", columnDefinition = "TEXT")
    private String condicionesMedicas;

    @Column(name = "ctaller_deportivo")
    private Integer ctallerDeportivo;

    @Column(name = "ctaller_aulico")
    private Integer ctallerAulico;

    @Column(name = "cpadre")
    private Integer cpadre;

    @Column(name = "cmadre")
    private Integer cmadre;

    @Column(name = "crepresentante")
    private Integer crepresentante;

    @Column(nullable = false)
    private Boolean activo = true;

    public Ninio() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getCpersona() { return cpersona; }
    public void setCpersona(Integer cpersona) { this.cpersona = cpersona; }

    public Integer getCgrupo() { return cgrupo; }
    public void setCgrupo(Integer cgrupo) { this.cgrupo = cgrupo; }

    public String getSexo() { return sexo; }
    public void setSexo(String sexo) { this.sexo = sexo; }

    public String getAlergias() { return alergias; }
    public void setAlergias(String alergias) { this.alergias = alergias; }

    public String getCondicionesMedicas() { return condicionesMedicas; }
    public void setCondicionesMedicas(String condicionesMedicas) { this.condicionesMedicas = condicionesMedicas; }

    public Integer getCtallerDeportivo() { return ctallerDeportivo; }
    public void setCtallerDeportivo(Integer ctallerDeportivo) { this.ctallerDeportivo = ctallerDeportivo; }

    public Integer getCtallerAulico() { return ctallerAulico; }
    public void setCtallerAulico(Integer ctallerAulico) { this.ctallerAulico = ctallerAulico; }

    public Integer getCpadre() { return cpadre; }
    public void setCpadre(Integer cpadre) { this.cpadre = cpadre; }

    public Integer getCmadre() { return cmadre; }
    public void setCmadre(Integer cmadre) { this.cmadre = cmadre; }

    public Integer getCrepresentante() { return crepresentante; }
    public void setCrepresentante(Integer crepresentante) { this.crepresentante = crepresentante; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
