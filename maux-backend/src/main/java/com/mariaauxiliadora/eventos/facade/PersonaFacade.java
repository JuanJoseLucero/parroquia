package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.Persona;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;

@Stateless
@Transactional
public class PersonaFacade extends GenericDAO<Persona, Integer> {
    public PersonaFacade() { super(Persona.class); }
}
