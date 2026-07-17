package com.mariaauxiliadora.eventos.facade;

import com.mariaauxiliadora.eventos.dao.GenericDAO;
import com.mariaauxiliadora.eventos.entity.Taller;
import jakarta.ejb.Stateless;
import jakarta.transaction.Transactional;
import java.util.List;

@Stateless
@Transactional
public class TallerFacade extends GenericDAO<Taller, Integer> {
    public TallerFacade() { super(Taller.class); }

    public List<Taller> listarPorRangoEdadYTipo(String rangoEdad, String tipo) {
        return em.createQuery(
            "SELECT t FROM Taller t WHERE t.activo = true AND t.rangoEdad = :rangoEdad AND t.tipo = :tipo ORDER BY t.nombre",
            Taller.class
        ).setParameter("rangoEdad", rangoEdad).setParameter("tipo", tipo).getResultList();
    }
    
    public List<Taller> listarPorTipo(String tipo) {
        return em.createQuery(
            "SELECT t FROM Taller t WHERE t.activo = true AND t.tipo = :tipo ORDER BY t.nombre",
            Taller.class
        ).setParameter("tipo", tipo).getResultList();
    }

    public List<Taller> listarPorRangoEdad(String rangoEdad) {
        return em.createQuery(
            "SELECT t FROM Taller t WHERE t.activo = true AND t.rangoEdad = :rangoEdad ORDER BY t.tipo, t.nombre",
            Taller.class
        ).setParameter("rangoEdad", rangoEdad).getResultList();
    }
}
