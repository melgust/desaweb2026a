package com.enterprise.catalog.model;

/**
 * Denormalized snapshot of a Category, embedded inside a Product document.
 * This is the standard MongoDB modeling approach to avoid joins on reads:
 * we store the category id + name directly on the product at write time.
 */
public class CategoryRef {

    private String id;
    private String name;

    public CategoryRef() {
    }

    public CategoryRef(String id, String name) {
        this.id = id;
        this.name = name;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
