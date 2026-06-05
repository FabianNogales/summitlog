import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../theme/colors'
import type { GroupOuting, GroupOutingMessage } from '../../types/groupOuting'
import {
  groupOutingChatService,
  MAX_GROUP_OUTING_MESSAGE_LENGTH,
} from '../../services/groupOutingChat.service'

interface GroupOutingChatModalProps {
  visible: boolean
  outing: GroupOuting
  currentUserId: string | null
  canChat: boolean
  onClose: () => void
}

function getAuthorName(message: GroupOutingMessage) {
  return (
    message.profiles?.full_name?.trim() ||
    message.profiles?.username?.trim() ||
    'Senderista'
  )
}

function getInitials(name: string) {
  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length === 0) return 'S'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function GroupOutingChatModal({
  visible,
  outing,
  currentUserId,
  canChat,
  onClose,
}: GroupOutingChatModalProps) {
  const [messages, setMessages] = useState<GroupOutingMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmedMessage = messageInput.trim()
  const sendDisabled = !canChat || sending || !trimmedMessage

  const loadMessages = useCallback(async () => {
    if (!visible || !canChat) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      const loadedMessages = await groupOutingChatService.getGroupOutingMessages(outing.id)
      setMessages(loadedMessages)
    } catch (err: any) {
      setError(err?.message ?? 'No se pudieron cargar los mensajes de la salida.')
    } finally {
      setLoading(false)
    }
  }, [canChat, outing.id, visible])

  useEffect(() => {
    if (visible) {
      setMessageInput('')
      loadMessages()
    }
  }, [loadMessages, visible])

  async function handleSendMessage() {
    if (sendDisabled) {
      return
    }

    try {
      setSending(true)
      setError(null)
      await groupOutingChatService.sendGroupOutingMessage(outing.id, trimmedMessage)
      setMessageInput('')
      await loadMessages()
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo enviar el mensaje.')
    } finally {
      setSending(false)
    }
  }

  const title = useMemo(() => outing.title || 'Chat de salida', [outing.title])

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderSoft || colors.border,
            backgroundColor: colors.bgCard || colors.card,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.bgElevated || colors.cardSecondary,
              }}
            >
              <Ionicons name="close" size={20} color={colors.textPrimary || colors.text} />
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.textPrimary || colors.text,
                  fontSize: 17,
                  fontWeight: '700',
                }}
                numberOfLines={1}
              >
                {title}
              </Text>
              <Text style={{ color: colors.textMuted || colors.textSecondary, fontSize: 12 }}>
                Chat de participantes
              </Text>
            </View>

            <Pressable
              onPress={loadMessages}
              disabled={loading || !canChat}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.bgElevated || colors.cardSecondary,
                opacity: loading || !canChat ? 0.6 : 1,
              }}
            >
              <Ionicons name="refresh" size={18} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {!canChat ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: 'center' }}>
              Debes unirte a esta salida para ver y enviar mensajes.
            </Text>
          </View>
        ) : (
          <>
            {loading ? (
              <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null}

            {error ? (
              <View
                style={{
                  marginHorizontal: 16,
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.danger,
                  backgroundColor: colors.bgCard || colors.card,
                }}
              >
                <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>
              </View>
            ) : null}

            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                flexGrow: 1,
                paddingHorizontal: 16,
                paddingTop: 14,
                paddingBottom: 16,
              }}
              ListEmptyComponent={
                !loading ? (
                  <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 80 }}>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 15,
                        textAlign: 'center',
                        lineHeight: 22,
                      }}
                    >
                      Aún no hay mensajes. Escribe para coordinar con el grupo.
                    </Text>
                  </View>
                ) : null
              }
              renderItem={({ item }) => {
                const authorName = getAuthorName(item)
                const isMine = item.user_id === currentUserId

                return (
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: isMine ? 'flex-end' : 'flex-start',
                      marginBottom: 12,
                    }}
                  >
                    {!isMine ? (
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: colors.bgElevated || colors.cardSecondary,
                          marginRight: 8,
                          marginTop: 4,
                        }}
                      >
                        <Text style={{ color: colors.textPrimary || colors.text, fontSize: 12 }}>
                          {getInitials(authorName)}
                        </Text>
                      </View>
                    ) : null}

                    <View
                      style={{
                        maxWidth: '78%',
                        backgroundColor: isMine
                          ? colors.primary
                          : colors.bgCard || colors.card,
                        borderWidth: isMine ? 0 : 1,
                        borderColor: colors.borderSoft || colors.border,
                        borderRadius: 14,
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                      }}
                    >
                      <Text
                        style={{
                          color: isMine
                            ? colors.bgMain || '#000'
                            : colors.textMuted || colors.textSecondary,
                          fontSize: 11,
                          fontWeight: '700',
                          marginBottom: 3,
                        }}
                      >
                        {isMine ? 'Tú' : authorName} · {formatMessageTime(item.created_at)}
                      </Text>
                      <Text
                        style={{
                          color: isMine
                            ? colors.bgMain || '#000'
                            : colors.textPrimary || colors.text,
                          fontSize: 14,
                          lineHeight: 20,
                        }}
                      >
                        {item.message}
                      </Text>
                    </View>
                  </View>
                )
              }}
            />

            <View
              style={{
                paddingHorizontal: 16,
                paddingTop: 10,
                paddingBottom: Platform.OS === 'ios' ? 24 : 14,
                borderTopWidth: 1,
                borderTopColor: colors.borderSoft || colors.border,
                backgroundColor: colors.bgCard || colors.card,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                <TextInput
                  value={messageInput}
                  onChangeText={setMessageInput}
                  placeholder="Escribe un mensaje..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  maxLength={MAX_GROUP_OUTING_MESSAGE_LENGTH}
                  style={{
                    flex: 1,
                    minHeight: 42,
                    maxHeight: 110,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.borderSoft || colors.border,
                    backgroundColor: colors.bgElevated || colors.cardSecondary,
                    color: colors.textPrimary || colors.text,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                  }}
                />
                <Pressable
                  onPress={handleSendMessage}
                  disabled={sendDisabled}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: sendDisabled
                      ? colors.bgElevated || colors.cardSecondary
                      : colors.primary,
                  }}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color={colors.bgMain || '#000'} />
                  ) : (
                    <Ionicons
                      name="send"
                      size={17}
                      color={sendDisabled ? colors.textMuted : colors.bgMain || '#000'}
                    />
                  )}
                </Pressable>
              </View>
              <Text
                style={{
                  color: colors.textMuted || colors.textSecondary,
                  fontSize: 11,
                  marginTop: 6,
                  textAlign: 'right',
                }}
              >
                {trimmedMessage.length}/{MAX_GROUP_OUTING_MESSAGE_LENGTH}
              </Text>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  )
}
