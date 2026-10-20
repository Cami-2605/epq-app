# Implementation Plan — Sincronización Frontend ↔ Backend

## Resumen de hallazgos

Tras leer todos los archivos indicados y los componentes que los consumen, el estado actual es:

| Archivo | Estado real encontrado |
|---|---|
| `usuario.ts` | **Ya está correcto.** `correo`, `rol: string`, sin `activo`. El campo `fotoPerfil` es `string` (no opcional), lo que causa riesgo cuando el backend devuelve `null`. |
| `auth.service.ts` | **Ya está correcto.** El método `login()` usa `switchMap` para llamar a `/usuarios/perfil` y leer `perfil.rol`. No hay lógica hardcodeada. `isAuthenticated()` usa `getToken()`. |
| `auth-guard.ts` | **Ya está correcto.** Usa `AuthService.isAuthenticated()` directamente. |
| `factura.service.ts` | **Ya está completo.** `getArchivosExcel(tipo?)` envía query param; `eliminarArchivoExcel(nombre, tipoFuente?)` envía query param. No hay alias `getTotalesEstrato`/`getTotalesMunicipio` usados en ningún componente. |
| `filtro-reporte.ts` | **Completo.** `agruparPorEstrato` y `ambosFormatos` presentes. |
| `reporte.service.ts` | **Nadie lo importa.** Ningún componente lo usa (todos llaman directamente a `FacturaService`). Puede eliminarse sin romper nada. |
| `usuario.service.ts` | **Sin duplicado real.** Hace `import { Usuario } from '../models/usuario'` y re-exporta con `export type { Usuario }`. No hay doble definición. |

---

## Cambios reales a realizar

### 1 — `usuario.ts`: hacer `fotoPerfil` opcional

**Por qué:** El campo `fotoPerfil` está declarado como `string` (no opcional). Si el backend devuelve `null` o no incluye el campo, TypeScript solo lo detecta en tiempo de compilación si el strict mode está activo, pero en runtime todos los componentes hacen `user.fotoPerfil` directamente sin guard. La interfaz especificada en los requisitos lo marca como `fotoPerfil?`. Además, el `PerfilComponent` inicializa el objeto con `fotoPerfil: ''` y asigna `this.usuario.fotoPerfil = fotoUrl` sin problema, por lo que el cambio a opcional es retrocompatible.

- **Cambio:** `fotoPerfil: string` → `fotoPerfil?: string`
- **Impacto en componentes:**
  - `admin.ts`, `user.ts`, `upload.ts`: leen `user.fotoPerfil` y lo asignan a un `string` local. Con el campo opcional, TypeScript exigirá `user.fotoPerfil ?? ''` o similar.
  - `perfil.ts`: inicializa con `fotoPerfil: ''` — sigue siendo válido con campo opcional.

**Archivos a modificar:**
- `src/app/core/models/usuario.ts` — cambiar `fotoPerfil: string` por `fotoPerfil?: string`
- `src/app/features/dashboard/admin/admin.ts` — línea `next: (user) => this.usuarioFoto = user.fotoPerfil` → `this.usuarioFoto = user.fotoPerfil ?? ''`
- `src/app/features/dashboard/user/user.ts` — misma corrección en `cargarFotoUsuario`
- `src/app/features/excel/upload/upload.ts` — misma corrección en `cargarFotoUsuario`

**Verificación:** `ng build` (sin errores de compilación TypeScript)

---

### 2 — `user.ts` (UserComponent): usar `AuthService.logout()` en lugar de `localStorage.removeItem('role')` directo

**Por qué:** El método `logout()` de `UserComponent` hace `localStorage.removeItem('role')` directamente sin llamar a `this.authService.logout()`. Esto deja el token y la clave `user` en localStorage al cerrar sesión desde esa pantalla, dejando al usuario técnicamente autenticado para el guard. `AuthService` ya está inyectado en el componente.

**Archivos a modificar:**
- `src/app/features/dashboard/user/user.ts` — reemplazar el cuerpo del método `logout()`:
  ```ts
  // ANTES
  logout() {
    localStorage.removeItem('role');
    this.router.navigate(['/']);
  }
  // DESPUÉS
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
  ```

