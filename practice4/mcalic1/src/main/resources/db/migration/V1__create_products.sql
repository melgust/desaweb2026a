CREATE TABLE products (
    id          UUID           NOT NULL,
    sku         VARCHAR(50)    NOT NULL,
    name        VARCHAR(200)   NOT NULL,
    slug        VARCHAR(200)   NOT NULL,
    description VARCHAR(5000),
    price       NUMERIC(19, 4) NOT NULL,
    currency    VARCHAR(3)     NOT NULL,
    status      VARCHAR(20)    NOT NULL,
    created_at  TIMESTAMPTZ    NOT NULL,
    updated_at  TIMESTAMPTZ    NOT NULL,
    version     BIGINT         NOT NULL,
    CONSTRAINT pk_products PRIMARY KEY (id),
    CONSTRAINT uq_products_sku UNIQUE (sku),
    CONSTRAINT uq_products_slug UNIQUE (slug)
);

-- Indexes to support the supported list filters.
CREATE INDEX idx_products_status ON products (status);
CREATE INDEX idx_products_name ON products (name);
