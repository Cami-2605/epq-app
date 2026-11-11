# Investigación: POST /api/facturas/reporte → ERR_401 "No hay datos que coincidan"

## Resumen ejecutivo

**La causa raíz es una combinación de dos problemas relacionados con el filtro `soloMorosos=true` y la fecha `fechaFactura` almacenada:**

1. **`soloMorosos=true` enruta la consulta a `findMorosos()`**, que filtra por `f.fechaFactura BETWEEN :inicio AND :fin`. Las facturas cargadas del archivo `"01 enero-31 marzo.xlsx"` (período enero–marzo) tienen `fechaFactura` derivada del campo `FECHA PAGO` o `FECHA RECAUDO` del Excel, que son fechas del período de facturación, probablemente **enero–marzo de 2026 (ej: 2026-01-01 a 2026-03-31)**. El filtro solicita `fechaInicio: 2026-02-02` a `fechaFin: 2026-02-10`, un rango de **9 días** que puede no contener ninguna fecha exacta almacenada.

2. **`soloMorosos=true` además requiere que las facturas tengan mora activa** (`valorMora > 0 OR saldoMora > 0 OR estadoPago = 'VENCIDO' OR mesesMora > 0`). Si las facturas del archivo son recaudos pagados (archivo Tipo 2), pueden no cumplir ninguna condición de mora, dejando `findMorosos()` vacío.

3. **`nombreArchivos: ["01 enero-31 marzo.xlsx"]` filtra por `nombreArchivoOrigen`** exacto. Si el archivo se cargó con un nombre ligeramente diferente (p.ej. con mayúsculas, con espacio extra, o con extensión distinta), el filtro no encuentra coincidencia.

Cuando `consultarConFiltros()` devuelve una lista vacía, `validarDatos()` en `ReporteGeneradorService` lanza `EpqException(ErrorCode.REPORTE_SIN_DATOS)` → HTTP 400 con código `ERR_401` y mensaje `"No hay datos que coincidan con los filtros seleccionados"`.

---

## Evidencia detallada por pregunta

### 1. Controller que maneja POST /api/facturas/reporte

**Archivo:** `src/main/java/com/epq/epqbackend/controller/FacturaController.java`, línea `@PostMapping("/reporte")`

```java
@PostMapping("/reporte")
public ResponseEntity<?> generarReporte(@RequestBody FiltroReporteDto filtros) {
    // ...
    archivo = reporteGeneradorService.generarExcel(filtros);
    // ...
    } catch (EpqException e) {
        return ResponseEntity.status(e.getHttpStatus())
            .body(new ApiErrorDto(e.getErrorCode().getCodigo(),
                e.getMessage(), e.getDetalle()));
    }
}
```

El controller está en `/facturas`, no en `/api/facturas` — el prefijo `/api` probablemente lo agrega el `application.properties` con `server.servlet.context-path=/api` o el gateway del frontend. El handler es `FacturaController.generarReporte()`.

---

### 2. Método de repositorio / consulta usada

Flujo completo:
```
FacturaController.generarReporte()
  → ReporteGeneradorService.generarExcel()
     → FacturaService.consultarConFiltros()       ← aquí está la lógica de filtros
        → FacturaRepository.findMorosos()          ← elegido porque soloMorosos=true
     → validarDatos(facturas)                      ← lanza ERR_401 si lista vacía
```

**Archivo:** `FacturaService.java` líneas 91–107:

```java
public List<Factura> consultarConFiltros(FiltroReporteDto filtros) {
    List<String> municipios = normalizarMunicipios(filtros.getMunicipios());
    List<Integer> estratos  = filtros.getEstratosFiltro();
    List<String> archivos   = filtros.getNombreArchivosFiltro();
    String tipoFuente       = filtros.getTipoFuente();

    List<Factura> facturas;

    if (filtros.getMesesReferencia() != null && !filtros.getMesesReferencia().isEmpty()) {
        facturas = facturaRepository.findConFiltrosMes(...);  // NO aplica (mesesReferencia=null)
    } else if (filtros.isSoloMorosos()) {
        facturas = facturaRepository.findMorosos(            // ← ESTE ES EL CAMINO ELEGIDO
                filtros.getFechaInicio(), filtros.getFechaFin(),
                municipios, estratos, tipoFuente, archivos);
    } else {
        facturas = facturaRepository.findConFiltros(...);
    }
    ...
}
```