**Verificación:** `ng build` sin errores; comportamiento: al hacer logout desde UserComponent el token se elimina del localStorage.

---

### 3 — `reporte.service.ts`: eliminar el archivo

**Por qué:** Ningún componente importa `ReporteService`. Todos los componentes (`admin.ts`, `upload.ts`) llaman directamente a `FacturaService`, que ya expone `generarReporte()` y `generarReporteAmbos()` hacia los mismos endpoints (`/facturas/reporte` y `/facturas/reporte-ambos`). Mantener `ReporteService` es código muerto que confunde al equipo.

**Archivo a eliminar:**
- `src/app/core/services/reporte.service.ts`

**Verificación:** `ng build` sin errores (confirma que ningún módulo lo importa).

---

### 4 — `admin.spec.ts`: alinear con la interfaz `FiltroReporte` actual

**Por qué:** El archivo `admin.spec.ts` contiene una copia desactualizada del componente `AdminComponent` que construye un objeto `FiltroReporte` sin los campos nuevos obligatorios: `estratos`, `mesesReferencia`, `nombreArchivos`, `agruparPorEstrato`, `ambosFormatos`, `mostrarDetallePorVivienda`, `mostrarTotalesPorEstrato`, `mostrarTotalesPorMunicipio`. Esto causará errores de compilación TypeScript si se ejecutan los tests o se hace build en modo strict.

**Archivo a modificar:**
- `src/app/features/dashboard/admin/admin.spec.ts`

**Cambio:** en la construcción del objeto `filtros: FiltroReporte` dentro de `generarReporte()`, añadir los campos faltantes con sus valores por defecto:
```ts
estratos: null,
mesesReferencia: null,
nombreArchivos: null,
agruparPorEstrato: false,
ambosFormatos: false,
mostrarDetallePorVivienda: false,
mostrarTotalesPorEstrato: false,
mostrarTotalesPorMunicipio: false,
```

**Verificación:** `ng build` sin errores de tipo.

---

## Lo que NO hay que cambiar (ya está correcto)

Estos ítems de los requisitos ya están implementados correctamente en el código actual:

| Ítem de requisito | Razón por la que no hay cambio |
|---|---|
| `usuario.ts` — `correo`, `rol: string`, sin `activo` | La interfaz ya tiene exactamente esa forma |
| `auth.service.ts` — rol desde perfil, no hardcodeado | El `switchMap` a `/usuarios/perfil` ya existe con `perfil?.rol \|\| 'user'` |
| `auth.service.ts` — `isAuthenticated()` usa `getToken()` | Ya lo hace: `return !!this.getToken()` |
| `auth-guard.ts` — usa `AuthService.isAuthenticated()` | Ya está así; no usa `localStorage` directamente |
| `factura.service.ts` — `getArchivosExcel(tipo?)` con query param | Ya implementado con `HttpParams` |
| `factura.service.ts` — `eliminarArchivoExcel(nombre, tipoFuente?)` con query param | Ya implementado con `HttpParams` |
| `factura.service.ts` — alias `getTotalesEstrato`/`getTotalesMunicipio` | Ningún componente usa esos nombres; no hay componente que los llame |
| `filtro-reporte.ts` — `agruparPorEstrato` y `ambosFormatos` | Ya presentes |
| `usuario.service.ts` — sin duplicado de interfaz | El servicio importa y re-exporta desde `usuario.ts`, no define su propia interfaz |

---

## Orden de ejecución

```
1. usuario.ts           → fotoPerfil opcional
2. admin.ts             → fotoPerfil ?? ''
3. user.ts              → fotoPerfil ?? '' + logout correcto
4. upload.ts            → fotoPerfil ?? ''
5. admin.spec.ts        → campos FiltroReporte faltantes
6. reporte.service.ts   → eliminar
```

Los ítems 2–4 dependen del 1 (si el tipo cambia a opcional, el compilador exige el fallback). Los ítems 5 y 6 son independientes entre sí y del resto.

**Comando de verificación final:** `ng build` desde `c:\Users\Cami\Documents\GitHub\epq-app` — debe compilar sin errores ni warnings de tipo.
