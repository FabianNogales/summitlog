import Mapbox from '@rnmapbox/maps'

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
export const isMapboxTokenConfigured = Boolean(mapboxToken)
export const mapboxTokenErrorMessage =
  'No se pudo cargar el mapa porque falta EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN en la configuración.'

if (!isMapboxTokenConfigured) {
  console.warn('Falta EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN en el archivo .env')
} else {
  Mapbox.setAccessToken(mapboxToken ?? null)
}

export { Mapbox }
