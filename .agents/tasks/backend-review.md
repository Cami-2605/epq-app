# Backend Code Review — EpqBack
**Fecha:** 2026-11-11  
**Revisión de:** cambios recientes al backend Spring Boot

---

## Resumen ejecutivo

Todos los fixes puntuales que se esperaban están correctamente aplicados. El proyecto compila sin errores ni advertencias. Se identificaron **cuatro problemas pendientes** de gravedad media que explican por qué los archivos se suben pero los informes no muestran datos, y por qué el filtro de morosos retorna todos los registros.

---

## 1. Verificación de los fixes esperados

### ✅ `ArchivoExcelRepository.java` — `deleteByNombreArchivo()`

Tiene ambas anotaciones correctas:

```java
@Modifying
@Transactional
void deleteByNombreArchivo(String nombreArchivo);
```

**Archivo:** `src/main/java/com/epq/epqbackend/repository/ArchivoExcelRepository.java`, líneas 15-17.

---

### ✅ `ExcelParserUtil.java` — `COL_FECHA` sin `"periodo"`, `COL_CONTRATO` como `List`

`COL_FECHA` es un `Set` que contiene exactamente: `fecharecaudo`, `fecha`, `fechapago`, `fechadepago`, `fechafactura`, `fechaemision`, `fechacorte`, `mes`. **`"periodo"` no está presente.** ✔

`COL_CONTRATO` es un `List` con orden determinístico:

```java
private static final List<String> COL_CONTRATO = List.of(
        "contrato", "numerodocumento", "numerocontrato", "nrocontrato",
        "documento", "transaccion"
);
```

La prioridad es fija: `contrato` gana sobre `documento`, que gana sobre `transaccion`. ✔

**Archivo:** `src/main/java/com/epq/epqbackend/util/ExcelParserUtil.java`, líneas ~90-100 y ~130-135.

---

### ✅ `ArchivoExcel.java` — campo `errores` con `@Column(columnDefinition = "TEXT")`

```java
@Column(columnDefinition = "TEXT")
private String errores;
```

**Archivo:** `src/main/java/com/epq/epqbackend/model/ArchivoExcel.java`, líneas 22-23.

---

### ✅ `application.yaml` — propiedades de batch insert

Presentes y correctas:

```yaml
spring:
  datasource:
    url: jdbc:mariadb://...&rewriteBatchedStatements=true
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 500
          batch_versioned_data: true
        order_inserts: true
        order_updates: true
```

`rewriteBatchedStatements=true` está en la URL del datasource (posición correcta para el driver MariaDB). ✔

---

## 2. Revisión general de calidad de código

### 🔴 PROBLEMA CRÍTICO: Transacción partida en `procesarExcel` / `registrarArchivo`

**Archivo:** `ArchivoProcessorService.java`

El método `procesarExcel()` lleva `@Transactional`. Dentro llama a `registrarArchivo()` que a su vez llama a `archivoExcelRepository.deleteByNombreArchivo()`. Hasta aquí bien.

El problema está en que `procesarArchivos()` (el método público que el controlador llama) **no tiene `@Transactional`**. `procesarExcel()` y `procesarPdf()` son `protected`, y en Spring, las llamadas a métodos protegidos en el mismo bean **no pasan por el proxy AOP**. Esto significa que la anotación `@Transactional` en `procesarExcel()` **no tiene efecto**: las facturas se guardan sin transacción, y si algo falla a mitad de camino, no hay rollback.

```
// procesarArchivos() → llama directamente (sin proxy) a:
protected ResultadoCarga.ResultadoArchivo procesarExcel(...) @Transactional  ← IGNORADO
```

**Efecto en producción:** los registros de facturas se salvan de forma no atómica. Si la inserción del `ArchivoExcel` falla, las facturas ya quedaron persistidas. Si la conexión cae a mitad del lote, se guardan registros parciales.

**Fix recomendado:** mover `@Transactional` a `procesarArchivos()`, o extraer la lógica de `procesarExcel`/`procesarPdf` a un componente auxiliar `@Service` separado para que el proxy AOP aplique.

---

### 🔴 PROBLEMA CRÍTICO: `COL_FECHA` incluye `"mes"` — colisión con columnas de datos

