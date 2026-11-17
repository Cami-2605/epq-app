# UI Polish – Change Summary

## Build result
`ng build --configuration development` completed successfully in ~4 seconds.
Output: `dist/epq-app`

---

## admin.html
- Removed the "Informes Analíticos" tab button and its separator from `<nav class="tabs">`.
  Tab bar now shows exactly: **Subir Excel | Generar Reporte | Usuarios**.
- Removed the separate `<main *ngIf="activeTab === 'informes'">` block.
- Appended Informes Analíticos content (alerts, tipo-de-informe card, filters-grid, generate-btn)
  at the bottom of the `reporte` tab, separated by `<div class="section-divider"></div>` and
  `<h2 class="section-heading">Informes Analiticos</h2>`.
- Added "Crear nuevo usuario" collapsible section to the `usuarios` tab with form fields
  (nombreCompleto, username, correo, telefono, cedula, password, rol) and a generate-btn.
- Removed all emoji characters (replaced `✎` pencil with text "Editar" in perfil.html).
- Stripped any remaining accented/special characters from template text that could cause
  display issues (apostrophes replaced with ASCII equivalents).

## admin.ts
- Changed `activeTab` initial value from `'reporte'` to `'upload'` so Subir Excel is shown first.
- Added fields: `usuarios_success`, `showCrearUsuario`, `nuevoUsuario` object.
- Added `crearUsuario()` async method: calls `authService.register()`, on success resets
  form, sets `usuarios_success`, calls `cargarUsuarios()`, clears message after 4 s;
  on error sets `usuarios_error`.

## admin.css
- Added `.section-heading` for the Informes Analíticos heading inside the reporte tab.
- Added upload-area card styles (`.upload-area`, `.upload-row`, input/select/button within it,
  `.info-text`).
- Added table styles (`.table-box`, `.table-header`, `.table-row`, `.actions`, `.filename`,
  `.estado`, `.loading-state`, `.spinner`).
- Added users-table styles (`.welcome-card`, `.users-table` thead/tbody/th/td).
- Added `.rol-badge` and `.rol-badge.admin` badge styles.
- Added `.small-btn.danger` and hover state.
- Added create-user section styles (`.create-user-section`, `.create-toggle-btn`,
  `.create-user-form`, `.create-form-grid` and child input/select styles).
- Merged responsive block to cover new elements.

## factura.service.ts
- Added `import { map } from 'rxjs/operators'`.
- Changed `getMunicipios()`, `getMeses()`, and `getEstratos()` to use `responseType: 'text'`
  and manually `JSON.parse()` the response, forcing the browser to decode the response body
  as a UTF-8 string rather than relying on Angular's JSON parser. Fixes corrupted characters
  (e.g. GENOVA showing as mojibake).

## perfil.html
- Replaced emoji pencil character `✎` (U+270E) with plain text "Editar".
