# Critical Bug Fixes — EpqBack

**Date:** 2025-07-14  
**Commit:** `fix: remove mes from COL_FECHA, fix @Transactional AOP bypass, fix estadoPago logic`  
**Build:** `mvnw.cmd compile` → exit 0, no errors.

---

## Fix 1 — CRÍTICO: Eliminar "mes" de COL_FECHA

**File:** `src/main/java/com/epq/epqbackend/util/ExcelParserUtil.java`

### What changed
Removed `"mes"` from the `COL_FECHA` set. The entry now contains only:
`fecharecaudo`, `fecha`, `fechapago`, `fechadepago`, `fechafactura`, `fechaemision`, `fechacorte`.

### Why it was needed
`"mes"` was present in **both** `COL_FECHA` and `COL_PERIODO`. When an Excel file had a column literally named `MES` (a period/month column), the resolver matched it to `idx.fecha` (date index) instead of `idx.periodo`. This caused:
- The period column to be parsed as a date, throwing a date-format error or silently using an incorrect date.
- The actual date column to remain unmatched, triggering the FECHA obligatoria exception and rejecting the entire file.

Keeping `"mes"` only in `COL_PERIODO` is correct: a column named "MES" represents a billing period, not a calendar date.

---

## Fix 2 — CRÍTICO: Mover @Transactional a procesarArchivos()

**File:** `src/main/java/com/epq/epqbackend/service/ArchivoProcessorService.java`

### What changed
Added `@Transactional` to the `public procesarArchivos(List<MultipartFile>, String)` method.

### Why it was needed
Spring AOP creates a proxy around the bean and intercepts calls from *outside* the bean. When `procesarArchivos()` called `procesarExcel()` or `procesarPdf()` internally (self-invocation), those calls bypassed the proxy entirely, so the `@Transactional` annotations on those `protected` methods were never applied. The result was that each database operation (`facturaRepository.saveAll`, `archivoExcelRepository.save`, etc.) ran in auto-commit mode without a wrapping transaction. Any failure partway through a file left orphaned partial data in the database.

By moving `@Transactional` to the public entry point, the proxy wraps the entire operation for each call. The inner annotations on `procesarExcel()` and `procesarPdf()` are now redundant (they participate in the outer transaction via `REQUIRED` propagation) but were left in place as documentation.

---

## Fix 3 — MEDIO: Corregir lógica de estadoPago

**File:** `src/main/java/com/epq/epqbackend/util/ExcelParserUtil.java`

### What changed
Replaced the `estadoPago` block in `parsearFila()`. The old logic:

```java
boolean tieneDeuda = valorMora > 0 || saldoMora > 0 || mesesMora > 0;
boolean vencida    = f.getFechaVencimiento().isBefore(LocalDate.now());
f.setEstadoPago(tieneDeuda || vencida ? "VENCIDO" : "PENDIENTE");
```

New logic:

```java
boolean tieneMoraReal = (valorMora != null && valorMora > 0)
        || (saldoMora != null && saldoMora > 0)
        || (mesesMora != null && mesesMora > 0);
f.setEstadoPago(tieneMoraReal ? "VENCIDO" : "PENDIENTE");
```

### Why it was needed
The `vencida` check used `fechaVencimiento = fechaFactura + 30 days`. Because invoices from the past are inherently older than 30 days, **every historical invoice** was classified as `VENCIDO` regardless of whether any debt existed. This is what caused the user to see all records returned when filtering for accounts in mora — there was no real distinction between a paid invoice from last year and a genuinely overdue account.

Removing the date check and relying solely on `valorMora`, `saldoMora`, and `mesesMora` ensures `VENCIDO` is set only when the source data explicitly indicates unpaid amounts or overdue months.

---

## Build Verification

```
mvnw.cmd compile
BUILD SUCCESS
```

No compilation errors. All three changes were applied cleanly and the project compiles without warnings related to the modified classes.
