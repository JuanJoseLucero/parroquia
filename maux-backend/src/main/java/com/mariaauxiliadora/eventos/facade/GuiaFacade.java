package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.Guia;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;

@Stateless
@Transactional
public class GuiaFacade extends GenericDAO<Guia, Integer> {
    public GuiaFacade() { super(Guia.class); }
}