Con el payload del request (`mesesReferencia=null`, `soloMorosos=true`), siempre se llama `findMorosos()`.

---

### 3. Cómo se aplican fechaInicio/fechaFin — campo comparado

**Archivo:** `FacturaRepository.java`, query `findMorosos`:

```java
@Query("SELECT f FROM Factura f WHERE " +
    "(f.valorMora > 0 OR f.saldoMora > 0 OR f.estadoPago = 'VENCIDO' " +
    " OR (f.mesesMora IS NOT NULL AND f.mesesMora > 0)) AND " +
    "(:inicio IS NULL OR f.fechaFactura >= :inicio) AND " +
    "(:fin    IS NULL OR f.fechaFactura <= :fin)    AND " +
    "(:municipios  IS NULL OR f.municipio IN :municipios) AND " +
    "(:estratos    IS NULL OR f.estrato IN :estratos) AND " +
    "(:tipoFuente  IS NULL OR f.tipoFuente = :tipoFuente) AND " +
    "(:archivos    IS NULL OR f.nombreArchivoOrigen IN :archivos)")
```

El campo comparado es **`f.fechaFactura`** (columna `fecha_factura` en BD).

**Cómo se almacena `fechaFactura`:** El parser `ExcelParserUtil.parsearFila()` lo mapea desde la columna `FECHA RECAUDO` / `FECHA PAGO` / `FECHA` del Excel. Para un archivo de recaudos de enero–marzo 2026, estas fechas serían fechas reales de transacción dentro de ese trimestre, **no la fecha de carga**.

**El problema:** El frontend envió `fechaInicio: "2026-02-02"` y `fechaFin: "2026-02-10"` — una ventana de solo 9 días. Si las facturas del archivo tienen fechas de recaudo distribuidas por todo enero–marzo, muchas quedarán fuera de esa ventana tan estrecha. Combinado con la condición de mora, el resultado puede ser vacío.

**Campo `fechaCarga` vs `fechaFactura`:** La fecha de carga (`fecha_carga`) se setea en `ExcelParserUtil.parsearFila()` como `LocalDate.now()`, pero **ninguna query en el repositorio filtra por `fecha_carga`**. El filtro de fecha siempre opera sobre `fecha_factura`.

---

### 4. Cómo se filtra tipoFuente='base'

Directamente en la JPQL de `findMorosos`:

```sql
(:tipoFuente IS NULL OR f.tipoFuente = :tipoFuente)
```

El campo en la entidad es `@Column(name = "tipo_fuente", length = 20) private String tipoFuente;`.

En `ExcelParserUtil.parsearFila()`:
```java
f.setTipoFuente(tipoFuente);
```

El valor se almacena exactamente como viene del parámetro de carga `?tipo=base` (o `"extra"` por defecto si no se especifica).

**Posible problema:** Si el archivo fue cargado usando el endpoint por defecto `POST /facturas/cargar` sin especificar `tipo`, el default es **`"extra"`** (ver `FacturaController.cargarArchivo()` línea `@RequestParam(value = "tipo", defaultValue = "extra")`), pero el reporte filtra por `tipoFuente: "base"`. Esta es **una causa probable** del resultado vacío si el archivo no se cargó explícitamente con `tipo=base`.

```java
// FacturaController.java
@PostMapping("/cargar")
public ResponseEntity<?> cargarArchivo(
    @RequestParam(value = "tipo", defaultValue = "extra") String tipo) {
```

---

### 5. Cómo se filtra soloMorosos=true

Al ser `true`, `consultarConFiltros()` **descarta** `findConFiltros()` y usa `findMorosos()`, que agrega la condición:

```sql
(f.valorMora > 0 OR f.saldoMora > 0 OR f.estadoPago = 'VENCIDO'
 OR (f.mesesMora IS NOT NULL AND f.mesesMora > 0))
```

El método `tieneMora()` de `Factura.java` define la misma lógica:

