package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.InscripcionDetalle;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;

@Stateless
@Transactional
public class InscripcionDetalleFacade extends GenericDAO<InscripcionDetalle, Integer> {
    public InscripcionDetalleFacade() { super(InscripcionDetalle.class); }
}
