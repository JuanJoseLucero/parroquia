package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.FechaCalendario;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;

@Stateless
@Transactional
public class FechaCalendarioFacade extends GenericDAO<FechaCalendario, Integer> {
    public FechaCalendarioFacade() { super(FechaCalendario.class); }
}
