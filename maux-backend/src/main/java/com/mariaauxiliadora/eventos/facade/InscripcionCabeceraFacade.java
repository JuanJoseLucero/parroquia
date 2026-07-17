package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.InscripcionCabecera;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;

@Stateless
@Transactional
public class InscripcionCabeceraFacade extends GenericDAO<InscripcionCabecera, Integer> {
    public InscripcionCabeceraFacade() { super(InscripcionCabecera.class); }
}