```java
public boolean tieneMora() {
    return (valorMora  != null && valorMora.compareTo(BigDecimal.ZERO)  > 0)
        || (saldoMora != null && saldoMora.compareTo(BigDecimal.ZERO) > 0)
        || (mesesMora != null && mesesMora > 0)
        || "VENCIDO".equals(estadoPago);
}
```

**El `estadoPago` se infiere al cargar:** `ExcelParserUtil.parsearFila()` marca `VENCIDO` si hay mora o si `fechaVencimiento < LocalDate.now()`. `fechaVencimiento = fechaFactura + 30 días`. Un archivo de enero–marzo 2026, cargado en junio 2026, tendría **todas las facturas con `estadoPago = 'VENCIDO'`** porque ya pasaron más de 30 días, independientemente del valor de mora.

Sin embargo, si el archivo contiene datos de recaudos donde las columnas VALOR MORA / VALOR ATRASO son cero, `valorMora` y `saldoMora` serán `BigDecimal.ZERO` en BD. La única condición que salvaría el filtro de morosos es `estadoPago = 'VENCIDO'`, que depende de que la fecha de vencimiento ya haya pasado.

---

### 6. Cómo se filtra estrato=1

El payload tiene `"estrato": 1` (campo legacy) y `"estratos": null`.

En `FiltroReporteDto.setEstrato()`:

```java
public void setEstrato(Integer estrato) {
    this.estrato = estrato;
    // Si llegan por el campo legacy, agregarlo a la lista
    if (estrato != null && (this.estratos == null || this.estratos.isEmpty())) {
        this.estratos = List.of(estrato);  // ← crea List.of(1)
    }
}
```

`getEstratosFiltro()` devuelve `List.of(1)`.

La consulta usa:
```sql
(:estratos IS NULL OR f.estrato IN :estratos)
```

Se compara como `Integer` (ya que el campo `f.estrato` es `Integer` en la entidad y el parámetro es `List<Integer>`). El estrato se almacena como:

```java
int estrato = (int) Double.parseDouble(estratoStr.trim());
if (estrato >= 1 && estrato <= 6) f.setEstrato(estrato);
```

La comparación es `Integer` vs `Integer`, no hay problema de tipo. **Sin embargo**, si el archivo Tipo 2 (recaudos) no tiene columna `ESTRATO`, `idx.estrato` será `null` y `f.estrato` quedará en `null`. Con `f.estrato = null`, la condición `f.estrato IN (1)` excluye esa fila.

---

### 7. Cómo se filtra nombreArchivos

El payload incluye `"nombreArchivos": ["01 enero-31 marzo.xlsx"]`.

En `FiltroReporteDto.getNombreArchivosFiltro()`:
```java
public List<String> getNombreArchivosFiltro() {
    if (nombreArchivos != null && !nombreArchivos.isEmpty()) return nombreArchivos;
    if (nombreArchivo  != null && !nombreArchivo.isBlank()) return List.of(nombreArchivo);
    return null;
}
```

Devuelve `["01 enero-31 marzo.xlsx"]`.

La query compara:
```sql
(:archivos IS NULL OR f.nombreArchivoOrigen IN :archivos)
```

En `ExcelParserUtil`:
```java
f.setNombreArchivoOrigen(nombreArchivo);  // exactamente como se pasó al método
```

En `ArchivoProcessorService.procesarExcel()`:
```java
String nombreArchivo = archivo.getOriginalFilename();
// ...
ExcelParserUtil.parsear(archivo, tipoFuente, nombreArchivo);
```

**`getOriginalFilename()` devuelve el nombre tal como el cliente HTTP lo envió.** Si el frontend envió el archivo con nombre `"01 enero-31 marzo.xlsx"`, se almacena exactamente así. La comparación es case-sensitive y espacio-sensitive. Si hay cualquier diferencia de encoding, espacios Unicode vs ASCII, u otro carácter invisible, el filtro falla.

---

### 8. Qué se almacena en la tabla Factura vs qué se filtra