**Archivo:** `ExcelParserUtil.java`, `COL_FECHA`

El alias `"mes"` está en `COL_FECHA`:

```java
private static final Set<String> COL_FECHA = Set.of(
        "fecharecaudo", "fecha", "fechapago", "fechadepago",
        "fechafactura", "fechaemision", "fechacorte",
        "mes"   // ← PROBLEMA
);
```

Y también en `COL_PERIODO`:

```java
private static final Set<String> COL_PERIODO = Set.of(
        "periodo", "mesreferencia", "mes"  // ← también aquí
);
```

En el archivo Tipo 2 (Recaudos), la columna `MES` contiene un período como `"09/2024"`, no una fecha dd/MM/yyyy. Si ese archivo tiene una columna llamada `MES`, el parser la tratará como fecha de factura y lanzará `EXCEL_FECHA_INVALIDA` para cada fila, o — si el valor coincide con algún formato soportado por accidente — generará fechas incorrectas.

Adicionalmente, `primeroDeSet` sobre un `Set` no garantiza orden de iteración, por lo que si el archivo tiene ambas columnas `FECHA` y `MES`, cualquiera podría ganar en función del orden del `HashSet`.

**Fix recomendado:** eliminar `"mes"` de `COL_FECHA`. Dejar `"mes"` solo en `COL_PERIODO`.

---

### 🟡 PROBLEMA MEDIO: Filtro `soloMorosos` retorna todos los registros

**Archivo:** `FacturaRepository.java`, query `findMorosos`, líneas ~56-68

La cláusula WHERE empieza así:

```jpql
(f.valorMora > 0 OR f.saldoMora > 0 OR f.estadoPago = 'VENCIDO'
 OR (f.mesesMora IS NOT NULL AND f.mesesMora > 0)) AND ...
```

El problema es el campo `estadoPago = 'VENCIDO'`. En `ExcelParserUtil.parsearFila()`, la lógica de estado es:

```java
boolean vencida = f.getFechaVencimiento().isBefore(LocalDate.now());
f.setEstadoPago(tieneDeuda || vencida ? "VENCIDO" : "PENDIENTE");
```

`fechaVencimiento = fechaFactura.plusDays(30)`. Si las fechas del archivo son de 2026 (como mencionó la usuaria), **todos los registros tienen `fechaVencimiento` en el futuro al momento de carga**… pero si las fechas son históricas (2024-2025), la mayoría vence en 30 días, por lo que casi todas las facturas quedan con `estadoPago = 'VENCIDO'`. Eso hace que el filtro de morosos retorne prácticamente todos los registros.

**Fix recomendado:** separar la lógica de "vencida por fecha" de la lógica de "tiene mora real". Una factura debería ser `VENCIDO` solo si `valorMora > 0 OR saldoMora > 0 OR mesesMora > 0`. El hecho de que la fecha haya pasado no implica mora si el cliente pagó.

---

### 🟡 PROBLEMA MEDIO: `ExcelService` obsoleto sigue activo como `@Service`

**Archivo:** `src/main/java/com/epq/epqbackend/service/ExcelService.java`

Esta clase es el servicio legacy que leía archivos desde el filesystem (`data/excel/base`, `data/excel/extra`). Hoy todo el procesamiento va por `ArchivoProcessorService`. Pero `ExcelService` sigue anotado como `@Service` y en su constructor crea los directorios del filesystem:

```java
public ExcelService() throws IOException {
    Files.createDirectories(basePath);
    Files.createDirectories(extraPath);
}
```

Esto no es un bug activo, pero:
- Si falla la creación del directorio en deploy, el contexto de Spring no levanta.
- Mantiene código muerto con dos rutas de procesamiento (filesystem vs BD) que pueden confundir.
- El método `leerExcel()` requiere la columna `"fecha"` pero no soporta todos los formatos numéricos de POI.

**Fix recomendado:** eliminar o deprecar explícitamente `ExcelService`. Si no se usa desde ningún controller, puede borrarse.

---

### 🟡 PROBLEMA MEDIO: `GlobalExceptionHandler` mapea `RuntimeException` → HTTP 400

