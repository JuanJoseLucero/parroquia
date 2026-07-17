package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.Usuario;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;

@Stateless
@Transactional
public class UsuarioFacade extends GenericDAO<Usuario, Integer> {
    public UsuarioFacade() { super(Usuario.class); }
}
