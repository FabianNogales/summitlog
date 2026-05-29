import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Modal,
  FlatList,
  Image, 
  Alert,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../theme/colors'

interface CreateOutingComposerProps {
  submitting: boolean
  submitError: string | null
  onSubmit: (data: {
    title: string
    description: string
    destination: string
    meetingPoint: string
    dateTime: Date
    maxParticipants: number
    imageUri: string | null // <-- Nuevo campo
  }) => void
  onCancel: () => void
}

export function CreateOutingComposer({
  submitting,
  submitError,
  onSubmit,
  onCancel,
}: CreateOutingComposerProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [destination, setDestination] = useState('')
  const [meetingPoint, setMeetingPoint] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('10')
  
  // 🔴 ESTADO LOCAL: Guarda la ruta de la foto seleccionada
  const [imageUri, setImageUri] = useState<string | null>(null)

  // Lógica del Calendario Táctil (100% compatible con Expo Go)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [showTimeModal, setShowTimeModal] = useState(false)

  // Generar días para el selector visual rápido (Próximos 30 días)
  const daysArray = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })

  // Generar horas rápidas (intervalos de 30 minutos)
  const hoursArray = Array.from({ length: 24 * 2 }, (_, i) => {
    const h = Math.floor(i / 2)
    const m = i % 2 === 0 ? '00' : '30'
    return `${String(h).padStart(2, '0')}:${m}`
  })

  const isFormInvalid =
    title.trim().length < 5 ||
    destination.trim().length < 3 ||
    meetingPoint.trim().length < 3 ||
    isNaN(parseInt(maxParticipants, 10)) ||
    parseInt(maxParticipants, 10) <= 1


    async function handlePickImage() {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        
        if (status !== 'granted') {
          Alert.alert('Permiso Requerido', 'Necesitamos accesos a tu galería para añadir una portada.')
          return
        }
    
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'], // ✨ CORREGIDO: Sintaxis moderna que elimina el Warning de Expo
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.7,
        })
    
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setImageUri(result.assets[0].uri)
        }
      }

  function handleFormSubmit() {
    if (isFormInvalid) return
  
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      destination: destination.trim(),
      meetingPoint: meetingPoint.trim(),
      dateTime: selectedDate,
      maxParticipants: parseInt(maxParticipants, 10),
      imageUri: imageUri, // 🔴 Pasamos la foto directo al manejador superior
    })
  }

  const handleSelectDay = (day: Date) => {
    const newDate = new Date(selectedDate)
    newDate.setFullYear(day.getFullYear())
    newDate.setMonth(day.getMonth())
    newDate.setDate(day.getDate())
    setSelectedDate(newDate)
    setShowCalendarModal(false)
  }

  const handleSelectTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number)
    const newDate = new Date(selectedDate)
    newDate.setHours(hours)
    newDate.setMinutes(minutes)
    newDate.setSeconds(0)
    setSelectedDate(newDate)
    setShowTimeModal(false)
  }

  return (
    <View style={{ paddingVertical: 8 }}>
      {/* Encabezado del Formulario */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>
          Crear salida grupal
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>
          Organiza una ruta, define los cupos e invita a la comunidad a unirse.
        </Text>
      </View>

      {/* Input: Título */}
      <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>Título del evento *</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Ej. Ascensión invernal a Peñalara"
        placeholderTextColor={colors.textSecondary + '80'}
        style={{
          backgroundColor: colors.cardSecondary || '#1A1A1A',
          color: colors.text,
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border || '#333',
          marginBottom: 16,
        }}
      />

      {/* Input: Destino */}
      <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>Destino *</Text>
      <TextInput
        value={destination}
        onChangeText={setDestination}
        placeholder="Ej. Parque Natural Gredos"
        placeholderTextColor={colors.textSecondary + '80'}
        style={{
          backgroundColor: colors.cardSecondary || '#1A1A1A',
          color: colors.text,
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border || '#333',
          marginBottom: 16,
        }}
      />

      {/* Input: Punto de encuentro */}
      <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>Punto de encuentro / Reunión *</Text>
      <TextInput
        value={meetingPoint}
        onChangeText={setMeetingPoint}
        placeholder="Ej. Parking de la plataforma principal"
        placeholderTextColor={colors.textSecondary + '80'}
        style={{
          backgroundColor: colors.cardSecondary || '#1A1A1A',
          color: colors.text,
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border || '#333',
          marginBottom: 16,
        }}
      />

      {/* Selectores de Fecha y Hora Táctiles */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>Fecha *</Text>
          <Pressable
            onPress={() => setShowCalendarModal(true)}
            style={{
              backgroundColor: colors.cardSecondary || '#1A1A1A',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.border || '#333',
              justifyContent: 'center',
              height: 50,
            }}
          >
            <Text style={{ color: colors.text }}>
              {selectedDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
            </Text>
          </Pressable>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>Hora *</Text>
          <Pressable
            onPress={() => setShowTimeModal(true)}
            style={{
              backgroundColor: colors.cardSecondary || '#1A1A1A',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.border || '#333',
              justifyContent: 'center',
              height: 50,
            }}
          >
            <Text style={{ color: colors.text }}>
              {selectedDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* MODAL CALENDARIO */}
      <Modal visible={showCalendarModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#121212', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '50%' }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 15, textAlign: 'center' }}>Selecciona una Fecha</Text>
            <FlatList
              data={daysArray}
              keyExtractor={(item) => item.toISOString()}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelectDay(item)}
                  style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#222', alignItems: 'center' }}
                >
                  <Text style={{ color: item.toDateString() === selectedDate.toDateString() ? (colors.primary || '#00FF66') : colors.text, fontSize: 16 }}>
                    {item.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                </Pressable>
              )}
            />
            <Pressable onPress={() => setShowCalendarModal(false)} style={{ marginTop: 15, padding: 14, backgroundColor: '#222', borderRadius: 12, alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL SELECTOR DE HORA */}
      <Modal visible={showTimeModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#121212', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '50%' }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 15, textAlign: 'center' }}>Selecciona una Hora</Text>
            <FlatList
              data={hoursArray}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelectTime(item)}
                  style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#222', alignItems: 'center' }}
                >
                  <Text style={{ color: colors.text, fontSize: 16 }}>{item} hrs</Text>
                </Pressable>
              )}
            />
            <Pressable onPress={() => setShowTimeModal(false)} style={{ marginTop: 15, padding: 14, backgroundColor: '#222', borderRadius: 12, alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Input: Plazas Máximas */}
      <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>Número máximo de plazas *</Text>
      <TextInput
        value={maxParticipants}
        onChangeText={setMaxParticipants}
        keyboardType="number-pad"
        placeholder="Ej. 12"
        placeholderTextColor={colors.textSecondary + '80'}
        style={{
          backgroundColor: colors.cardSecondary || '#1A1A1A',
          color: colors.text,
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border || '#333',
          marginBottom: 16,
        }}
      />

      {/* Input: Descripción */}
      <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>Descripción / Notas adicionales</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Llevar calzado de montaña, agua..."
        placeholderTextColor={colors.textSecondary + '80'}
        multiline
        numberOfLines={3}
        style={{
          backgroundColor: colors.cardSecondary || '#1A1A1A',
          color: colors.text,
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border || '#333',
          textAlignVertical: 'top',
          minHeight: 80,
          marginBottom: 16, // Modificado de 10 a 16 para espaciado equilibrado
         }}
      />

      {/* 🔴 NUEVA SECCIÓN VISUAL: Subir foto de portada */}
      <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>Foto de portada (Opcional)</Text>
      <Pressable
        onPress={handlePickImage}
        style={{
          width: '100%',
          height: 150,
          backgroundColor: colors.cardSecondary || '#1A1A1A',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border || '#333',
          borderStyle: imageUri ? 'solid' : 'dashed',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          marginBottom: 20,
        }}
      >
        {imageUri ? (
          <View style={{ width: '100%', height: '100%' }}>
            <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
            <View style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              backgroundColor: 'rgba(0,0,0,0.75)',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4
            }}>
              <Ionicons name="camera" size={14} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>Cambiar</Text>
            </View>
          </View>
        ) : (
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Ionicons name="image-outline" size={28} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              Presiona para añadir una imagen
            </Text>
          </View>
        )}
      </Pressable>

      {submitError && (
        <Text style={{ color: colors.danger || '#FF3B30', marginBottom: 14, fontSize: 13 }}>
          ⚠️ {submitError}
        </Text>
      )}

      {/* Botones de acción */}
      <Pressable
        onPress={handleFormSubmit}
        disabled={submitting || isFormInvalid}
        style={({ pressed }) => ({
          backgroundColor: isFormInvalid ? (colors.border || '#333') : (colors.primary || '#00FF66'),
          paddingVertical: 14,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        {submitting ? (
          <ActivityIndicator color={colors.background || '#000'} />
        ) : (
          <Text style={{ color: isFormInvalid ? colors.textSecondary : (colors.background || '#000'), fontWeight: '700', fontSize: 16 }}>
            Publicar Salida
          </Text>
        )}
      </Pressable>

     <Pressable
        onPress={onCancel} 
        disabled={submitting}
        style={({ pressed }) => ({
          paddingVertical: 14,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border || '#333',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>
          Cancelar
        </Text>
      </Pressable>
    </View>
  )
}