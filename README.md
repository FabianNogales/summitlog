# SummitLog

Aplicación móvil para Android orientada a senderismo y trekking, desarrollada como proyecto universitario por un equipo de 5 personas.

## Estructura del proyecto

```bash
summitlog/
├── mobile/
└── supabase/

¿Por qué se trabajará así?

Se decidió organizar el proyecto en dos partes principales:

mobile/

Aquí vive toda la aplicación móvil desarrollada con React Native + Expo + TypeScript.

Esta carpeta contiene:

pantallas
componentes
navegación
lógica de la app
consumo de datos
configuración del cliente móvil
supabase/

Aquí vive la parte relacionada con backend y base de datos usando Supabase.

Esta carpeta se utilizará para guardar:

configuración local de Supabase
migraciones SQL
políticas de seguridad
funciones
seeds o datos iniciales si se necesitan

¿Por qué usar esta estructura?

La estructura:

summitlog/
├── mobile/
└── supabase/

permite separar claramente las responsabilidades del proyecto:

mobile/ = lo que ve y usa el usuario
supabase/ = datos, autenticación y lógica del servidor

Esto mejora:

el orden del repositorio
la escalabilidad
la colaboración entre integrantes
el mantenimiento del proyecto

Además, evita mezclar archivos de la app con archivos de base de datos o configuración del backend.

Tecnologías principales
Móvil
React Native
Expo
TypeScript
Backend y base de datos
Supabase
PostgreSQL
Otras herramientas previstas
Expo Router
react-native-maps
expo-location
TanStack Query
GitHub