| Campo | Almacenado por (ExcelParserUtil) | Filtrado por (query) | Posible discrepancia |
|---|---|---|---|
| `fecha_factura` | Columna `FECHA RECAUDO`/`FECHA PAGO` del Excel | `f.fechaFactura BETWEEN :inicio AND :fin` | Fechas del trimestre vs ventana de 9 días |
| `tipo_fuente` | Parámetro HTTP `tipo` (default `"extra"`) | `f.tipoFuente = 'base'` | **Si se cargó sin especificar tipo, es `"extra"` no `"base"`** |
| `nombre_archivo_origen` | `getOriginalFilename()` del request | `f.nombreArchivoOrigen IN :archivos` | Diferencias de encoding/espacios posibles |
| `estrato` | Columna `ESTRATO` del Excel; `null` si no existe | `f.estrato IN (1)` | `null` no coincide con ningún valor; excluye filas sin estrato |
| `valor_mora` / `saldo_mora` | Columnas VALOR ATRASO / PAGADO ATRASO / SALDO | condición morosos | Si el archivo es de recaudos pagados, pueden ser 0 |
| `estado_pago` | `"VENCIDO"` si mora > 0 o vencimiento pasó | condición morosos | Depende de cuándo se cargó vs fecha vencimiento |

---

### 9. Mismatch entre lo que se almacena (carga) y lo que se consulta (filtro)

Se identificaron **cuatro desajustes concretos:**

#### Desajuste 1 (CRÍTICO): tipoFuente almacenado como `"extra"`, filtrado como `"base"`

El endpoint de carga `POST /facturas/cargar` tiene `defaultValue = "extra"`. Si el usuario no especificó `tipo=base` explícitamente en el formulario de carga, las facturas quedaron con `tipo_fuente = 'extra'`, pero el filtro del reporte busca `tipoFuente = 'base'`.

Verificación: en `ArchivoProcessorService.procesarExcel()`, el `tipoFuente` viene del parámetro del endpoint de carga. Si la UI de carga envió `tipo=base` correctamente, este campo estará bien. Si no lo especificó, está mal.

#### Desajuste 2 (PROBABLE): Ventana de fechas demasiado estrecha

`fechaInicio=2026-02-02` a `fechaFin=2026-02-10` (9 días). Para un archivo de "enero–marzo 2026", las facturas tienen `fechaFactura` distribuida en ese trimestre completo. Si el Excel tiene una fecha única por mes o fechas agrupadas, la mayoría caerá fuera del rango de 9 días.

#### Desajuste 3 (POSIBLE): Estrato null en facturas sin columna ESTRATO

Si el archivo Tipo 2 (recaudos) no tiene columna `ESTRATO`, todas las facturas quedan con `estrato = null`. Al filtrar por `estrato IN (1)`, **todas son excluidas**.

#### Desajuste 4 (POSIBLE): nombreArchivoOrigen con codificación/espacios

El nombre `"01 enero-31 marzo.xlsx"` tiene espacios. Si hay diferencias de encoding entre lo que el browser envió al cargar vs lo que el frontend envió al generar el reporte (p.ej. `%20` vs espacio real vs espacio Unicode), la comparación exacta en SQL falla.

---

## Flujo exacto del error

```
POST /api/facturas/reporte con el payload enviado
  ↓
FacturaController.generarReporte()
  ↓
filtros.isSoloMorosos() = true → rama findMorosos()
  ↓
FacturaService.consultarConFiltros()
  └─ findMorosos(
       inicio=2026-02-02, fin=2026-02-10,
       municipios=null,
       estratos=[1],          ← de estrato legacy
       tipoFuente="base",     ← filtro activo
       archivos=["01 enero-31 marzo.xlsx"]
     )
     SQL: WHERE (mora > 0 OR saldo > 0 OR estadoPago='VENCIDO' OR mesesMora > 0)
          AND fechaFactura BETWEEN '2026-02-02' AND '2026-02-10'
          AND estrato IN (1)
          AND tipoFuente = 'base'
          AND nombreArchivoOrigen IN ('01 enero-31 marzo.xlsx')
  ↓
Lista vacía devuelta (ninguna fila cumple TODOS los criterios)
  ↓
ReporteGeneradorService.validarDatos([]) → lanza EpqException(REPORTE_SIN_DATOS)
  ↓
FacturaController → ResponseEntity con HttpStatus.BAD_REQUEST y código ERR_401
```

