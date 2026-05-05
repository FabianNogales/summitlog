import Mapbox from '@rnmapbox/maps'

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN

if (!mapboxToken) {
  console.warn('Falta EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN en el archivo .env')
} else {
  Mapbox.setAccessToken(mapboxToken)
}

export { Mapbox }