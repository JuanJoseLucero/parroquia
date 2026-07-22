package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.Turno;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;

@Stateless
@Transactional
public class TurnoFacade extends GenericDAO<Turno, Integer> {
    public TurnoFacade() { super(Turno.class); }
}
