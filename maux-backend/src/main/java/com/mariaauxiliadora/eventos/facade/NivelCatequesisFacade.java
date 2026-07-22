package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.NivelCatequesis;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;

@Stateless
@Transactional
public class NivelCatequesisFacade extends GenericDAO<NivelCatequesis, Integer> {
    public NivelCatequesisFacade() { super(NivelCatequesis.class); }
}
