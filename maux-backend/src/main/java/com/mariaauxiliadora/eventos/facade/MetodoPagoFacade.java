package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.MetodoPago;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;

@Stateless
@Transactional
public class MetodoPagoFacade extends GenericDAO<MetodoPago, Integer> {
    public MetodoPagoFacade() { super(MetodoPago.class); }
}