**Archivo:** `GlobalExceptionHandler.java`, línea ~74

```java
@ExceptionHandler(RuntimeException.class)
public ResponseEntity<ApiErrorDto> handleRuntime(RuntimeException ex, ...) {
    ...
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
}
```

Una `RuntimeException` genérica (NPE, `IllegalStateException`, errores de Hibernate) debería retornar HTTP 500, no 400. Con 400 el cliente (Angular) puede interpretar que el error es del formulario y no del servidor, dificultando el diagnóstico.

**Fix recomendado:** cambiar a `HttpStatus.INTERNAL_SERVER_ERROR` para `RuntimeException`.

---

### 🟢 OBSERVACIONES MENORES (no bloquean)

1. **`ArchivoExcel` no persiste el `tipoFuente` correctamente como campo propio.** El campo `tipo` almacena `tipoFuente` ("base"/"extra"). El nombre `tipo` es ambiguo (podría confundirse con tipo de archivo EXCEL/PDF). No es un bug pero puede confundir.

2. **`registrarArchivo()` trunca errores a 2000 caracteres**, lo cual es correcto dado el `@Column(columnDefinition = "TEXT")` anterior. Sin embargo, el límite hardcodeado de `limit(5)` errores + `2000` chars es un magic number. Considerar una constante.

3. **`ExcelController.detalle()` y `eliminarArchivo()`** hacen `findAll().stream().filter(...)` para buscar un archivo por nombre. Con muchos registros esto es una consulta completa a la tabla. Mejor añadir `findByNombreArchivo(String)` al repositorio.

4. **`parsearFecha`** soporta formatos `dd/MM/yyyy` y `dd-MM-yyyy` pero no `d/M/yyyy` (días y meses sin cero a la izquierda), que es común en exports de Excel colombianos. No es crítico pero puede causar errores en algunas fuentes.

5. **Credenciales en claro en `application.yaml`:** `password: 1234` y el JWT secret están en el archivo de configuración. Para producción deben externalizarse con variables de entorno o Spring Cloud Config.

---

## 3. Verificación de compilación

```
$ .\mvnw.cmd compile

[INFO] BUILD SUCCESS
[INFO] Total time: 2.482 s
```

**El proyecto compila sin errores ni warnings.** Ninguna clase falta, ninguna importación está rota.

---

## 4. Conclusiones y recomendaciones priorizadas

| Prioridad | Problema | Archivo | Fix |
|-----------|----------|---------|-----|
| 🔴 Alta | `@Transactional` en método `protected` no aplica (AOP bypass) | `ArchivoProcessorService.java` | Mover `@Transactional` a `procesarArchivos()` o extraer a un servicio auxiliar |
| 🔴 Alta | `"mes"` en `COL_FECHA` causa fecha inválida en archivos Tipo 2 | `ExcelParserUtil.java` | Eliminar `"mes"` de `COL_FECHA`; dejarlo solo en `COL_PERIODO` |
| 🟡 Media | Filtro morosos retorna todos porque `estadoPago='VENCIDO'` cubre todas las facturas vencidas | `ExcelParserUtil.java` + `FacturaRepository.java` | Cambiar lógica de `estadoPago`: solo `VENCIDO` si hay mora real, no solo por fecha |
| 🟡 Media | `ExcelService` obsoleto puede impedir el arranque en entornos sin filesystem | `ExcelService.java` | Eliminar o remover `@Service` |
| 🟡 Media | `RuntimeException` retorna HTTP 400 en lugar de 500 | `GlobalExceptionHandler.java` | Cambiar a `INTERNAL_SERVER_ERROR` |
| 🟢 Baja | `findAll().stream().filter()` para buscar por nombre en `ExcelController` | `ExcelController.java` | Agregar `findByNombreArchivo()` al repositorio |

El bug de mayor impacto para el problema reportado ("se sube el archivo pero no salen en los informes") es más probablemente la combinación del bypass transaccional + el alias `"mes"` en `COL_FECHA`. Si el archivo tiene una columna llamada `MES` con valores de período, el parser falla en la validación de fecha y no guarda ninguna factura, aunque registra el `ArchivoExcel` como procesado.
