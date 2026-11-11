# Fix: `errores` column changed to TEXT

## What was changed

**File:** `src/main/java/com/epq/epqbackend/model/ArchivoExcel.java`

**Field:** `errores`

**Before:**
```java
private String errores;
```

**After:**
```java
@Column(columnDefinition = "TEXT")
private String errores;
```

The field had no `@Column` annotation, so Hibernate was mapping it to `VARCHAR(255)` by default. Any error message longer than 255 characters caused a `Data too long for column 'errores'` error and prevented the file record from being saved. Changing to `TEXT` allows up to ~65 KB of error content.

The `import jakarta.persistence.*;` wildcard already present in the file covers `@Column`, so no new import was needed.

---

## ddl-auto value

Found in `src/main/resources/application.yaml`:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update
```

**Value is `update`** — Hibernate will automatically `ALTER` the column when the application restarts. No manual SQL is required; simply redeploy/restart the backend.

---

## Manual migration SQL (if needed)

If you ever switch `ddl-auto` to `none` or `validate`, or need to apply the change directly in MariaDB without restarting the app, run:

```sql
ALTER TABLE archivos_excel MODIFY COLUMN errores TEXT;
```

---

## Compilation result

```
[INFO] BUILD SUCCESS
[INFO] Total time: 5.872 s
```

37 source files compiled with no errors.
