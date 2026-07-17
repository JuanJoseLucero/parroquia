package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.Representante;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;

@Stateless
@Transactional
public class RepresentanteFacade extends GenericDAO<Representante, Integer> {
    public RepresentanteFacade() { super(Representante.class); }
}
