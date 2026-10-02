# Implementation Plan — Adaptar frontend Angular al backend actualizado

## Contexto descubierto durante exploración

- `perfil.ts` importa `Usuario` desde `usuario.service.ts` (no desde `models/usuario.ts`) y usa `correo`.  
  La interfaz en `usuario.service.ts` ya tiene `correo: string`. La interfaz en `models/usuario.ts` tiene `email: string` pero **nadie la usa en los templates**.  
  → Para `models/usuario.ts`: agregar `correo?: string` junto a `email` (compatibilidad), ya que el campo `email` no aparece en ningún template leído.

- `reporte.service.ts` existe y apunta a `/reportes/generar` (endpoint incorrecto). Debe actualizarse.

- `factura.service.ts` necesita `import { HttpParams } from '@angular/common/http'` para los métodos con query params opcionales.

- `upload.ts` usa el tipo `ArchivoExcel` definido localmente (no el del modelo), cosa que no hay que cambiar — son diferentes definiciones con el mismo nombre.

---

## Pasos (ordenados por dependencia: modelos → servicios → componentes)

- [ ] 1. Actualizar la interfaz `Factura` en el modelo
      Agregar los dos campos nuevos que devuelve el backend: `saldoMora: number` y `tipoArchivoOrigen: string`.
      Archivo: `src/app/core/models/factura.ts`
      Verificar: `npx ng build --configuration development` — sin errores TypeScript.

- [ ] 2. Actualizar la interfaz `FiltroReporte` en el modelo
      Agregar los cinco campos nuevos manteniendo `estrato: number | null` existente:
      - `estratos: number[] | null`
      - `mesesReferencia: string[] | null`
      - `nombreArchivos: string[] | null`
      - `agruparPorEstrato: boolean`
      - `ambosFormatos: boolean`
      Archivo: `src/app/core/models/filtro-reporte.ts`
      Verificar: `npx ng build --configuration development` — sin errores TypeScript.

- [ ] 3. Actualizar la interfaz `Usuario` en el modelo
      Agregar `correo?: string` sin eliminar `email: string` (hay código que podría depender de email aunque no se encontró en templates).
      Archivo: `src/app/core/models/usuario.ts`
      Verificar: `npx ng build --configuration development` — sin errores TypeScript.

- [ ] 4. Actualizar `FacturaService` con los nuevos métodos y params opcionales
      Cambios requeridos:
      a) Agregar `HttpParams` al import de `@angular/common/http`.
      b) Actualizar `getMunicipios(tipoFuente?: string, archivo?: string)` para construir `HttpParams` cuando los argumentos estén presentes.
      c) Actualizar `getEstratos(tipoFuente?: string, archivo?: string)` igual que municipios.
      d) Agregar `cargarMultiplesArchivos(archivos: File[], tipo: string): Observable<any>` — POST `/facturas/cargar-multiple` con FormData, campo `archivos[]` por cada archivo.
      e) Agregar `getMeses(tipoFuente?: string, archivo?: string): Observable<string[]>` — GET `/facturas/meses` con query params opcionales.
      f) Agregar `getResumen(filtros: any): Observable<any>` — POST `/facturas/resumen`.
      g) Agregar `generarReporteAmbos(filtros: any): Observable<Blob>` — POST `/facturas/reporte-ambos`, `responseType: 'blob'`.
      h) Agregar `getTotalesPorEstrato(filtros: any): Observable<any>` — POST `/facturas/totales-estrato`.
      i) Agregar `getTotalesPorMunicipio(filtros: any): Observable<any>` — POST `/facturas/totales-municipio`.
      j) Agregar `getDetallePorVivienda(filtros: any): Observable<any>` — POST `/facturas/detalle-vivienda`.
      Archivo: `src/app/core/services/factura.service.ts`
      Verificar: `npx ng build --configuration development` — sin errores TypeScript.

- [ ] 5. Actualizar `ReporteService`
      Cambios requeridos:
      a) Actualizar `generarReporte` para que cuando `filtros.ambosFormatos === true` llame a `POST /facturas/reporte-ambos` (responseType blob), y cuando no llame a `POST /facturas/reporte` (endpoint correcto, actualmente apunta a `/reportes/generar` que es incorrecto).
      b) Agregar método `generarReporteAmbos(filtros: any): Observable<Blob>` — POST `/facturas/reporte-ambos`, `responseType: 'blob'`.
      Nota: la `apiUrl` de este servicio es `http://localhost:8080/api`; las rutas de facturas son `/facturas/reporte` y `/facturas/reporte-ambos`.
      Archivo: `src/app/core/services/reporte.service.ts`
      Verificar: `npx ng build --configuration development` — sin errores TypeScript.

- [ ] 6. Actualizar el componente TypeScript `UploadComponent`
      Cambios requeridos:
      a) Cambiar `selectedFile: File | null = null` por `selectedFiles: File[] = []`.
      b) Actualizar `onFileSelected` para aceptar múltiples archivos; validar que cada uno sea `.pdf`, `.xlsx` o `.xls`; asignar los válidos a `selectedFiles`.
      c) Actualizar `uploadFile` para: si `selectedFiles.length === 1` usar `cargarExcel(selectedFiles[0], tipoFuente)` (comportamiento existente); si `selectedFiles.length > 1` usar `cargarMultiplesArchivos(selectedFiles, tipoFuente)`.
      d) Manejar respuesta HTTP 207 Multi-Status: mostrar en `mensajeExito` un resumen de resultados parciales (ej. `"X archivos procesados, Y fallidos"`).
      e) Tras subida exitosa limpiar `selectedFiles = []` y resetear el input `#fileInput`.
      f) Actualizar todas las referencias a `selectedFile` en el componente por `selectedFiles` (incluido el guard `if (!selectedFiles.length)`).
      Archivo: `src/app/features/excel/upload/upload.ts`
      Verificar: `npx ng build --configuration development` — sin errores TypeScript.

- [ ] 7. Actualizar el template HTML del componente `UploadComponent`
      Cambios requeridos:
      a) Agregar atributo `multiple` al `<input type="file">`.
      b) Cambiar `accept=".xlsx,.xls"` a `accept=".pdf,.xlsx,.xls"`.
      c) Reemplazar el `<p>` de archivo seleccionado: cuando `selectedFiles.length === 1` mostrar nombre y tamaño del único archivo; cuando `selectedFiles.length > 1` mostrar una lista `<ul>` con cada nombre.
      d) Actualizar el atributo `[disabled]` del botón de subir: cambiar `!selectedFile` por `!selectedFiles.length`.
      e) Actualizar el texto del botón si se quiere indicar "Subir archivos" cuando hay múltiples (opcional pero recomendado).
      Archivo: `src/app/features/excel/upload/upload.html`
      Verificar: `npx ng build --configuration development` — sin errores TypeScript ni errores de template.

- [ ] 8. Build final de verificación
      Ejecutar el build completo y corregir cualquier error TypeScript residual antes de marcar el plan como completo.
      Comando: `cd c:\Users\Cami\Documents\GitHub\epq-app && npx ng build --configuration development`
      Verificar: salida termina con `✔ Build at:` (o equivalente) sin errores.
