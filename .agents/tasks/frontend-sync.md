# Frontend ↔ Backend Sync Report

Generated: 2026-11-11  
Build result: ✅ **PASSED** (`ng build --configuration development`)

---

## 1. Backend Endpoints vs Frontend Counterparts

| Controller | Method | URL | Had frontend? | Status after fix |
|---|---|---|---|---|
| AuthController | POST | /auth/login | ✅ Yes | No change needed |
| AuthController | POST | /auth/registrar | ✅ Yes | Fixed (register.ts now calls backend) |
| UsuarioController | GET | /usuarios/perfil | ✅ Yes | No change needed |
| UsuarioController | PUT | /usuarios/perfil | ✅ Yes | No change needed |
| UsuarioController | POST | /usuarios/perfil/foto | ✅ Yes | No change needed |
| UsuarioController | GET | /usuarios | ✅ Yes | Fixed (user.ts now loads real data) |
| UsuarioController | DELETE | /usuarios/{id} | ✅ Yes | Fixed (user.ts now calls backend) |
| FacturaController | POST | /facturas/cargar | ✅ Yes | No change needed |
| FacturaController | POST | /facturas/cargar-multiple | ✅ Yes | No change needed |
| FacturaController | GET | /facturas/municipios | ✅ Yes | No change needed |
| FacturaController | GET | /facturas/estratos | ✅ Yes | No change needed |
| FacturaController | GET | /facturas/meses | ✅ Yes | No change needed |
| FacturaController | POST | /facturas/resumen | ✅ Yes | No change needed |
| FacturaController | POST | /facturas/totales-estrato | ✅ Yes | No change needed |
| FacturaController | POST | /facturas/totales-municipio | ✅ Yes | No change needed |
| FacturaController | POST | /facturas/detalle-vivienda | ✅ Yes | No change needed |
| ReporteController | POST | /reportes/generar | ❌ Wrong URL | Fixed: service now calls /reportes/excel or /reportes/pdf |
| ReporteController | POST | /reportes/excel | ❌ Missing | Fixed: `generarReporte()` now calls `/reportes/excel` for xlsx |
| ReporteController | POST | /reportes/pdf | ❌ Missing | Fixed: `generarReporte()` now calls `/reportes/pdf` for pdf |
| ReporteController | POST | /reportes/ambos | ❌ Wrong URL | Fixed: `generarReporteAmbos()` now calls `/reportes/ambos` |
| ExcelController | GET | /excel | ✅ Yes | No change needed |
| ExcelController | GET | /excel/{nombre} | ✅ Yes | No change needed |
| ExcelController | DELETE | /excel/{nombre} | ✅ Yes | No change needed |
| ExcelController | GET | /excel/tipos | ❌ Missing | Added to InformeService (available via service) |
| ExcelController | GET | /excel/{nombre}/municipios | ❌ Missing | Available via `getDetalleArchivo()` |
| ExcelController | GET | /excel/{nombre}/meses | ❌ Missing | Available via `getDetalleArchivo()` |
| ExcelController | GET | /excel/{nombre}/estratos | ❌ Missing | Available via `getDetalleArchivo()` |
| InformeController | POST | /informes/deudores-morosos | ❌ Missing | **Added** `InformeService.deudoresMorosos()` |
| InformeController | POST | /informes/totales-municipio | ❌ Missing | **Added** `InformeService.totalesMunicipio()` |
| InformeController | POST | /informes/totales-estrato | ❌ Missing | **Added** `InformeService.totalesEstrato()` |
| InformeController | POST | /informes/cartera-acumulada | ❌ Missing | **Added** `InformeService.carteraAcumulada()` |
| InformeController | POST | /informes/recaudo-servicio | ❌ Missing | **Added** `InformeService.recaudoServicio()` |
| InformeController | POST | /informes/proyeccion | ❌ Missing | **Added** `InformeService.proyeccion()` |
| InformeController | POST | /informes/generar | ❌ Missing | **Added** `InformeService.generar()` |

---

## 2. DTO / Model Field Mismatches Corrected

### `Factura` model (`factura.ts`)
| Backend field | Was in frontend | Action |
|---|---|---|
| `codigoCliente` | ❌ Missing | Added (optional) |
| `nombreCliente` | ❌ Missing | Added (optional) |
| `numeroMedidor` | ❌ Missing | Added (optional) |
| `mesesMora` | ❌ Missing | Added (optional) |
| `barrio` | ✅ Present | Made optional |
| `direccionServicio` | ✅ Present | Made optional |
| `numeroContrato` | ✅ Present | Made optional |
| `nombreServicio` | ✅ Present | Made optional |
| `estadoPago` | ✅ Present | Added JSDoc note: VENCIDO = real mora exists |
| All other fields | ✅ Present | No change |

### New `ApiError` interface added to `factura.ts`
Maps `ApiErrorDto` fields: `codigo`, `mensaje`, `detalle`, `timestamp`, `path`, `erroresCampos`, `erroresParciales`.

### New `FiltroInforme` interface (`informe.ts`) — new file
Maps `FiltroInformeDto`: `municipios`, `estratos`, `servicios`, `nombreArchivos`, `fechaInicio`, `fechaFin`, `tipoInforme`, `topN`, `mesesBase`, `mesesFuturos`, `formato`.

