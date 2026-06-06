import type { ReactNode, RefObject } from 'react'
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native'

import { AuthButton } from '../auth/AuthButton'
import { colors } from '../../theme/colors'
import { scrollToFocusedInput } from '../../utils/keyboard'
import type { JournalDifficulty, JournalVisibility } from '../../types/journal'
import { JournalVisibilitySelector } from './JournalVisibilitySelector'

const difficultyOptions: {
  label: string
  value: JournalDifficulty
}[] = [
  { label: 'Sin definir', value: '' },
  { label: 'Fácil', value: 'easy' },
  { label: 'Media', value: 'medium' },
  { label: 'Difícil', value: 'hard' },
]

interface JournalEditorFormProps {
  scrollRef: RefObject<ScrollView | null>
  hasJournal: boolean
  title: string
  content: string
  visibility: JournalVisibility
  difficulty: JournalDifficulty
  category: string
  commentsEnabled: boolean
  formError: string | null
  saving: boolean
  uploading: boolean
  hasUnsavedChanges: boolean
  mediaSection?: ReactNode
  onChangeTitle: (value: string) => void
  onChangeContent: (value: string) => void
  onChangeVisibility: (value: JournalVisibility) => void
  onChangeDifficulty: (value: JournalDifficulty) => void
  onChangeCategory: (value: string) => void
  onChangeCommentsEnabled: (value: boolean) => void
  onClearFormError: () => void
  onSave: () => void
}

export function JournalEditorForm({
  scrollRef,
  hasJournal,
  title,
  content,
  visibility,
  difficulty,
  category,
  commentsEnabled,
  formError,
  saving,
  uploading,
  hasUnsavedChanges,
  mediaSection,
  onChangeTitle,
  onChangeContent,
  onChangeVisibility,
  onChangeDifficulty,
  onChangeCategory,
  onChangeCommentsEnabled,
  onClearFormError,
  onSave,
}: JournalEditorFormProps) {
  return (
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
          onChangeText={(value) => {
            onChangeTitle(value)
            if (formError) onClearFormError()
          }}
          onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
          placeholder="Ej: Pico Tunari"
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
          onChangeText={(value) => {
            onChangeContent(value)
            if (formError) onClearFormError()
          }}
          onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
          placeholder="Ej: Ruta por la cara norte, con bellas vistas y cascada."
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

      <View style={{ marginBottom: 18 }}>
        <Text
          style={{
            color: colors.text,
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 10,
          }}
        >
          Dificultad
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {difficultyOptions.map((option) => {
            const isSelected = difficulty === option.value

            return (
              <Pressable
                key={option.value || 'undefined'}
                onPress={() => onChangeDifficulty(option.value)}
                style={{
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected
                    ? colors.primary
                    : colors.cardSecondary,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}
              >
                <Text
                  style={{
                    color: isSelected
                      ? colors.chipActiveText
                      : colors.textSecondary,
                    fontWeight: '700',
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
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
          Categoría
        </Text>

        <TextInput
          value={category}
          onChangeText={(value) => {
            onChangeCategory(value)
            if (formError) onClearFormError()
          }}
          onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
          placeholder="Ej: trekking, trail, senderismo"
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

      <View
        style={{
          marginBottom: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: 14,
            fontWeight: '600',
            flex: 1,
          }}
        >
          Habilitar comentarios
        </Text>

        <Switch
          value={commentsEnabled}
          onValueChange={onChangeCommentsEnabled}
          trackColor={{ false: colors.cardSecondary, true: colors.primary }}
          thumbColor={colors.text}
        />
      </View>

      <JournalVisibilitySelector value={visibility} onChange={onChangeVisibility} />

      {mediaSection}

      {formError ? (
        <Text
          style={{
            color: colors.danger,
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {formError}
        </Text>
      ) : null}

      <AuthButton
        title="Guardar cambios"
        onPress={onSave}
        loading={saving}
        disabled={uploading || saving || (hasJournal ? !hasUnsavedChanges : false)}
      />
    </View>
  )
}
