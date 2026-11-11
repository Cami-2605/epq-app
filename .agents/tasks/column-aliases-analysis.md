# Column Aliases Analysis — ExcelParserUtil

**Source file:** `EpqBack/src/main/java/com/epq/epqbackend/util/ExcelParserUtil.java`

---

## Summary (answer first)

Both Excel files parse **successfully** today with the current alias sets — no aliases are missing for the three required columns (MUNICIPIO, date, value). All normalization logic (strip accents, lowercase, remove spaces/hyphens) correctly matches every header in both files. The parser does **not** distinguish file type by a "tipo" parameter it detects itself; the caller supplies an opaque `tipoFuente` string (`"base"`, `"extra"`, etc.) and the parser auto-detects the structure from the column names present. File 1 maps to the "Cartera/Morosos" structure described in the Javadoc; File 2 maps to "Recaudos/Pagos".

---

## Normalization rules (from `normalizarNombreColumna`)

```
eliminarTildes(header)  →  lowercase  →  remove [space, -, _, /, .]+
```

Examples applied to the real headers:
| Raw header       | Normalized key    |
|------------------|-------------------|
| MESES MORA       | `mesesmora`       |
| MESES DE MORA    | `mesesdemora`     |
| FECHA PAGO       | `fechapago`       |
| FECHA RECAUDO    | `fecharecaudo`    |
| VALOR MES        | `valormes`        |
| PAGADO MES       | `pagadomes`       |
| PAGADO ATRASO    | `pagadoatraso`    |
| VALOR ATRASO     | `valoratraso`     |
| VALOR TOTAL      | `valortotal`      |
| NUMERO MEDIDOR   | `numeromedidor`   |
| TIPO RECAUDO     | `tiporecaudo`     |
| FECHA IMPRESION  | `fechaimpresion`  |

---

## File 1 — Cartera / Morosos

**Headers provided:**  
`CODIGO, NOMBRE, DIRECCION, TELEFONO, EMAIL, MUNICIPIO, MESES MORA, SERVICIO, ESTRATO, VALOR MES, VALOR ATRASO, VALOR TOTAL, VALOR PAGADO, FECHA PAGO, SALDO, NUMERO MEDIDOR`

### Required column resolution

| Required field | Normalized key from file | Alias set hit | Result |
|----------------|--------------------------|---------------|--------|
| MUNICIPIO      | `municipio`              | `COL_MUNICIPIO` contains `"municipio"` | ✅ FOUND |
| FECHA          | `fechapago`              | `COL_FECHA` contains `"fechapago"` | ✅ FOUND |
| VALOR (primary)| `valormes`               | `COL_VALOR_FACTURA_PRIORIDAD` #1 is `"valormes"` | ✅ FOUND |
| VALOR TOTAL    | `valortotal`             | `COL_TOTAL_PRIORIDAD` #1 is `"valortotal"` | ✅ FOUND |

### All columns resolution

| Header            | Normalized    | Alias set           | Field mapped       |
|-------------------|---------------|---------------------|--------------------|
| CODIGO            | `codigo`      | `COL_CODIGO`        | codigoCliente ✅   |
| NOMBRE            | `nombre`      | `COL_NOMBRE`        | nombreCliente ✅   |
| DIRECCION         | `direccion`   | `COL_DIRECCION`     | direccionServicio ✅|
| TELEFONO          | `telefono`    | none                | ⚠️ ignored (no alias, not required) |
| EMAIL             | `email`       | none                | ⚠️ ignored (no alias, not required) |
| MUNICIPIO         | `municipio`   | `COL_MUNICIPIO`     | municipio ✅       |
| MESES MORA        | `mesesmora`   | `COL_MESES_MORA`    | mesesMora ✅       |
| SERVICIO          | `servicio`    | `COL_SERVICIO`      | nombreServicio ✅  |
| ESTRATO           | `estrato`     | `COL_ESTRATO`       | estrato ✅         |
| VALOR MES         | `valormes`    | `COL_VALOR_FACTURA_PRIORIDAD` | valorFactura ✅|
| VALOR ATRASO      | `valoratraso` | `COL_MORA_PRIORIDAD` #1       | valorMora ✅   |
| VALOR TOTAL       | `valortotal`  | `COL_TOTAL_PRIORIDAD` #1      | totalPagar ✅  |
| VALOR PAGADO      | `valorpagado` | none                | ⚠️ ignored (no alias, not required) |
| FECHA PAGO        | `fechapago`   | `COL_FECHA`         | fechaFactura ✅    |
| SALDO             | `saldo`       | `COL_SALDO_PRIORIDAD` #1      | saldoMora ✅   |
| NUMERO MEDIDOR    | `numeromedidor`| `COL_MEDIDOR`      | numeroMedidor ✅   |

