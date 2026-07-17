package com.mariaauxiliadora.eventos.dao;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.transaction.Transactional;
import java.io.Serializable;
import java.util.List;
import java.util.Optional;

/**
 * DAO genérico base. Los facades extienden esta clase y heredan todo el CRUD.
 * La transaccionalidad se maneja a nivel de facade (@Stateless + @Transactional).
 */
public abstract class GenericDAO<T, ID extends Serializable> {

    @PersistenceContext(unitName = "MAUXPU")
    protected EntityManager em;

    private final Class<T> entityClass;

    protected GenericDAO(Class<T> entityClass) {
        this.entityClass = entityClass;
    }

    public Optional<T> findById(ID id) {
        T entity = em.find(entityClass, id);
        return Optional.ofNullable(entity);
    }

    public Optional<T> findByIdActivo(ID id) {
        try {
            T entity = em.createQuery(
                "SELECT e FROM " + entityClass.getSimpleName() + " e WHERE e.id = :id AND e.activo = true",
                entityClass
            ).setParameter("id", id).getSingleResult();
            return Optional.of(entity);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public List<T> findAll(int page, int size) {
        TypedQuery<T> query = em.createQuery(
            "SELECT e FROM " + entityClass.getSimpleName() + " e WHERE e.activo = true ORDER BY e.id",
            entityClass
        );
        query.setFirstResult(page * size);
        query.setMaxResults(size);
        return query.getResultList();
    }

    public List<T> findAllRaw(int page, int size) {
        TypedQuery<T> query = em.createQuery(
            "SELECT e FROM " + entityClass.getSimpleName() + " e ORDER BY e.id",
            entityClass
        );
        query.setFirstResult(page * size);
        query.setMaxResults(size);
        return query.getResultList();
    }

    public long count() {
        return em.createQuery(
            "SELECT COUNT(e) FROM " + entityClass.getSimpleName() + " e WHERE e.activo = true",
            Long.class
        ).getSingleResult();
    }

    public long countRaw() {
        return em.createQuery(
            "SELECT COUNT(e) FROM " + entityClass.getSimpleName() + " e",
            Long.class
        ).getSingleResult();
    }

    @Transactional
    public T create(T entity) {
        em.persist(entity);
        em.flush();
        return entity;
    }

    @Transactional
    public T update(T entity) {
        return em.merge(entity);
    }

    @Transactional
    public void softDelete(ID id) {
        em.createQuery(
            "UPDATE " + entityClass.getSimpleName() + " e SET e.activo = false WHERE e.id = :id"
        ).setParameter("id", id).executeUpdate();
    }

    @Transactional
    public void hardDelete(ID id) {
        findById(id).ifPresent(em::remove);
    }
}
