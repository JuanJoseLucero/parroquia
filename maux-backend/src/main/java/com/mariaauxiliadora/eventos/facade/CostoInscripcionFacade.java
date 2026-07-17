package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.CostoInscripcion;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;

@Stateless
@Transactional
public class CostoInscripcionFacade extends GenericDAO<CostoInscripcion, Integer> {
    public CostoInscripcionFacade() { super(CostoInscripcion.class); }
}
