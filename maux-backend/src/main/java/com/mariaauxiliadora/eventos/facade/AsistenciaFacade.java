package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.Asistencia;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;

@Stateless
@Transactional
public class AsistenciaFacade extends GenericDAO<Asistencia, Integer> {
    public AsistenciaFacade() { super(Asistencia.class); }
}
