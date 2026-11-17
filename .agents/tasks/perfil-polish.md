# Mi Perfil Page Polish — Change Summary

## Changes made

### perfil.html
- Replaced the "Editar" text inside `.icon-btn.edit` with an inline pencil SVG icon (no emojis).
- Added `title="Editar"` attribute on the edit button for accessibility.

### perfil.css

**Photo area**
- Reduced `.foto-perfil` size from 200×200 px to 120×120 px; kept the green border and shadow.

**Profile card**
- Added `max-width: 700px` and `margin: 0 auto` to `.perfil-card`.
- Narrowed grid column from `280px 1fr` to `220px 1fr`.
- Increased card padding from `32px` to `36px 40px`.

**Info rows**
- Changed `.info-section` gap from `4px` to `0`; rows now rely on their own padding.
- Bumped `.info-row` padding from `10px 0` to `14px 0`.
- Made divider lines subtler: `border-bottom: 1px solid rgba(255,255,255,0.09)`.

**Label style**
- Reduced label `font-size` from `0.8rem` to `0.78rem`.
- Added `letter-spacing: 0.5px` (was `0.4px`).

**Edit button (`.icon-btn.edit`)**
- Replaced generic icon-btn styling with a 30×30 pill/circle button: green-tinted border, subtle background, `color: #a8e6a5`, circular `border-radius: 50%`.
- Added hover state that deepens background and uses `var(--green)` border.

**Role badge**
- Added default (non-admin) `.rol-badge` style: subtle white-tinted background, muted text, faint border.
- Kept `.rol-badge.admin` blue style unchanged.

**Edit actions**
- Added `padding-top: 18px` and `border-top: 1px solid rgba(255,255,255,0.09)` separator above the Guardar/Cancelar buttons.
- Increased `margin-top` from `16px` to `20px`.

## Build result

```
ng build --configuration development
✓ Building...
Application bundle generation complete. [4.678 seconds]
Output location: dist/epq-app
No errors.
```