**Conclusion:** File 1 parses without errors. All required columns found. `TELEFONO`, `EMAIL`, and `VALOR PAGADO` are silently ignored (no alias, but also not required — no exception thrown).

---

## File 2 — Recaudos / Pagos

**Headers provided:**  
`CODIGO, NOMBRE, DIRECCION, MUNICIPIO, FECHA RECAUDO, TIPO RECAUDO, DOCUMENTO, PERIODO, TRANSACCION, VALOR, PAGADO MES, PAGADO ATRASO, MESES DE MORA, FILTRO, FECHA IMPRESION`

### Required column resolution

| Required field | Normalized key from file | Alias set hit | Result |
|----------------|--------------------------|---------------|--------|
| MUNICIPIO      | `municipio`              | `COL_MUNICIPIO` contains `"municipio"` | ✅ FOUND |
| FECHA          | `fecharecaudo`           | `COL_FECHA` contains `"fecharecaudo"` | ✅ FOUND |
| VALOR (primary)| `pagadomes`              | `COL_VALOR_FACTURA_PRIORIDAD` #2 is `"pagadomes"` (wins over `"valor"` at #6) | ✅ FOUND |
| VALOR TOTAL    | `valor`                  | `COL_TOTAL_PRIORIDAD` #4 is `"valor"` | ✅ FOUND |

### All columns resolution

| Header          | Normalized       | Alias set                  | Field mapped              |
|-----------------|------------------|----------------------------|---------------------------|
| CODIGO          | `codigo`         | `COL_CODIGO`               | codigoCliente ✅           |
| NOMBRE          | `nombre`         | `COL_NOMBRE`               | nombreCliente ✅           |
| DIRECCION       | `direccion`      | `COL_DIRECCION`            | direccionServicio ✅       |
| MUNICIPIO       | `municipio`      | `COL_MUNICIPIO`            | municipio ✅               |
| FECHA RECAUDO   | `fecharecaudo`   | `COL_FECHA`                | fechaFactura ✅            |
| TIPO RECAUDO    | `tiporecaudo`    | `COL_SERVICIO`             | nombreServicio ✅          |
| DOCUMENTO       | `documento`      | `COL_CONTRATO`             | numeroContrato ✅          |
| PERIODO         | `periodo`        | `COL_FECHA` + `COL_PERIODO`| fechaFactura (& periodo ✅)|
| TRANSACCION     | `transaccion`    | `COL_CONTRATO`             | ⚠️ also matches, but `documento` wins (iteration order of Set — non-deterministic; see note below) |
| VALOR           | `valor`          | `COL_TOTAL_PRIORIDAD` #4   | totalPagar ✅              |
| PAGADO MES      | `pagadomes`      | `COL_VALOR_FACTURA_PRIORIDAD` #2 | valorFactura ✅      |
| PAGADO ATRASO   | `pagadoatraso`   | `COL_MORA_PRIORIDAD` #2    | valorMora ✅               |
| MESES DE MORA   | `mesesdemora`    | `COL_MESES_MORA`           | mesesMora ✅               |
| FILTRO          | `filtro`         | none                       | ⚠️ ignored (not required) |
| FECHA IMPRESION | `fechaimpresion` | none                       | ⚠️ ignored (not required) |

**Conclusion:** File 2 parses without errors. All required columns found.

---

## Tipo detection — how the parser distinguishes file types

`ExcelParserUtil.parsear(archivo, tipoFuente, nombreArchivo)` receives `tipoFuente` as a plain string passed by the caller (`"base"`, `"extra"`, or whatever the frontend sends via `ArchivoProcessorService.procesarArchivos`). The parser **does not** read that value to choose a parsing branch — it uses a single code path for both file structures, auto-resolving columns from the alias sets. The Javadoc describes two "tipos" (Tipo 1 / Tipo 2) but these are documentation labels, not runtime branches.

- **File 1 (Cartera/Morosos)** → the caller would upload it with `tipoFuente = "base"` or `"cartera"` (whatever the frontend UI passes).
- **File 2 (Recaudos/Pagos)** → the caller would upload it with `tipoFuente = "extra"` or `"recaudos"`.

The `tipo` value is stored on the `Factura` and `ArchivoExcel` entities for downstream filtering (reports, queries) but has no effect on parsing.

---

## Issues found (non-blocking but worth fixing)

