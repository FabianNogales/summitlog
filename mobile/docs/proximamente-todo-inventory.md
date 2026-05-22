# Inventario de Textos "Proximamente/TODO"

Fecha: 2026-05-22

## 1) Pendientes funcionales reales

| Archivo | Linea aprox | Texto | Pantalla/Funcion | Accion |
|---|---:|---|---|---|
| `app/(auth)/login.tsx` | 142 | `Proximamente` + recuperacion de contrasena | Login > "Olvidaste tu contrasena?" | Mantener como feature futura (HU no implementada) |
| `app/(tabs)/profile/index.tsx` | 31 | `Proximamente` en `handleComingSoon` | Perfil > Notificaciones/Privacidad/Modo Offline/Avatar | Mantener como feature futura (no hay flujo dedicado implementado para esas opciones) |
| `app/(tabs)/profile/index.tsx` | 51 | `Proximamente` en alerta de avatar | Perfil > actualizar foto | Mantener como feature futura |

## 2) Coincidencias tecnicas (no son "pendiente funcional")

Estas coincidencias provienen de:
- props de UI (`placeholder`, `placeholderTextColor`)
- nombre de variable SQL (`placeholders`)
- estados de sincronizacion reales (`pendiente` como "pending trips")

Por lo tanto **no se eliminan**.

### `placeholder`

- `app/(auth)/login.tsx`: 123, 132
- `app/(auth)/register.tsx`: 107, 115, 124, 133, 142
- `app/(tabs)/home.tsx`: 354, 355, 615, 616
- `app/journal/[tripId].tsx`: 192, 193, 222, 223
- `app/moderation/index.tsx`: 343, 344
- `app/profile/edit.tsx`: 120, 128, 179, 180
- `app/route/[id].tsx`: 571, 572, 743, 744
- `app/trip/[id].tsx`: 322, 323, 343, 344, 404, 405
- `src/components/auth/AuthInput.tsx`: 14, 25, 72, 73
- `src/components/community/ContentReportModal.tsx`: 150, 151
- `src/components/routes/RoutesFiltersPanel.tsx`: 120, 121, 149, 150
- `src/services/offlineTrip.service.ts`: 385, 394 (`placeholders` SQL)
- `src/theme/colors.ts`: 9 (`colors.placeholder`)

### `pendiente`

- `app/(tabs)/record.tsx`: 15, 52, 77, 95, 103, 167
- `src/hooks/useOfflineSync.ts`: 83

## 3) Terminos sin coincidencias

- `Proximamente` (tambien revisado con tilde)
- `Coming soon`
- `coming soon`
- `TODO`
- `FIXME`
- `en desarrollo`

## 4) Cambios aplicados en esta pasada

- Se unifico el texto de login a `Proximamente` para consistencia.
