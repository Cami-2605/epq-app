# Parser Fixes — ExcelParserUtil.java

## Bug 1: Remove "periodo" from COL_FECHA

**What changed:** The string `"periodo"` was removed from the `COL_FECHA` set.

**Why:** `COL_FECHA` is used to locate the date column for `fechaFactura`. The PERIODO column in Excel files holds billing-period strings like `"09/2024"`, which are not valid dates. Because `Set` has no guaranteed iteration order, when the JVM happened to visit `"periodo"` before `"fecharecaudo"` or `"fechapago"`, the parser would try to parse `"09/2024"` as a date and throw an `EXCEL_FECHA_INVALIDA` error. Removing `"periodo"` from `COL_FECHA` ensures the field is never mistaken for a date column. It still appears correctly in `COL_PERIODO`, which handles period strings separately.

## Bug 2: Convert COL_CONTRATO from Set to List with deterministic priority

**What changed:** `COL_CONTRATO` was changed from `Set.of(...)` to `List.of(...)` with this explicit priority order:

```java
private static final List<String> COL_CONTRATO = List.of(
    "contrato", "numerodocumento", "numerocontrato", "nrocontrato",
    "documento", "transaccion"
);
```

The call site in `resolverIndices` was updated from `primeroDeSet(col, COL_CONTRATO)` to `primero(col, COL_CONTRATO)`, using the existing list-aware helper.

**Why:** `Set` has no guaranteed iteration order, so when an Excel file contained both a `DOCUMENTO` column and a `TRANSACCION` column, which one ended up in `numeroContrato` was unpredictable. With a `List`, the first matching column in the priority order always wins. `"documento"` appears before `"transaccion"` in the list, so it will always take precedence when both are present.

## Build result

```
[INFO] BUILD SUCCESS
[INFO] Total time: 6.019 s
```

No compilation errors. All 37 source files compiled successfully against Java 17.

## Commit and push

- **Commit hash:** `8ca16d2`
- **Message:** `fix: remove periodo from COL_FECHA and make COL_CONTRATO deterministic`
- **Push status:** Pushed successfully to `master` at `https://github.com/Cami-2605/EpqBack.git`
