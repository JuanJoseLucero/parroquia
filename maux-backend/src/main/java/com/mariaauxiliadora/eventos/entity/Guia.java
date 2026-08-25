package com.mariaauxiliadora.eventos.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;

@Entity
@Table(schema = "catequesis", name = "tguia")
public class Guia implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "cpersona")
    private Integer cpersona;

    @Column(length = 10)
    private String siglas;

    // Información familiar
    @Column(name = "nombre_padre", length = 200)
    private String nombrePadre;

    @Column(name = "nombre_madre", length = 200)
    private String nombreMadre;

    @Column(name = "crepresentante")
    private Integer crepresentante;

    // Información sacramental
    @Column(name = "bautizado")
    private Boolean bautizado = false;

    @Column(name = "bautizado_fecha")
    private LocalDate bautizadoFecha;

    @Column(name = "primera_comunion_fecha")
    private LocalDate primeraComunionFecha;

    @Column(name = "confirmacion_fecha")
    private LocalDate confirmacionFecha;

    @Column(name = "matrimonio")
    private Boolean matrimonio = false;

    @Column(name = "matrimonio_fecha")
    private LocalDate matrimonioFecha;

    // Información pastoral
    @Column(name = "parroquia", length = 200)
    private String parroquia;

    @Column(name = "grupo_movimiento", length = 200)
    private String grupoMovimiento;

    @Column(name = "anios_experiencia")
    private Integer aniosExperiencia;

    @Column(name = "cnivel_catequesis")
    private Integer cnivelCatequesis;

    @Column(name = "disponibilidad_horario", columnDefinition = "TEXT")
    private String disponibilidadHorario;

    // Información de salud
    @Column(name = "tipo_sangre", length = 5)
    private String tipoSangre;

    @Column(name = "alergias_enfermedades", columnDefinition = "TEXT")
    private String alergiasEnfermedades;

    @Column(name = "contacto_emergencia_nombre", length = 200)
    private String contactoEmergenciaNombre;

    @Column(name = "contacto_emergencia_telefono", length = 20)
    private String contactoEmergenciaTelefono;

    // Autorizaciones
    @Column(name = "acepta_reglamento", nullable = false)
    private Boolean aceptaReglamento = false;

    @Column(name = "autoriza_datos", nullable = false)
    private Boolean autorizaDatos = false;

    @Column(name = "autoriza_fotos", nullable = false)
    private Boolean autorizaFotos = false;

    @Column(nullable = false)
    private Boolean activo = true;

    public Guia() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getCpersona() { return cpersona; }
    public void setCpersona(Integer cpersona) { this.cpersona = cpersona; }

    public String getSiglas() { return siglas; }
    public void setSiglas(String siglas) { this.siglas = siglas; }

    public String getNombrePadre() { return nombrePadre; }
    public void setNombrePadre(String nombrePadre) { this.nombrePadre = nombrePadre; }

    public String getNombreMadre() { return nombreMadre; }
    public void setNombreMadre(String nombreMadre) { this.nombreMadre = nombreMadre; }

    public Integer getCrepresentante() { return crepresentante; }
    public void setCrepresentante(Integer crepresentante) { this.crepresentante = crepresentante; }

    public Boolean getBautizado() { return bautizado; }
    public void setBautizado(Boolean bautizado) { this.bautizado = bautizado; }

    public LocalDate getBautizadoFecha() { return bautizadoFecha; }
    public void setBautizadoFecha(LocalDate bautizadoFecha) { this.bautizadoFecha = bautizadoFecha; }

    public LocalDate getPrimeraComunionFecha() { return primeraComunionFecha; }
    public void setPrimeraComunionFecha(LocalDate primeraComunionFecha) { this.primeraComunionFecha = primeraComunionFecha; }

    public LocalDate getConfirmacionFecha() { return confirmacionFecha; }
    public void setConfirmacionFecha(LocalDate confirmacionFecha) { this.confirmacionFecha = confirmacionFecha; }

    public Boolean getMatrimonio() { return matrimonio; }
    public void setMatrimonio(Boolean matrimonio) { this.matrimonio = matrimonio; }

    public LocalDate getMatrimonioFecha() { return matrimonioFecha; }
    public void setMatrimonioFecha(LocalDate matrimonioFecha) { this.matrimonioFecha = matrimonioFecha; }

    public String getParroquia() { return parroquia; }
    public void setParroquia(String parroquia) { this.parroquia = parroquia; }

    public String getGrupoMovimiento() { return grupoMovimiento; }
    public void setGrupoMovimiento(String grupoMovimiento) { this.grupoMovimiento = grupoMovimiento; }

    public Integer getAniosExperiencia() { return aniosExperiencia; }
    public void setAniosExperiencia(Integer aniosExperiencia) { this.aniosExperiencia = aniosExperiencia; }

    public Integer getCnivelCatequesis() { return cnivelCatequesis; }
    public void setCnivelCatequesis(Integer cnivelCatequesis) { this.cnivelCatequesis = cnivelCatequesis; }

    public String getDisponibilidadHorario() { return disponibilidadHorario; }
    public void setDisponibilidadHorario(String disponibilidadHorario) { this.disponibilidadHorario = disponibilidadHorario; }

    public String getTipoSangre() { return tipoSangre; }
    public void setTipoSangre(String tipoSangre) { this.tipoSangre = tipoSangre; }

    public String getAlergiasEnfermedades() { return alergiasEnfermedades; }
    public void setAlergiasEnfermedades(String alergiasEnfermedades) { this.alergiasEnfermedades = alergiasEnfermedades; }

    public String getContactoEmergenciaNombre() { return contactoEmergenciaNombre; }
    public void setContactoEmergenciaNombre(String contactoEmergenciaNombre) { this.contactoEmergenciaNombre = contactoEmergenciaNombre; }

    public String getContactoEmergenciaTelefono() { return contactoEmergenciaTelefono; }
    public void setContactoEmergenciaTelefono(String contactoEmergenciaTelefono) { this.contactoEmergenciaTelefono = contactoEmergenciaTelefono; }

    public Boolean getAceptaReglamento() { return aceptaReglamento; }
    public void setAceptaReglamento(Boolean aceptaReglamento) { this.aceptaReglamento = aceptaReglamento; }

    public Boolean getAutorizaDatos() { return autorizaDatos; }
    public void setAutorizaDatos(Boolean autorizaDatos) { this.autorizaDatos = autorizaDatos; }

    public Boolean getAutorizaFotos() { return autorizaFotos; }
    public void setAutorizaFotos(Boolean autorizaFotos) { this.autorizaFotos = autorizaFotos; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
