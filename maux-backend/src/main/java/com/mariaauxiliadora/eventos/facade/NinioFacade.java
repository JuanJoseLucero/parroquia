package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.Ninio;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;

@Stateless
@Transactional
public class NinioFacade extends GenericDAO<Ninio, Integer> {
    public NinioFacade() { super(Ninio.class); }
}
