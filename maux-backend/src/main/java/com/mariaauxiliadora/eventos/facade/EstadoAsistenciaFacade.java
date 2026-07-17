package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.EstadoAsistencia;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;

@Stateless
@Transactional
public class EstadoAsistenciaFacade extends GenericDAO<EstadoAsistencia, Integer> {
    public EstadoAsistenciaFacade() { super(EstadoAsistencia.class); }
}
