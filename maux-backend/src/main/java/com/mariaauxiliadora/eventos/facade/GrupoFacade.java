package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.Grupo;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;

@Stateless
@Transactional
public class GrupoFacade extends GenericDAO<Grupo, Integer> {
    public GrupoFacade() { super(Grupo.class); }
}