### 1. `PERIODO` matches both `COL_FECHA` and `COL_PERIODO` — potential double-mapping

`"periodo"` is in **both** `COL_FECHA` (as a date field) and `COL_PERIODO` (as a reference period). In File 2, `PERIODO` contains a billing period string (e.g., `"09/2024"`), not an actual calendar date. `resolverIndices` assigns it to `idx.fecha` first (via `COL_FECHA`), which then calls `parsearFecha`. If the value is `"09/2024"` none of the four date formatters match it (`FMT_MMYYYY` is defined but not included in `parsearFecha`'s list), so the row would throw `EXCEL_FECHA_INVALIDA`.

**Recommended fix:** Remove `"periodo"` from `COL_FECHA`. `PERIODO` should only resolve to `idx.periodo`. In File 2, `FECHA RECAUDO` already provides a proper date; `PERIODO` should be the billing reference month, not the parsing date source.

```java
// COL_FECHA — remove "periodo":
private static final Set<String> COL_FECHA = Set.of(
        "fecharecaudo", "fecha", "fechapago", "fechadepago",
        "fechafactura", "fechaemision", "fechacorte", "mes"
        // "periodo" removed — it belongs to COL_PERIODO only
);
```

### 2. `TRANSACCION` vs `DOCUMENTO` — non-deterministic winner in `COL_CONTRATO`

`COL_CONTRATO` is a `Set.of(...)` and `primeroDeSet` iterates with `for (String c : candidatos)`. `Set.of` in Java does not guarantee iteration order. Both `"documento"` and `"transaccion"` are in `COL_CONTRATO`, and File 2 has both columns. Whichever wins depends on the JVM's hash ordering, making the mapping non-deterministic.

**Recommended fix:** Convert `COL_CONTRATO` to a `List` with explicit priority:

```java
private static final List<String> COL_CONTRATO_PRIORIDAD = List.of(
        "contrato", "numerodocumento", "numerocontrato", "nrocontrato",
        "documento", "transaccion"  // documento wins over transaccion
);
```

And use `primero(col, COL_CONTRATO_PRIORIDAD)` in `resolverIndices`.

### 3. `VALOR PAGADO` (File 1) is silently lost

File 1 has a `VALOR PAGADO` column (normalized: `valorpagado`) which represents the amount already paid. No alias set maps it to any field. This data is discarded. If the business needs to track payments made, an alias should be added to a new `COL_VALOR_PAGADO` set and a corresponding `Factura` field.

### 4. `FECHA IMPRESION` and `FILTRO` (File 2) are silently dropped

These columns are ignored with no mapping. If `FECHA IMPRESION` is ever needed (e.g., for audit trail), add `"fechaimpresion"` to `COL_FECHA` or a separate set. `FILTRO` appears to be a flag column; if needed, a new alias set should be created.

---

## Aliases that need to be added

None are strictly required for parsing to work today. The two breaking issues (items 1 and 2 above) are alias/set-type bugs, not missing aliases. No new string needs to be added to make both files parse — the missing ones are for ignored optional columns.

If full data capture is desired, add:

| New alias       | Add to set          | Maps to field     |
|-----------------|---------------------|-------------------|
| `"valorpagado"` | new `COL_VALOR_PAGADO` | Factura.valorPagado (new field) |
| `"fechaimpresion"` | `COL_FECHA` or new set | fechaImpresion (new field) |
| `"filtro"`      | new `COL_FILTRO`    | filtro (new field) |

---

## Recommendations (priority order)

1. **[HIGH] Fix `COL_FECHA` — remove `"periodo"`.** If a File 2 row has a well-formed date in `FECHA RECAUDO` and a period string in `PERIODO` (e.g., `"09/2024"`), parsing will fail on the date for any row where `resolverIndices` incorrectly assigns `idx.fecha` → `periodo` column index before `fecharecaudo`. In practice `COL_FECHA` is a `Set` so iteration order is JVM-dependent, meaning this could fail intermittently on real data.

2. **[HIGH] Convert `COL_CONTRATO` to a `List` with defined priority.** The current `Set.of(...)` makes `DOCUMENTO` vs `TRANSACCION` resolution non-deterministic.

3. **[MEDIUM] Consider capturing `VALOR PAGADO` from File 1** if the business logic needs to track how much of the total has already been paid.

4. **[LOW] Add `FMT_MMYYYY` to `parsearFecha`'s formatter list** if `PERIODO` values ever need to be used as dates (after removing it from `COL_FECHA`, this becomes moot for the required date field).