### `Usuario` model (`usuario.ts`)
| Field | Was in frontend | Action |
|---|---|---|
| `password` | ❌ Missing | Added (optional, write-only) |

### `FiltroReporte` model (`filtro-reporte.ts`)
Already complete — no changes needed. `estratos` (list), `mesesReferencia`, `nombreArchivos`, `agruparPorEstrato`, `ambosFormatos` were all present.

---

## 3. Service Methods Added or Changed

### `factura.service.ts`
| Method | Before | After |
|---|---|---|
| `generarReporte()` | Called `/facturas/reporte` (non-existent) | Now calls `/reportes/xlsx` or `/reportes/pdf` depending on `filtros.tipoArchivo` |
| `generarReporteAmbos()` | Called `/facturas/reporte-ambos` (non-existent) | Now calls `/reportes/ambos` |
| `generarReporteLegado()` | Did not exist | Added — calls `/reportes/generar` (compatibility) |

### `informe.service.ts` — new file
Complete service for all InformeController endpoints:
- `deudoresMorosos(filtros)` → POST /informes/deudores-morosos
- `totalesMunicipio(filtros)` → POST /informes/totales-municipio
- `totalesEstrato(filtros)` → POST /informes/totales-estrato
- `carteraAcumulada(filtros)` → POST /informes/cartera-acumulada
- `recaudoServicio(filtros)` → POST /informes/recaudo-servicio
- `proyeccion(filtros)` → POST /informes/proyeccion
- `generar(filtros)` → POST /informes/generar

---

## 4. Component Changes

### `register.ts`
- **Before**: Showed `alert("Registro exitoso")` without calling any API.
- **After**: Calls `authService.register()` → POST /auth/registrar with correct UsuarioDto payload (`nombreCompleto`, `correo`, `telefono`, `cedula`, `username`, `password`). Error handling reads `codigo`/`mensaje` from ApiErrorDto.

### `user.ts` / `user.html`
- **Before**: Used 5 hardcoded fake users; no backend call.
- **After**: Calls `usuarioService.listarUsuarios()` → GET /usuarios. `eliminarUsuario()` now calls DELETE /usuarios/{id}. HTML updated to show real fields (nombre, username, correo, teléfono, rol) with delete button.

### `admin.ts` / `admin.html`
- **Before**: `tipoArchivo = 'excel'` — invalid per backend `@Pattern(regexp = "xlsx|pdf")`.
- **After**: `tipoArchivo = 'xlsx'`. Radio buttons in HTML changed from `value="excel"` to `value="xlsx"`.
- **Before**: Blob error parsing only checked `jsonError.message || jsonError.error`.
- **After**: Now checks `jsonError.mensaje` first (ApiErrorDto field), logs `jsonError.detalle` and `jsonError.codigo` to console.
- **Added**: `goToInformes()` navigation method.
- **HTML**: Added "Informes Analíticos" tab in nav bar.

### `upload.ts`
- **Before**: HTTP 500 showed generic message; non-200 errors showed generic message.
- **After**: HTTP 500 reads `body.mensaje` from ApiErrorDto. All non-200 paths read `body.mensaje || body.detalle`.

### New: `informes.ts` / `informes.html` / `informes.css`
Full new component at `/informes` route. Features:
- Tipo de informe selector (6 types from InformeController)
- Filtros: fecha inicio/fin, municipios (multi), estratos (multi), archivos fuente (multi)
- Opciones tipo-específicas: topN (para DEUDORES_MOROSOS), mesesBase/mesesFuturos (para PROYECCION)
- Formato xlsx/pdf
- Error handling using `codigo`/`mensaje`/`detalle` de ApiErrorDto
- Calls `InformeService.generar()` → POST /informes/generar

### `app.routes.ts`
- **Added**: Route `/informes` → lazy-loaded `InformesComponent`.

---

## 5. tipoFuente / upload verification

- `upload.ts` default `tipoFuente = 'extra'` ✅ matches backend default.
- `upload.html` select shows "Archivos Extra" first ✅.
- `cargarExcel()` sends field name `archivo` ✅ (backend prefers `archivo` but also accepts `file`).
- `cargarMultiplesArchivos()` sends field name `archivos` ✅ matches backend `@RequestParam("archivos")`.

---

## 6. estadoPago display

- `Factura.estadoPago` JSDoc updated: `VENCIDO` means real mora exists (not just date expiry).
- Existing UI does not display individual factura `estadoPago` values in table rows, so no visible label changes were needed beyond the model comment.

---

## 7. Reporte filters verification

`FiltroReporte` sends:
- `estratos: number[]` as the primary list field ✅ 
- `estrato: number | null` for legacy single-value ✅
- `mesesReferencia: string[]` for specific months ✅ (backend prefers this over fechaInicio/fechaFin for punctual months)
- `fechaInicio` / `fechaFin` for date ranges ✅

---

## 8. Build Result

```
ng build --configuration development

✅ BUILD SUCCESS
Application bundle generation complete. [4.249 seconds]
Output location: dist/epq-app

Chunk files:
  chunk-PIIKR7FK.js  1.49 MB
  main.js           162.89 kB
  styles.css          5.40 kB

Lazy chunks:
  informes (new)     44.55 kB
  perfil             29.82 kB

No TypeScript errors.
```
