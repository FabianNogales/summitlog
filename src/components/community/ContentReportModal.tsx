import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRef } from 'react'

import { AuthButton } from '../auth/AuthButton'
import { colors } from '../../theme/colors'
import {
  CONTENT_REPORT_REASONS,
  type ContentReportReason,
} from '../../types/contentReport'
import {
  MODAL_SCROLL_BOTTOM_PADDING,
  MODAL_INPUT_SCROLL_OFFSET,
  scrollToFocusedInput,
} from '../../utils/keyboard'

interface ContentReportModalProps {
  visible: boolean
  targetLabel: string
  reason: ContentReportReason
  description: string
  loading?: boolean
  errorMessage?: string | null
  onChangeReason: (value: ContentReportReason) => void
  onChangeDescription: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}

function formatReasonLabel(reason: ContentReportReason) {
  switch (reason) {
    case 'spam':
      return 'Spam'
    case 'harassment':
      return 'Acoso'
    case 'dangerous_content':
      return 'Contenido peligroso'
    case 'misinformation':
      return 'Desinformacion'
    case 'offensive_content':
      return 'Ofensivo'
    default:
      return 'Otro'
  }
}

export function ContentReportModal({
  visible,
  targetLabel,
  reason,
  description,
  loading = false,
  errorMessage,
  onChangeReason,
  onChangeDescription,
  onClose,
  onSubmit,
}: ContentReportModalProps) {
  const scrollRef = useRef<ScrollView | null>(null)

  function handleFocus(event: { target?: unknown }) {
    scrollToFocusedInput(scrollRef, event, MODAL_INPUT_SCROLL_OFFSET)
  }

  return (
    <Modal
      animationType="fade"
      visible={visible}
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.overlay,
            justifyContent: 'center',
            padding: 18,
          }}
        >
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingBottom: MODAL_SCROLL_BOTTOM_PADDING,
            }}
          >
            <View
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 16,
                padding: 16,
                maxHeight: '85%',
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
                Denunciar contenido
              </Text>

              <Text style={{ color: colors.textSecondary, marginBottom: 14 }}>
                Reportaras: {targetLabel}
              </Text>

              <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Motivo</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                {CONTENT_REPORT_REASONS.map((reasonOption) => {
                  const isActive = reasonOption === reason
                  return (
                    <Pressable
                      key={reasonOption}
                      onPress={() => onChangeReason(reasonOption)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: isActive ? colors.primary : colors.border,
                        backgroundColor: isActive ? colors.primary : colors.cardSecondary,
                        marginRight: 8,
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: isActive ? colors.text : colors.textSecondary,
                          fontWeight: '600',
                          fontSize: 12,
                        }}
                      >
                        {formatReasonLabel(reasonOption)}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>

              <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
                Descripción (opcional)
              </Text>

              <TextInput
                value={description}
                onChangeText={onChangeDescription}
                onFocus={handleFocus}
                multiline
                textAlignVertical="top"
                placeholder="Describe por que este contenido es inapropiado..."
                placeholderTextColor={colors.placeholder}
                style={{
                  minHeight: 110,
                  backgroundColor: colors.cardSecondary,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  color: colors.text,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 12,
                }}
              />

              {errorMessage ? (
                <Text style={{ color: colors.danger, marginBottom: 10 }}>
                  {errorMessage}
                </Text>
              ) : null}

              <AuthButton title="Enviar denuncia" onPress={onSubmit} loading={loading} />

              <Pressable
                onPress={onClose}
                disabled={loading}
                style={{
                  minHeight: 44,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.cardSecondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 10,
                  opacity: loading ? 0.65 : 1,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
                  Cancelar
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
