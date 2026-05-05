import { ActivityIndicator, Text, View } from "react-native";
import { Mapbox } from "../../lib/mapbox";
import { colors } from "../../theme/colors";
import type { RouteItem } from "../../types/route";

interface RoutesMapProps {
  routes: RouteItem[];
  loading: boolean;
  error: string | null;
  onPressRoute: (route: RouteItem) => void;
}

const COCHABAMBA_CENTER: [number, number] = [-66.1568, -17.3895];

export function RoutesMap({
  routes,
  loading,
  error,
  onPressRoute,
}: RoutesMapProps) {
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
          padding: 20,
        }}
      >
        <Text style={{ color: colors.text, textAlign: "center" }}>{error}</Text>
      </View>
    );
  }

  if (routes.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
          padding: 20,
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: "700",
            marginBottom: 8,
          }}
        >
          No hay rutas publicadas
        </Text>

        <Text
          style={{
            color: colors.textSecondary,
            textAlign: "center",
          }}
        >
          Cuando existan rutas públicas, aparecerán aquí en el mapa.
        </Text>
      </View>
    );
  }
  const validRoutes = routes.filter(
    (route) => route.start_lat != null && route.start_lng != null,
  );

  const initialCenter: [number, number] =
    validRoutes.length > 0
      ? [Number(validRoutes[0].start_lng), Number(validRoutes[0].start_lat)]
      : COCHABAMBA_CENTER;

  return (
    <Mapbox.MapView
      style={{ flex: 1 }}
      styleURL={Mapbox.StyleURL.Street}
      logoEnabled
      compassEnabled
      attributionEnabled
    >
      <Mapbox.Camera
        defaultSettings={{
          centerCoordinate: initialCenter,
          zoomLevel: validRoutes.length > 0 ? 13 : 11,
        }}
      />

      {routes
        .filter((route) => route.start_lat != null && route.start_lng != null)
        .map((route) => (
          <Mapbox.PointAnnotation
            key={route.id}
            id={route.id}
            coordinate={[Number(route.start_lng), Number(route.start_lat)]}
            title={route.title}
            onSelected={() => onPressRoute(route)}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: colors.primary,
                borderWidth: 2,
                borderColor: colors.text,
              }}
            />
          </Mapbox.PointAnnotation>
        ))}
    </Mapbox.MapView>
  );
}
