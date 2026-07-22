package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.Padre;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;

@Stateless
@Transactional
public class PadreFacade extends GenericDAO<Padre, Integer> {
    public PadreFacade() { super(Padre.class); }
}
