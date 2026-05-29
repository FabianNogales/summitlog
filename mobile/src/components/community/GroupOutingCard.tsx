import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, Image, ActivityIndicator, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../theme/colors'
import { GroupOuting } from '../../types/groupOuting'
import { groupOutingService } from '../../services/groupOuting.service'

interface GroupOutingCardProps {
  outing: GroupOuting
  onRefresh: () => void
}

export function GroupOutingCard({ outing, onRefresh }: GroupOutingCardProps) {
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // ESTADOS LOCALES: Control de UI reactiva inmediata
  const [isJoinedLocal, setIsJoinedLocal] = useState(!!outing.is_user_joined)
  const [participantCountLocal, setParticipantCountLocal] = useState(outing.participant_count || 1)
  const [isVisibleLocal, setIsVisibleLocal] = useState(true)

  // Sincronizar los estados si las propiedades cambian desde el componente padre
  useEffect(() => {
    setIsJoinedLocal(!!outing.is_user_joined)
    setParticipantCountLocal(outing.participant_count || 1)
  }, [outing.is_user_joined, outing.participant_count])

  // Obtener el ID del usuario logueado actualmente
  useEffect(() => {
    async function getSessionUser() {
      try {
        const userId = await groupOutingService.getCurrentUserId()
        setCurrentUserId(userId)
      } catch (e) {
        console.log("Error al recuperar el ID de usuario:", e)
      }
    }
    getSessionUser()
  }, [])

  // Si el usuario borró la card, no renderizamos absolutamente nada
  if (!isVisibleLocal) return null

  // Formatear Fecha amigable
  const dateObj = new Date(outing.date_time)
  const formattedDate = dateObj.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
  const formattedTime = dateObj.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Cálculos dinámicos
  const maxPlazas = outing.max_participants || 2
  const spacesLeft = maxPlazas - participantCountLocal
  const isFull = spacesLeft <= 0
  const progressPercentage = Math.min((participantCountLocal / maxPlazas) * 100, 100)

  // Identificar si el usuario actual es el dueño/organizador del evento
  const isCreator = currentUserId === outing.user_id

  // EXTRAER LA IMAGEN DESDE LA NUEVA TABLA RELACIONAL
  // Si group_outing_media tiene registros, tomamos el file_path del primero (index 0)
  const uploadedImage = outing.group_outing_media && outing.group_outing_media.length > 0
    ? outing.group_outing_media[0].file_path
    : null

  async function handleToggleJoin() {
    const previousJoined = isJoinedLocal
    const previousCount = participantCountLocal

    try {
      setLoading(true)

      // Actualización visual optimista para inscripción
      const newJoinedStatus = !isJoinedLocal
      setIsJoinedLocal(newJoinedStatus)
      setParticipantCountLocal(prev => newJoinedStatus ? prev + 1 : Math.max(1, prev - 1))

      const joined = await groupOutingService.toggleJoinGroupOuting(outing.id, previousJoined)

      Alert.alert(
        joined ? '¡Inscripción completada!' : 'Salida cancelada',
        joined 
          ? `Te has unido con éxito a "${outing.title}".` 
          : `Te has retirado de "${outing.title}".`
      )
      onRefresh()
    } catch (error: any) {
      setIsJoinedLocal(previousJoined)
      setParticipantCountLocal(previousCount)
      Alert.alert('Error', error?.message || 'No se pudo procesar la solicitud.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteOuting() {
    Alert.alert(
      'Eliminar Salida',
      '¿Estás seguro de que deseas cancelar de forma permanente esta salida grupal?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true)
              
              // 1. Enviamos la petición a Supabase
              await groupOutingService.deleteGroupOuting(outing.id)
              
              // 2. Desvanecemos la Card localmente de inmediato
              setIsVisibleLocal(false)

              Alert.alert('Éxito', 'La salida ha sido eliminada correctamente.')
              
              // 3. Refrescamos la lista del padre en segundo plano
              onRefresh()
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo eliminar el evento.')
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  return (
    <View
      style={{
        backgroundColor: colors.bgCard || '#121212',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.borderSoft || '#222',
        marginBottom: 16,
        overflow: 'hidden',
      }}
    >
      {/* Contenedor Imagen Superior */}
      <View style={{ height: 160, width: '100%', backgroundColor: colors.bgElevated || '#1A1A1A', position: 'relative' }}>
        <Image
          source={{ uri: uploadedImage || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop' }} 
          style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
        />
        
        {/* Badge Destino */}
        <View
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            backgroundColor: 'rgba(0,0,0,0.6)',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.borderSoft || '#333',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Ionicons name="location" size={12} color={colors.primary || '#00FF66'} />
          <Text style={{ color: colors.textPrimary || '#FFF', fontSize: 12, fontWeight: '700' }}>
            {outing.destination}
          </Text>
        </View>

        {/* Badge Plazas Restantes */}
        <View
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: 'rgba(255, 59, 48, 0.15)',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#FF3B30',
          }}
        >
          <Text style={{ color: '#FF3B30', fontSize: 12, fontWeight: '700' }}>
            {isFull ? '¡Completo!' : `¡Solo ${spacesLeft} plazas!`}
          </Text>
        </View>
      </View>

      {/* Cuerpo de la Tarjeta */}
      <View style={{ padding: 16 }}>
        <Text style={{ color: colors.textPrimary || '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 4 }}>
          {outing.title}
        </Text>
        
        <Text style={{ color: colors.textMuted || '#AAA', fontSize: 14, marginBottom: 12 }} numberOfLines={2}>
          {outing.description || 'Sin descripción adicional para esta aventura.'}
        </Text>

        {/* Barra de Progreso Dinámica */}
        <View style={{ height: 6, backgroundColor: (colors.borderSoft || '#333') + '80', borderRadius: 3, marginVertical: 8, overflow: 'hidden' }}>
          <View style={{ width: `${progressPercentage}%`, height: '100%', backgroundColor: colors.primary || '#00FF66' }} />
        </View>

        {/* Detalles Metadatos */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, marginTop: 4 }}>
          <Ionicons name="time" size={15} color={colors.textSecondary || '#888'} />
          <Text style={{ color: colors.textSecondary || '#888', fontSize: 14 }}>
            {formattedDate} · {formattedTime}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <Ionicons name="people" size={15} color={colors.textSecondary || '#888'} />
          <Text style={{ color: colors.textSecondary || '#888', fontSize: 14 }}>
            {participantCountLocal} / {maxPlazas} inscritos
          </Text>
        </View>

        {/* Footer: Organizador y Botones */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.borderSoft || '#222', paddingTop: 12, marginTop: 4 }}>
          <View>
            <Text style={{ color: colors.textMuted || '#666', fontSize: 11 }}>Organiza</Text>
            <Text style={{ color: colors.textPrimary || '#FFF', fontSize: 14, fontWeight: '500' }}>
              @{outing.profiles?.username || 'senderista'}
            </Text>
          </View>

          {isCreator ? (
            <Pressable
              onPress={handleDeleteOuting}
              disabled={loading}
              style={({ pressed }) => ({
                backgroundColor: 'rgba(255, 59, 48, 0.1)',
                borderWidth: 1,
                borderColor: '#FF3B30',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 10,
                opacity: pressed ? 0.8 : 1,
                minWidth: 100,
                alignItems: 'center',
              })}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FF3B30" />
              ) : (
                <Text style={{ color: '#FF3B30', fontWeight: '700', fontSize: 14 }}>
                  Borrar
                </Text>
              )}
            </Pressable>
          ) : (
            <Pressable
              onPress={handleToggleJoin}
              disabled={loading || (isFull && !isJoinedLocal)}
              style={({ pressed }) => ({
                backgroundColor: isJoinedLocal 
                  ? 'transparent' 
                  : (isFull ? colors.bgElevated || '#222' : colors.primary || '#00FF66'),
                borderWidth: isJoinedLocal ? 1 : 0,
                borderColor: colors.primary || '#00FF66',
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 10,
                opacity: pressed ? 0.8 : 1,
                minWidth: 100,
                alignItems: 'center',
              })}
            >
              {loading ? (
                <ActivityIndicator size="small" color={isJoinedLocal ? (colors.primary || '#00FF66') : (colors.bgMain || '#000')} />
              ) : (
                <Text
                  style={{
                    color: isJoinedLocal ? (colors.primary || '#00FF66') : (colors.bgMain || '#000'),
                    fontWeight: '700',
                    fontSize: 14,
                  }}
                >
                  {isJoinedLocal ? 'Salir' : 'Unirse'}
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </View>
  )
}