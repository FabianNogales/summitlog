# SummitLog

SummitLog es una aplicación móvil para registrar recorridos de senderismo, crear bitácoras, publicar rutas, explorar recorridos de otros usuarios y participar en la comunidad y en salidas grupales.

## Descripción general

La aplicación combina seguimiento GPS con persistencia local y servicios en la nube. Los recorridos se registran primero en SQLite para mantener el tracking operativo sin conexión y, cuando vuelve la conectividad, se sincronizan con Supabase junto con sus puntos, bitácoras y fotografías pendientes.

El proyecto Expo se encuentra en la raíz del repositorio. Los comandos de desarrollo deben ejecutarse desde esta carpeta; no es necesario entrar en un directorio `mobile/`.

## Características principales

- Registro e inicio de sesión con correo y contraseña.
- Inicio de sesión con Google mediante Supabase Auth y deep linking.
- Perfil de usuario con avatar.
- Registro GPS de recorridos, métricas y trazado en mapa.
- Tracking offline-first y seguimiento en segundo plano.
- Sincronización de recorridos, puntos GPS, bitácoras y fotos pendientes.
- Historial y estadísticas de actividades.
- Bitácoras con título, contenido, visibilidad, dificultad, categoría y fotografías.
- Publicación de recorridos como rutas públicas independientes de la bitácora.
- Exploración y detalle de rutas con mapa, comentarios y reportes de condición.
- Comunidad con publicaciones, imágenes, comentarios y denuncias.
- Salidas grupales con participantes, imagen y chat para miembros.
- Borrado lógico de recorridos, archivando su ruta y ocultando su bitácora.

## Tecnologías utilizadas

- React Native 0.81 y React 19
- Expo SDK 54
- Expo Router
- TypeScript
- Supabase Auth, PostgreSQL y Storage
- Expo SQLite
- Mapbox mediante `@rnmapbox/maps`
- Expo Location y Expo Task Manager
- Expo Image Picker y Expo File System
- EAS Build

## Requisitos previos

- Node.js y npm.
- Una cuenta y un proyecto de Supabase.
- Un token público de Mapbox.
- Expo/EAS accesibles mediante `npx`.
- Android Studio, un emulador o un dispositivo físico para desarrollo Android.
- Un development build para probar Mapbox y tracking nativo en segundo plano.

> Expo Go no incluye todos los módulos nativos requeridos por Mapbox y el tracking en segundo plano. Para esos flujos, utiliza un development build o una compilación de EAS.

## Instalación

Desde la raíz del repositorio:

```bash
npm install
```

Crea tu archivo local de variables a partir del ejemplo:

```bash
Copy-Item .env.example .env
```

En macOS o Linux:

```bash
cp .env.example .env
```

Completa `.env` con credenciales válidas. El archivo real no debe subirse al repositorio.

## Variables de entorno

```dotenv
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=
```

