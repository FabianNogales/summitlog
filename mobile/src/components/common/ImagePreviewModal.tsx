import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors } from '../../theme/colors'

interface ImagePreviewModalProps {
  visible: boolean
  imageUrl: string | null
  onClose: () => void
}

export function ImagePreviewModal({
  visible,
  imageUrl,
  onClose,
}: ImagePreviewModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    if (!visible) {
      setLoading(false)
      setLoadFailed(false)
      return
    }

    setLoading(Boolean(imageUrl))
    setLoadFailed(false)
  }, [visible, imageUrl])

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.92)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Pressable
          onPress={onClose}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <Pressable
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 56,
            right: 22,
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: 'rgba(255,255,255,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <Feather name="x" size={18} color="#fff" />
        </Pressable>

        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoadFailed(true)
              setLoading(false)
            }}
          />
        ) : null}

        {loading ? (
          <View
            style={{
              position: 'absolute',
              bottom: 36,
              backgroundColor: 'rgba(0,0,0,0.4)',
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ color: '#fff', marginLeft: 8, fontSize: 12 }}>
              Cargando imagen...
            </Text>
          </View>
        ) : null}

        {loadFailed ? (
          <View
            style={{
              position: 'absolute',
              bottom: 36,
              backgroundColor: 'rgba(228,106,106,0.22)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(228,106,106,0.55)',
              paddingHorizontal: 12,
              paddingVertical: 9,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12 }}>
              No se pudo cargar la imagen.
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  )
}
