import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native'
import type { RefObject } from 'react'

import { colors } from '../../theme/colors'
import { FORM_SCROLL_BOTTOM_PADDING, scrollToFocusedInput } from '../../utils/keyboard'
import { CreatePostComposer, type DraftPostImage } from './CreatePostComposer'

interface CommunityCreatePostModalProps {
  visible: boolean
  scrollRef: RefObject<ScrollView | null>
  displayName: string
  avatarUrl?: string | null
  content: string
  contentTooShort: boolean
  selectedPostImage: DraftPostImage | null
  submitting: boolean
  submitError: string | null
  onClose: () => void
  onChangeContent: (value: string) => void
  onPickImage: () => void
  onRemoveImage: () => void
  onSubmit: () => void
}

export function CommunityCreatePostModal({
  visible,
  scrollRef,
  displayName,
  avatarUrl,
  content,
  contentTooShort,
  selectedPostImage,
  submitting,
  submitError,
  onClose,
  onChangeContent,
  onPickImage,
  onRemoveImage,
  onSubmit,
}: CommunityCreatePostModalProps) {
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
        <Pressable onPress={onClose} style={{ flex: 1 }} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            ref={scrollRef}
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              maxHeight: '88%',
            }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: FORM_SCROLL_BOTTOM_PADDING,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <CreatePostComposer
              displayName={displayName}
              avatarUrl={avatarUrl}
              content={content}
              contentTooShort={contentTooShort}
              selectedPostImage={selectedPostImage}
              submitting={submitting}
              submitError={submitError}
              onChangeContent={onChangeContent}
              onInputFocus={(event) => scrollToFocusedInput(scrollRef, event)}
              onPickImage={onPickImage}
              onRemoveImage={onRemoveImage}
              onSubmit={onSubmit}
              onCancel={onClose}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}