- `EXPO_PUBLIC_SUPABASE_URL`: URL del proyecto de Supabase.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: clave pública `anon` de Supabase. No uses una `service_role`.
- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`: token público usado por el SDK de Mapbox.

Las variables con prefijo `EXPO_PUBLIC_` se incorporan al cliente móvil. No coloques secretos administrativos en ellas.

## Scripts principales

| Comando | Descripción |
| --- | --- |
| `npm start` | Inicia Expo. |
| `npm run android` | Genera/ejecuta el proyecto nativo Android local. |
| `npm run ios` | Genera/ejecuta el proyecto nativo iOS local. |
| `npm run web` | Inicia la versión web. |
| `npm run lint` | Ejecuta ESLint mediante Expo. |
| `npx tsc --noEmit` | Valida los tipos sin generar archivos. |

## Cómo ejecutar en desarrollo

Inicia Metro y Expo:

```bash
npx expo start
```

Si trabajas con un development build, puedes limpiar la caché del bundler:

```bash
npx expo start --dev-client --clear
```

Para los mapas, permisos nativos y ubicación en segundo plano, abre la aplicación desde un development build instalado en el dispositivo o emulador.

## Cómo generar un APK con EAS

Autentícate en EAS y ejecuta:

```bash
npx eas-cli build --platform android --profile preview --clear-cache
```

El perfil `preview` de `eas.json` debe producir un APK:

```json
{
  "android": {
    "buildType": "apk"
  }
}
```

El repositorio ya contiene esta configuración. La compilación se procesa en EAS y el resultado se descarga desde el enlace del build.

## Estructura del proyecto

```text
summitlog/
├── app/                  # Pantallas y rutas de Expo Router
├── assets/               # Imágenes y recursos estáticos
├── docs/                 # Documentación adicional del proyecto
├── scripts/              # Scripts auxiliares de Expo
├── src/
│   ├── components/       # Componentes por dominio
│   ├── context/          # Contexto de autenticación
│   ├── hooks/            # Estado y orquestación de pantallas
│   ├── lib/              # Clientes de Supabase y Mapbox
│   ├── services/         # Acceso a Supabase, SQLite y servicios del dispositivo
│   ├── tasks/            # Tarea de ubicación en segundo plano
│   ├── theme/            # Colores del proyecto
│   ├── types/            # Tipos TypeScript
│   └── utils/            # Utilidades de formato, GPS y métricas
├── app.json              # Configuración de Expo y permisos nativos
├── eas.json              # Perfiles de EAS Build
├── package.json          # Dependencias y scripts
└── .env.example          # Plantilla de variables públicas
```

## Módulos principales

- **Autenticación:** sesión persistente, correo/contraseña, Google OAuth y callback por deep link.
- **Tracking:** permisos, watcher en primer plano, tarea de segundo plano y filtrado de puntos GPS.
- **Persistencia offline:** SQLite almacena recorridos, puntos, bitácoras y medios locales.
- **Sincronización:** crea o reutiliza registros remotos y evita duplicar puntos y fotografías.
- **Bitácoras:** edición local/remota, fotos pendientes y control de visibilidad.
- **Rutas:** una ruta pública copia los puntos del recorrido y mantiene su propio estado de publicación.
- **Explorar:** listado, filtros, mapa, detalle, comentarios y reportes de condición.
- **Comunidad:** publicaciones con medios, comentarios y reportes de contenido.
- **Salidas grupales:** creación, participantes, imagen y chat restringido a miembros.
- **Moderación:** consulta y actualización de reportes de contenido.

## Supabase: tablas y buckets usados

Las siguientes referencias se identifican en los servicios actuales. Este repositorio no incluye el esquema SQL ni las policies, por lo que su configuración debe verificarse en el proyecto de Supabase.

### Tablas principales

| Tabla | Uso |
| --- | --- |
| `profiles` | Perfil, nombre y avatar del usuario. |
| `recorded_trips` | Recorridos GPS y métricas agregadas. |
| `recorded_trip_points` | Puntos ordenados de cada recorrido. |
| `journals` | Bitácoras asociadas a recorridos. |
| `journal_media` | Metadatos y orden de fotos de bitácora. |
| `routes` | Rutas publicables derivadas de recorridos. |
| `route_points` | Puntos GPS copiados a una ruta pública. |
| `route_reports` | Reportes de condición de una ruta. |
| `posts` | Publicaciones de la comunidad. |
| `post_media` | Imágenes asociadas a publicaciones. |
| `comments` | Comentarios usados por publicaciones y rutas. |
| `content_reports` | Denuncias y flujo de moderación. |
| `group_outings` | Salidas grupales programadas. |
| `group_outing_participants` | Participantes de una salida. |
| `group_outing_media` | Medios asociados a una salida. |
| `group_outing_messages` | Mensajes del chat de una salida. |

### Buckets de Storage

- `avatars`
- `journal-media`
- `post-media`
- `route-report-media`
- `outings_images`

## Notas sobre el modo offline

- El recorrido activo y sus puntos se guardan primero en `summitlog-offline.db`.
- SQLite mantiene tablas locales para recorridos, puntos, bitácoras y fotos.
- Al recuperar conexión, la aplicación sincroniza recorridos antes que bitácoras y medios, porque estos necesitan el ID remoto del recorrido.
- Los estados `pending`, `syncing`, `failed` y `synced` permiten reintentar sin perder el contenido local.
- La sincronización compara `point_order`, IDs remotos y rutas estables de Storage para reducir duplicados.
- Las fotos añadidas o eliminadas en una bitácora permanecen como cambios pendientes hasta guardar el formulario.

## Notas sobre tracking GPS en segundo plano

- La aplicación solicita permisos de ubicación en primer plano y en segundo plano.
- La tarea `summitlog-background-location-task` persiste puntos en SQLite mientras existe un recorrido activo.
- Android utiliza un foreground service con notificación mientras el tracking está activo.
- Los puntos pasan por filtros de precisión, distancia y tiempo antes de persistirse.
- El estado del recorrido activo se conserva para intentar restaurar el tracking tras volver a abrir la aplicación.
- El comportamiento depende de los permisos del sistema, ahorro de batería y restricciones del fabricante.

Prueba siempre el tracking en un dispositivo físico y con un development build. Verifica recorridos con la pantalla encendida, bloqueada y después de enviar la app a segundo plano.

## Consideraciones para Google OAuth

- El scheme configurado en `app.json` es `summitlog`.
- El callback móvil usado por la aplicación es `summitlog://auth/callback`.
- Esa URL debe estar permitida en la configuración de redirects de Supabase Auth.
- Google debe estar habilitado como proveedor en Supabase con sus credenciales OAuth.
- Si cambia el scheme de Expo, también debe actualizarse el redirect de la aplicación y la configuración de Supabase.
- No registres tokens, códigos OAuth ni URLs de callback sin sanitizarlos.

## Solución de problemas frecuentes

### El mapa no aparece

Comprueba `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`, reinicia Metro después de cambiar `.env` y utiliza un build que incluya `@rnmapbox/maps`.

### La aplicación no conecta con Supabase

Verifica `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Confirma también que las tablas, buckets y policies requeridos existan en el proyecto remoto.

### Google OAuth no vuelve a la aplicación

Confirma que `summitlog://auth/callback` esté permitido en Supabase y que el build instalado use el scheme `summitlog`.

### El recorrido no continúa con la pantalla bloqueada

Revisa el permiso de ubicación "siempre", la notificación del foreground service, el ahorro de batería y que estés usando un development build o APK.

### Hay elementos pendientes de sincronizar

Comprueba la conexión, vuelve a abrir la app o usa la acción de sincronización disponible. Los elementos fallidos permanecen en SQLite para reintentos posteriores.

### Una imagen no se carga

Verifica permisos de galería, formato JPG/PNG, tamaño del archivo, existencia del bucket correspondiente y policies de Storage.

## Estado del proyecto

Proyecto móvil en desarrollo activo. Las funcionalidades descritas reflejan el código presente en el repositorio; la disponibilidad final depende de la configuración externa de Supabase, Mapbox, Google OAuth y EAS.

## Licencia

No especificada.
