import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native'

import { colors } from '../../theme/colors'
import { FORM_SCROLL_BOTTOM_PADDING } from '../../utils/keyboard'
import { CreateOutingComposer } from './CreateOutingComposer'

interface CreateOutingFormData {
  title: string
  description: string
  destination: string
  meetingPoint: string
  dateTime: Date
  maxParticipants: number
  imageUri: string | null
}

interface CommunityCreateOutingModalProps {
  visible: boolean
  submitting: boolean
  submitError: string | null
  onClose: () => void
  onSubmit: (formData: CreateOutingFormData) => void
}

export function CommunityCreateOutingModal({
  visible,
  submitting,
  submitError,
  onClose,
  onSubmit,
}: CommunityCreateOutingModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'flex-end',
        }}
      >
        <Pressable
          onPress={() => !submitting && onClose()}
          style={{ flex: 1 }}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              maxHeight: '90%',
            }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: FORM_SCROLL_BOTTOM_PADDING,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <CreateOutingComposer
              submitting={submitting}
              submitError={submitError}
              onSubmit={onSubmit}
              onCancel={onClose}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}