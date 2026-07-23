package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.Evento;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;
import java.util.Optional;

@Stateless
@Transactional
public class EventoFacade extends GenericDAO<Evento, Integer> {
    public EventoFacade() { super(Evento.class); }

    public Optional<Evento> findActivoByAnio(int anio) {
        try {
            Evento e = em.createQuery(
                "SELECT e FROM Evento e WHERE e.anio = :anio AND e.activo = true",
                Evento.class
            ).setParameter("anio", anio).getSingleResult();
            return Optional.of(e);
        } catch (Exception ex) {
            return Optional.empty();
        }
    }
}
