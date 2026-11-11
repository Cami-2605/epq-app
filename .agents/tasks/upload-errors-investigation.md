# Investigation Report: Upload HTTP Errors

**Date:** Investigation of errors in Angular + Spring Boot app  
**Frontend:** `C:\Users\Cami\Documents\GitHub\epq-app`  
**Backend:** `C:\Users\Cami\Documents\GitHub\EpqBack`

---

## Summary

Two separate bugs found. They have different root causes:

1. **DELETE /api/excel/{filename} → 500** — The `ArchivoExcelRepository.deleteByNombreArchivo()` Spring Data method lacks a `@Modifying` + `@Transactional` annotation, which causes a JPA/Hibernate exception at runtime when the repository tries to execute the derived delete query outside a transaction.

2. **POST /api/facturas/cargar?tipo=base → 400** — This endpoint works correctly at the controller level (it was recently fixed to accept both `archivo` and `file` field names). The 400 is almost certainly thrown **by the `ExcelParserUtil`** because the Excel file being uploaded is missing one of the three mandatory columns the parser requires: `MUNICIPIO`, a date column (`FECHA RECAUDO` / `FECHA PAGO` / `FECHA`), or a value column (`VALOR MES` / `PAGADO MES` / `VALOR`). The error propagates as an `EpqException` with `BAD_REQUEST` status.

---

## Evidence and Analysis

### 1. Frontend — upload.ts behavior (relevant lines)

File: `src/app/features/excel/upload/upload.ts`

| Line | What happens |
|------|-------------|
| 77 | `console.log` — files selected, purely informational |
| 92 | `console.log` — upload starting |
| 95–109 | Calls `facturaService.cargarExcel(file, tipoFuente)` for one file, or `cargarMultiplesArchivos` for many |
| 123 | `catch` block reached on any HTTP error from `/facturas/cargar` |
| 127–129 | HTTP 400 → reads `error.error` string; shows `'Error al procesar el archivo…'` message |
| 142 | `finally` block — resets `uploading = false` |
| 150 | List refresh call inside `cargarArchivos()` |
| 165 | Success path in `eliminarArchivo()` |
| 169 | `catch` block reached on any HTTP error from the delete call |

The `tipoFuente` default is `'extra'` (`upload.ts` line 37: `tipoFuente: string = 'extra'`), but the error is being triggered with `tipo=base`, which means the user changed the dropdown to "base" before uploading.

#### How upload calls the backend

`factura.service.ts` `cargarExcel()`:
```ts
const formData = new FormData();
formData.append('archivo', archivo);          // field name = "archivo"
return this.http.post(`${apiUrl}/facturas/cargar`, formData, {
  params: new HttpParams().set('tipo', tipo)  // query param
});
```

`eliminarArchivoExcel()`:
```ts
return this.http.delete(`${apiUrl}/excel/${encodeURIComponent(nombre)}`, { params });
// → DELETE /api/excel/{nombre}
```

---

### 2. Error 1 — DELETE /api/excel/{nombre} → 500

**Controller:** `ExcelController.java`, `@DeleteMapping("/{nombre}")`

The controller's `eliminarArchivo()` method calls two repository methods inside a try/catch:

```java
facturaRepository.deleteByNombreArchivoOrigenAndTipoFuente(nombre, tipo); // has @Modifying @Transactional ✓
archivoExcelRepository.deleteByNombreArchivo(nombre);                     // ← PROBLEM
```

**Root cause — missing `@Transactional` on the derived delete method:**

`ArchivoExcelRepository.java`:
```java
public interface ArchivoExcelRepository extends JpaRepository<ArchivoExcel, Long> {
    List<ArchivoExcel> findByTipo(String tipo);
    boolean existsByNombreArchivo(String nombreArchivo);
    void deleteByNombreArchivo(String nombreArchivo);  // ← no @Modifying, no @Transactional
}
```

Spring Data JPA derived delete methods (`deleteBy…`) require `@Transactional` to be declared on the calling method **or** on the repository method itself. Without it, Spring throws:

> `org.springframework.dao.InvalidDataAccessApiUsageException: No EntityManager with actual transaction available for current thread – cannot reliably process 'remove' call`

This exception is not an `EpqException`, so it bypasses the controller's `catch (Exception e)` … wait — actually the controller **does** have a `catch (Exception e)` that returns 500:

