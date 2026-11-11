# Batch Inserts — Hibernate Performance Configuration

## Summary

Enabled Hibernate batch inserts for the Spring Boot backend (`EpqBack`) to dramatically
speed up bulk Excel uploads (131k+ rows). Previously each row triggered an individual
`INSERT`; now the driver rewrites them into multi-row batch statements.

---

## Files Changed

### `src/main/resources/application.yaml`

**1. Added `rewriteBatchedStatements=true` to the datasource URL**

MariaDB only enables client-side batch rewriting when this JDBC parameter is present.
Without it, Hibernate's batch settings have no effect on the wire protocol.

```yaml
# Before
url: jdbc:mariadb://localhost:3306/epq_db?useSSL=false&serverTimezone=America/Bogota&useGssapi=false

# After
url: jdbc:mariadb://localhost:3306/epq_db?useSSL=false&serverTimezone=America/Bogota&useGssapi=false&rewriteBatchedStatements=true
```

**2. Added Hibernate batch properties under `spring.jpa.properties.hibernate`**

```yaml
jdbc:
  batch_size: 500
  batch_versioned_data: true
order_inserts: true
order_updates: true
```

- `batch_size: 500` — Hibernate accumulates up to 500 statements before flushing to the driver.
- `order_inserts/order_updates: true` — Groups statements by entity type so batch runs are contiguous.
- `batch_versioned_data: true` — Allows batching even for entities with `@Version` fields.

---

## Entity — `Factura.java`

No changes needed. The entity uses `GenerationType.IDENTITY` which is correct for MariaDB.
Changing to `SEQUENCE` (PostgreSQL-style) would break ID generation.

---

## Service — `ArchivoProcessorService.java`

**Case A — already uses `saveAll()`.**

The service already implements batching correctly via `guardarEnLotes()`:

```java
private static final int BATCH_SIZE = 1000;

private void guardarEnLotes(List<Factura> facturas) {
    for (int i = 0; i < facturas.size(); i += BATCH_SIZE) {
        int fin = Math.min(i + BATCH_SIZE, facturas.size());
        facturaRepository.saveAll(facturas.subList(i, fin));
    }
}
```

No service code changes were required. With `rewriteBatchedStatements=true` and `batch_size=500`,
Spring Data JPA's `saveAll()` now translates to bulk INSERT statements at the JDBC level.

---

## Compilation

`.\mvnw compile` — **succeeded** with exit code 0. No errors.

---

## Commit

```
commit c7b4ca5
perf: enable Hibernate batch inserts for bulk Excel upload
```

Pushed to `master` on `https://github.com/Cami-2605/EpqBack.git`.
