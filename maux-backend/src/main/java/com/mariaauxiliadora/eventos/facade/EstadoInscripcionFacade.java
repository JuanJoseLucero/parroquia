package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.EstadoInscripcion;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;

@Stateless
@Transactional
public class EstadoInscripcionFacade extends GenericDAO<EstadoInscripcion, Integer> {
    public EstadoInscripcionFacade() { super(EstadoInscripcion.class); }
}