```java
} catch (Exception e) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ApiErrorDto("ERR_999",
                    "Error eliminando el archivo: " + e.getMessage()));
}
```

So the 500 is coming from **inside that catch**, triggered by the `InvalidDataAccessApiUsageException` (or a `TransactionRequiredException`) thrown when calling `archivoExcelRepository.deleteByNombreArchivo(nombre)`.

**Additional contributing factor:** The same `deleteByNombreArchivo` is also called from `ArchivoProcessorService.registrarArchivo()` (line in `procesarExcel` and `registrarArchivo`). That service method **is** annotated `@Transactional`, so it works there. But in `ExcelController.eliminarArchivo()`, there is **no transaction context**, hence the failure.

**Confirming the call chain:**
- `upload.ts:169` → `console.error('Error al eliminar archivo:', error)` → this is the 500 landing here
- The frontend calls `DELETE /api/excel/{nombre}` via `facturaService.eliminarArchivoExcel(archivo.nombreArchivo)`
- The controller method at `ExcelController.@DeleteMapping("/{nombre}")` catches the `InvalidDataAccessApiUsageException` and returns 500

---

### 3. Error 2 — POST /api/facturas/cargar?tipo=base → 400

**Controller:** `FacturaController.java`, `@PostMapping("/cargar")`

The controller was **recently modified** (commit `4322f76`, "Actualización con nuevas solicitudes para la generación de reportes") to accept both `archivo` and `file` field names. The frontend sends the field as `archivo` — this is now correctly handled.

The 400 response path is:

```java
// In FacturaController.cargarArchivo():
} catch (EpqException e) {
    return ResponseEntity.status(e.getHttpStatus())  // EpqException defaults to BAD_REQUEST = 400
            .body(new ApiErrorDto(...));
}
```

`EpqException` defaults to `HttpStatus.BAD_REQUEST` (400) unless explicitly constructed with a different status. All `ErrorCode.EXCEL_COLUMNAS_FALTANTES` and `ErrorCode.EXCEL_SIN_DATOS` exceptions thrown by `ExcelParserUtil` and `ArchivoProcessorService` use the default constructor, so they all return 400.

**Most likely root causes for the 400:**

`ExcelParserUtil.parsear()` throws `EpqException(EXCEL_COLUMNAS_FALTANTES)` if:
1. **`MUNICIPIO` column not found** — column header must be exactly "municipio" (case-insensitive, no accents) — `COL_MUNICIPIO = Set.of("municipio")`. If the Excel uses "Municipio_Ciudad" or "Ciudad" it won't match.
2. **No date column found** — parser looks for: `fecharecaudo`, `fecha`, `fechapago`, `fechafactura`, `fechaemision`, `fechacorte`. If the file uses a different header it won't match.
3. **No value column found** — parser looks for: `valormes`, `pagadomes`, `valorfactura`, `valor`. Same issue.
4. **`EXCEL_SIN_DATOS`** — the sheet is empty or all rows failed validation.

The parser normalizes column names by stripping accents and spaces (based on the `COL_*` sets using normalized lowercase keys). But the normalization must be done consistently — if the header in the file has characters that don't normalize cleanly, the lookup fails silently.

**Also possible:** `ArchivoProcessorService.procesarArchivos()` throws `EpqException(EXCEL_SIN_DATOS, …, mensajesError)` when ALL files fail. That also comes back as 400. The `detalle` field of the response should contain the actual reason — the frontend currently doesn't display it (`upload.ts:128` reads only `error.error`, which is the string body, not the structured `ApiErrorDto`).

**Why specifically with `tipo=base`?** The `tipo` parameter only affects how records are tagged (`tipoFuente` field on `Factura`). It does not affect parsing. So the 400 is about the Excel file content, not the `tipo` value. The error is coincidental to the `tipo=base` selection.

---

### 4. Recent changes that may have introduced the bugs

**Backend — commit `4322f76` (most recent, "Actualización con nuevas solicitudes para la generación de reportes"):**
- Modified `FacturaController.java` — changed `/cargar` to accept `archivo` or `file` field (this was a **fix**, not a regression)
- Added `InformeController.java`, `FiltroInformeDto.java`, `InformeAnaliticoService.java`
- Modified `ExcelParserUtil.java` (large rewrite — +663 lines net)
- Modified `Factura.java` model

