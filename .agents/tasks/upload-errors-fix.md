# Upload Errors Fix — Workflow Report

**Workflow:** `wf_9336aaa708ad93e5`  
**Date:** 2026-10-21  
**Trigger:** User reported upload errors in the EPQ application.

---

## Bug 1 — DELETE /api/excel/{nombre} → 500

### What was wrong

`ArchivoExcelRepository` declared a derived-query delete method `deleteByNombreArchivo(String)`, but it was missing the `@Modifying` and `@Transactional` annotations required by Spring Data JPA for any write operation that bypasses a normal `save()` call. Without them Spring Data refused to execute the DML statement and the runtime threw a `TransactionRequiredException`, which the global exception handler surfaced as HTTP 500.

### What changed in `ArchivoExcelRepository.java`

Two annotations were added to `deleteByNombreArchivo`:

```java
// Before
void deleteByNombreArchivo(String nombreArchivo);

// After
@Modifying
@Transactional
void deleteByNombreArchivo(String nombreArchivo);
```

The necessary imports (`org.springframework.data.jpa.repository.Modifying` and `org.springframework.transaction.annotation.Transactional`) were also added to the file.

### Build result

Backend built and committed cleanly.  
Commit: `111ccd3` — `fix: add @Modifying/@Transactional to deleteByNombreArchivo and expand Excel column aliases`

---

## Bug 2 — POST /api/facturas/cargar?tipo=base → 400

### What was wrong

`ExcelParserUtil` matched column headers by normalizing them to lowercase with no spaces or accents, then looking them up in a fixed set of known aliases. The sets were too narrow: for example, `COL_MUNICIPIO` only accepted the literal string `"municipio"`, so files whose header read `"MUNICIPIO CIUDAD"`, `"CIUDAD"`, `"LOCALIDAD"`, or `"NOMBRE MUNICIPIO"` all failed the mandatory-column check and the parser threw `EXCEL_COLUMNAS_FALTANTES`, which became a 400. Similar gaps existed for date columns (`"FECHA DE PAGO"`, `"MES"`, `"PERIODO"`) and value columns (`"IMPORTE"`, `"MONTO"`, reordered `"TOTAL"`).

The header-row detector (`encontrarFilaEncabezado`) was also only anchored to `"municipio"` and `"codigo"`, so files that started with `"CIUDAD"` or `"FECHA"` as their first recognizable header fell back to row 0 and mis-parsed the title row as data.

### Alias expansions made in `ExcelParserUtil.java`

| Alias set | Added entries |
|-----------|--------------|
| `COL_MUNICIPIO` | `municipiociudad`, `ciudad`, `localidad`, `nombremunicipio` |
| `COL_FECHA` | `fechadepago`, `mes`, `periodo` |
| `COL_VALOR_FACTURA_PRIORIDAD` | `importe`, `monto` |
| `COL_TOTAL_PRIORIDAD` | reordered: `valortotal → total → totalpagar → valor` (previously `valortotal → valor → totalpagar → total`) |
| `encontrarFilaEncabezado` detector | added `municipiociudad`, `ciudad`, `localidad`, `nombremunicipio`, `fechafactura`, `fecha` as anchor words |

### Did `FacturaController.java` need changes?

No. The controller already accepted both the `archivo` and `file` multipart field names, returned `ApiErrorDto` on `EpqException`, and forwarded the structured error to the client. No changes were needed there.

### Build result

Backend built and committed cleanly in the same commit as Bug 1.  
Commit: `111ccd3` — `fix: add @Modifying/@Transactional to deleteByNombreArchivo and expand Excel column aliases`

---

## Frontend — Poor 400 error display

### What was wrong

The `catch` block in `uploadFile()` inside `upload.ts` handled HTTP 400 with:

```typescript
const errorMsg = typeof error.error === 'string'
  ? error.error
  : 'Error al procesar el archivo. Verifica las columnas obligatorias: municipio, fecha, valor';
this.mensajeError = `${errorMsg}`;
```

The backend returns a JSON object (`ApiErrorDto`) with a `detalle` field containing the specific human-readable reason (e.g., which column was missing). Because the response body is an object, not a string, the old code always fell through to the generic fallback message — the user never saw the actual column names that were missing.

### What changed in `upload.ts`

The 400 handler was updated to read `ApiErrorDto`'s fields in priority order:

```typescript
// After
const body = error.error;
const detail = typeof body === 'string'
  ? body
  : body?.detalle || body?.mensaje || 'Error al procesar el archivo. Verifica las columnas obligatorias: municipio, fecha, valor';
this.mensajeError = detail;
```

Logic:
1. If `error.error` is a plain string, use it as-is (preserves backward compatibility).
2. Otherwise try `body.detalle` (the primary `ApiErrorDto` field).
3. Fall back to `body.mensaje` (secondary field).
4. If neither is present, show the generic column hint.

### Build result

Frontend built cleanly.  
Commit: `f469581` — `fix: parse ApiErrorDto fields in 400 error handler for upload`

---

## Overall Status

**DONE ✅**

All three fixes were implemented, both projects built without errors, and changes were committed:

| Repo | Commit | Summary |
|------|--------|---------|
| `EpqBack` | `111ccd3` | Fix DELETE 500 + expand Excel column aliases |
| `epq-app` | `f469581` | Fix 400 error message not showing detail |

No follow-up items required.
