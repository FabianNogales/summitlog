import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors } from '../../theme/colors'

interface ImagePreviewModalProps {
  visible: boolean
  imageUrl: string | null
  imageUrls?: string[]
  onClose: () => void
}

export function ImagePreviewModal({
  visible,
  imageUrl,
  imageUrls,
  onClose,
}: ImagePreviewModalProps) {
  const scrollRef = useRef<ScrollView | null>(null)
  const { width } = useWindowDimensions()
  const [loading, setLoading] = useState(false)
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(new Set())
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const previewImageUrls = useMemo(() => {
    const seen = new Set<string>()
    const resolvedUrls: string[] = []
    const candidateUrls = imageUrls?.length ? [...imageUrls] : []

    if (imageUrl) {
      candidateUrls.push(imageUrl)
    }

    for (const candidateUrl of candidateUrls) {
      const normalizedUrl = candidateUrl?.trim()

      if (!normalizedUrl || seen.has(normalizedUrl)) {
        continue
      }

      seen.add(normalizedUrl)
      resolvedUrls.push(normalizedUrl)
    }

    return resolvedUrls
  }, [imageUrl, imageUrls])

  const initialImageIndex = useMemo(() => {
    const foundIndex = previewImageUrls.findIndex((previewUrl) => previewUrl === imageUrl)
    return foundIndex >= 0 ? foundIndex : 0
  }, [imageUrl, previewImageUrls])

  const activeImageUrl = previewImageUrls[activeImageIndex] ?? null

  useEffect(() => {
    if (!visible) {
      setLoading(false)
      setFailedImageUrls(new Set())
      setActiveImageIndex(0)
      return
    }

    setLoading(Boolean(previewImageUrls[initialImageIndex]))
    setFailedImageUrls(new Set())
    setActiveImageIndex(initialImageIndex)
  }, [visible, initialImageIndex, previewImageUrls])

  useEffect(() => {
    if (!visible || !width || previewImageUrls.length === 0) {
      return
    }

    scrollRef.current?.scrollTo({
      x: width * initialImageIndex,
      animated: false,
    })
  }, [visible, width, initialImageIndex, previewImageUrls.length])

  function handlePreviewScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!width || previewImageUrls.length === 0) {
      return
    }

    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width)
    setActiveImageIndex(
      Math.max(0, Math.min(nextIndex, previewImageUrls.length - 1))
    )
    setLoading(false)
  }

  function handleImageError(failedImageUrl: string) {
    setFailedImageUrls((prev) => {
      const next = new Set(prev)
      next.add(failedImageUrl)
      return next
    })
    setLoading(false)
  }

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

        {previewImageUrls.length > 0 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handlePreviewScroll}
            scrollEventThrottle={16}
            style={{ width: '100%', height: '100%' }}
          >
            {previewImageUrls.map((previewUrl) => (
              <View
                key={previewUrl}
                style={{
                  width,
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  source={{ uri: previewUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                  onLoadStart={() => {
                    if (previewUrl === activeImageUrl) {
                      setLoading(true)
                    }
                  }}
                  onLoadEnd={() => {
                    if (previewUrl === activeImageUrl) {
                      setLoading(false)
                    }
                  }}
                  onError={() => handleImageError(previewUrl)}
                />
              </View>
            ))}
          </ScrollView>
        ) : null}

        {previewImageUrls.length > 1 ? (
          <View
            style={{
              position: 'absolute',
              top: 56,
              alignSelf: 'center',
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.12)',
              paddingHorizontal: 12,
              paddingVertical: 7,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
              {activeImageIndex + 1}/{previewImageUrls.length}
            </Text>
          </View>
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

        {activeImageUrl && failedImageUrls.has(activeImageUrl) ? (
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
