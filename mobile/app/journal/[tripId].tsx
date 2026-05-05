import { Alert, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'

import { colors } from '../../src/theme/colors'
import { useTripJournalEditor } from '../../src/hooks/useTripJournalEditor'
import { JournalVisibilitySelector } from '../../src/components/journal/JournalVisibilitySelector'
import { AuthButton } from '../../src/components/auth/AuthButton'
import { formatTripDistance, formatTripDuration } from '../../src/utils/tripFormat'

export default function JournalEditorScreen() {
  const router = useRouter()
  const { tripId } = useLocalSearchParams<{ tripId: string }>()

  const {
    trip,
    journal,
    title,
    content,
    visibility,
    loading,
    saving,
    error,
    setTitle,
    setContent,
    setVisibility,
    saveJournal,
  } = useTripJournalEditor(tripId)

  async function handleSaveJournal() {
    try {
      await saveJournal()

      Alert.alert(
        'Éxito',
        journal ? 'La bitácora se actualizó correctamente.' : 'La bitácora se creó correctamente.'
      )

      router.back()
    } catch (err: any) {
      Alert.alert(
        'Error al guardar bitácora',
        err.message ?? 'No se pudo guardar la bitácora'
      )
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.card,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Feather name="arrow-left" size={18} color={colors.text} />
          </Pressable>

          <Text
            style={{
              color: colors.text,
              fontSize: 20,
              fontWeight: '700',
            }}
          >
            {journal ? 'Editar bitácora' : 'Crear bitácora'}
          </Text>
        </View>

        {loading ? (
          <Text style={{ color: colors.textSecondary }}>Cargando editor...</Text>
        ) : error ? (
          <Text style={{ color: colors.textSecondary }}>{error}</Text>
        ) : !trip ? (
          <Text style={{ color: colors.textSecondary }}>
            No se encontró el recorrido.
          </Text>
        ) : (
          <>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 18,
                marginBottom: 18,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: '700',
                  marginBottom: 6,
                }}
              >
                {trip.title?.trim() || 'Recorrido completado'}
              </Text>

              <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>
                {new Date(trip.started_at).toLocaleDateString()}
              </Text>

              <Text style={{ color: colors.textSecondary }}>
                Distancia: {formatTripDistance(Number(trip.distance_m ?? 0))}
              </Text>

              <Text style={{ color: colors.textSecondary }}>
                Duración: {formatTripDuration(Number(trip.duration_s ?? 0))}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 18,
              }}
            >
              <View style={{ marginBottom: 18 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 14,
                    fontWeight: '600',
                    marginBottom: 8,
                  }}
                >
                  Título
                </Text>

                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Ej: Mi experiencia en el recorrido"
                  placeholderTextColor={colors.placeholder}
                  style={{
                    backgroundColor: colors.cardSecondary,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: colors.text,
                    fontSize: 15,
                  }}
                />
              </View>

              <View style={{ marginBottom: 18 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 14,
                    fontWeight: '600',
                    marginBottom: 8,
                  }}
                >
                  Contenido
                </Text>

                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="Describe tu experiencia, observaciones, clima, dificultad, sensaciones..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  textAlignVertical="top"
                  style={{
                    minHeight: 140,
                    backgroundColor: colors.cardSecondary,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: colors.text,
                    fontSize: 15,
                  }}
                />
              </View>

              <JournalVisibilitySelector
                value={visibility}
                onChange={setVisibility}
              />

              <AuthButton
                title={journal ? 'Guardar cambios' : 'Crear bitácora'}
                onPress={handleSaveJournal}
                loading={saving}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}