The `ExcelParserUtil` was heavily rewritten. Before this commit it may have used a different column matching strategy. If the Excel files being uploaded were created to work with the **old** parser (different column name normalization, different required columns), the new stricter column validation would cause 400s.

**Backend — commit `7833113` ("Cambios"):**
- Rewrote `ExcelController.java` completely — replaced `ExcelService` with direct repository calls
- This is where `deleteByNombreArchivo` (without `@Transactional`) was introduced, causing the 500

---

## Conclusions

| # | Error | Root cause | File(s) |
|---|-------|-----------|---------|
| 1 | DELETE /api/excel/{nombre} → 500 | `ArchivoExcelRepository.deleteByNombreArchivo()` called outside a transaction in `ExcelController.eliminarArchivo()` — missing `@Transactional` | `ArchivoExcelRepository.java`, `ExcelController.java` |
| 2 | POST /api/facturas/cargar?tipo=base → 400 | Excel file column headers don't match what `ExcelParserUtil` expects after its recent rewrite; the parser throws `EpqException(EXCEL_COLUMNAS_FALTANTES)` which is mapped to HTTP 400 | `ExcelParserUtil.java`, `ArchivoProcessorService.java` |

---

## Recommendations (do not implement — analysis only)

### Fix 1 — DELETE 500

**Option A (simplest):** Add `@Transactional` + `@Modifying` to the derived delete method in the repository:

```java
// ArchivoExcelRepository.java
@Modifying
@Transactional
void deleteByNombreArchivo(String nombreArchivo);
```

**Option B:** Add `@Transactional` to `ExcelController.eliminarArchivo()` itself. Less ideal since controllers generally shouldn't own transactions, but it would work.

Either option ensures Hibernate has an active transaction when issuing the `DELETE` DML.

### Fix 2 — POST 400

1. **Diagnose the actual column mismatch** — run the backend with the exact Excel file and look at the console output. `ExcelParserUtil` prints `"=== Columnas detectadas en '...' ==="` and the resolved indices. This will show exactly which expected column is missing.

2. **Fix the column header in the Excel file** to match the parser's expected names (e.g., rename to `MUNICIPIO`, `FECHA RECAUDO`, `VALOR MES` for cartera format; or `MUNICIPIO`, `FECHA RECAUDO`, `VALOR` for recaudos format).

3. **OR** extend `COL_MUNICIPIO` in `ExcelParserUtil` to include additional aliases if the files consistently use a different header name.

4. **Improve frontend error display:** `upload.ts:128` currently only reads `error.error` (the raw body). For structured `ApiErrorDto` responses, it should also read `error.error?.detalle` and `error.error?.mensaje` to show the user the exact column that failed, instead of the generic "Verifica las columnas obligatorias" message.

```typescript
// upload.ts — improved 400 handler
} else if (error.status === 400) {
  const body = error.error;
  const detail = typeof body === 'string'
    ? body
    : body?.detalle || body?.mensaje || 'Error al procesar el archivo. Verifica las columnas obligatorias: municipio, fecha, valor';
  this.mensajeError = detail;
}
```

---

## File / Symbol Reference

| Symbol | File |
|--------|------|
| `ExcelController.eliminarArchivo()` | `EpqBack/.../controller/ExcelController.java:100-130` |
| `ArchivoExcelRepository.deleteByNombreArchivo()` | `EpqBack/.../repository/ArchivoExcelRepository.java:9` |
| `FacturaController.cargarArchivo()` | `EpqBack/.../controller/FacturaController.java:73-115` |
| `ExcelParserUtil.parsear()` — column validation | `EpqBack/.../util/ExcelParserUtil.java:200-260` |
| `ArchivoProcessorService.procesarArchivos()` — "todos fallaron" path | `EpqBack/.../service/ArchivoProcessorService.java:110-125` |
| `FacturaService.cargarExcel()` | `epq-app/.../core/services/factura.service.ts:34-40` |
| `UploadComponent.uploadFile()` — error handler | `epq-app/.../features/excel/upload/upload.ts:122-137` |
| `UploadComponent.eliminarArchivo()` | `epq-app/.../features/excel/upload/upload.ts:160-172` |
