# Admin Dashboard Layout Fix

## Files Changed

| File | Change |
|------|--------|
| `src/app/features/dashboard/admin/admin.ts` | Full rewrite — merged Upload, Informes, and Users logic into AdminComponent |
| `src/app/features/dashboard/admin/admin.html` | Full rewrite — four tabs rendered with `*ngIf="activeTab === '...'"` |
| `src/app/app.routes.ts` | Removed the `/informes` lazy-loaded route |
| `src/app/features/excel/upload/upload.ts` | Removed emoji from console.log |
| `src/app/features/excel/upload/upload.html` | Removed emoji characters; replaced icon buttons with text |
| `src/app/features/informes/informes.html` | Removed emoji from alert divs |
| `src/app/features/auth/login/login.html` | Replaced eye-icon emoji button text with "Ver" |

## Tab Unification Approach

Previously, each of the four admin views was a separate Angular route and component:
- `/excel` → `UploadComponent`
- `/dashboard-admin` → `AdminComponent` (Generar Reporte only)
- `/informes` → `InformesComponent`
- `/dashboard-user` → `UserComponent`

Switching tabs triggered `Router.navigate()`, which replaced the entire component tree and caused the tab bar to disappear or change.

The fix consolidates everything into `AdminComponent`:

1. Added `activeTab: string = 'reporte'` and `setTab(tab: string)` to control which panel is visible.
2. Each tab's `<main>` block is wrapped in `*ngIf="activeTab === '<tab-name>'"` so only one renders at a time.
3. The `<nav class="tabs">` uses `[class.active]="activeTab === '...'"` for the active indicator and `(click)="setTab('...')"` for switching — no routing involved.
4. All logic from `UploadComponent`, `InformesComponent`, and `UserComponent` was merged into `AdminComponent` with renamed properties where needed to avoid clashes:
   - `tipoFuente_upload` (was `tipoFuente` in UploadComponent)
   - `archivosSeleccionados_informes` (was `archivosSeleccionados` in InformesComponent)
   - `eliminarArchivoExcel()` (was `eliminarArchivo()` in UploadComponent)
   - Informes filter state prefixed with `informes_` (municipios, estratos, fechas, loading, error, success)
   - Users state prefixed with `usuarios_` (loading, error)
5. `InformeService` was added to the constructor alongside the existing services.
6. `ngOnInit` calls `cargarDatosIniciales()`, `cargarFotoUsuario()`, and `cargarUsuarios()`.
7. Navigation methods `goToExcel()`, `goToGenerador()`, `goToUsuarios()`, `goToInformes()` were removed. Only `goToPerfil()` and `logout()` remain since they navigate to real routes.
8. The `/informes` route was removed from `app.routes.ts`; the other routes (`/excel`, `/dashboard-user`) remain so deep links and existing bookmarks still work.

## Emoji Removal

All emoji characters (`📎`, `👁`, `🗑️`, `⚠`, `✔`, `⚙`, `📋`) were removed from every `.html` and `.ts` file under `src/app`. Icon-only buttons were replaced with plain text ("Ver", "Eliminar", "Ver").

## Build Result

```
ng build --configuration development
Application bundle generation complete. [4.461 seconds]
Output location: dist/epq-app
```

No TypeScript or template errors.

## Commit SHA

`dfebe38`
