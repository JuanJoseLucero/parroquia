package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.Sacramento;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;

@Stateless
@Transactional
public class SacramentoFacade extends GenericDAO<Sacramento, Integer> {
    public SacramentoFacade() { super(Sacramento.class); }
}