---

## Conclusiones y recomendaciones de fix

### Fix 1 (CRÍTICO): Verificar tipoFuente al cargar

Si el archivo fue cargado sin especificar `tipo=base`, hay dos opciones:
- **Opción A:** Re-cargar el archivo con `tipo=base` explícito.
- **Opción B:** En el endpoint de carga, cambiar el `defaultValue` de `"extra"` a `"base"` si ese es el tipo por defecto del negocio:

  ```java
  // FacturaController.java línea ~77
  @RequestParam(value = "tipo", defaultValue = "base") String tipo  // era "extra"
  ```

- **Opción C (más segura):** Verificar en BD qué valor de `tipo_fuente` tienen las facturas del archivo antes de re-cargar. Consulta SQL: `SELECT DISTINCT tipo_fuente FROM facturas WHERE nombre_archivo_origen = '01 enero-31 marzo.xlsx';`

### Fix 2 (RECOMENDADO): No combinar soloMorosos con ventana de fechas muy estrecha

Si el propósito es ver morosos de un archivo completo, el frontend debería enviar `fechaInicio=null` y `fechaFin=null` cuando ya está filtrando por `nombreArchivos`. El rango de 9 días es muy restrictivo para datos de un trimestre.

Alternativamente, usar `mesesReferencia: ["2026-01", "2026-02", "2026-03"]` en lugar de fechaInicio/fechaFin, lo que enruta a `findConFiltrosMes()` y filtra por `mesReferencia` en lugar de `fechaFactura`.

### Fix 3 (RECOMENDADO): Manejar estrato null correctamente

Si el archivo no tiene columna `ESTRATO`, no enviar `estrato: 1` en el payload. Enviar `estrato: null` y `estratos: null` para no filtrar por estrato.

### Fix 4 (DIAGNÓSTICO): Verificar nombre exacto en BD

Antes de cualquier cambio, ejecutar:
```sql
SELECT DISTINCT nombre_archivo_origen, tipo_fuente, COUNT(*) as total
FROM facturas
WHERE nombre_archivo_origen LIKE '%enero%'
GROUP BY nombre_archivo_origen, tipo_fuente;
```
Esto confirma si el nombre y `tipoFuente` en BD coinciden exactamente con los valores del filtro.

### Fix 5 (MEJORA DE CÓDIGO): Agregar diagnóstico cuando la lista es vacía

En `FacturaService.consultarConFiltros()`, antes de devolver vacío, loggear los valores efectivos de cada parámetro:

```java
if (facturas.isEmpty()) {
    System.out.println("=== CONSULTA SIN RESULTADOS ===");
    System.out.println("tipoFuente=" + tipoFuente);
    System.out.println("archivos=" + archivos);
    System.out.println("estratos=" + estratos);
    System.out.println("inicio=" + filtros.getFechaInicio() + " fin=" + filtros.getFechaFin());
    System.out.println("soloMorosos=" + filtros.isSoloMorosos());
}
```

Esto facilitaría confirmar cuál de los filtros es el culpable en tiempo de ejecución.

---

## Archivos clave citados

| Archivo | Rol |
|---|---|
| `controller/FacturaController.java` | Endpoint `POST /facturas/reporte`; default `tipo="extra"` en carga |
| `service/FacturaService.java` | `consultarConFiltros()`: selecciona `findMorosos` cuando `soloMorosos=true` |
| `repository/FacturaRepository.java` | `findMorosos()`: JPQL con 6 condiciones AND encadenadas |
| `service/ReporteGeneradorService.java` | `validarDatos()` lanza ERR_401 cuando la lista es vacía |
| `dto/FiltroReporteDto.java` | `setEstrato()` propaga legacy field a lista; `getNombreArchivosFiltro()` combina singular/plural |
| `util/ExcelParserUtil.java` | Almacena `tipoFuente` desde parámetro HTTP; `fechaFactura` desde columna de fecha del Excel |
| `exception/ErrorCode.java` | `REPORTE_SIN_DATOS("ERR_401", ...)` |
