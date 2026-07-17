package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.GrupoGuia;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;

@Stateless
@Transactional
public class GrupoGuiaFacade extends GenericDAO<GrupoGuia, Integer> {
    public GrupoGuiaFacade() { super(GrupoGuia.class); }
}
