import { supabase } from '../lib/supabase'
import type { GroupOutingMessage } from '../types/groupOuting'

export const MAX_GROUP_OUTING_MESSAGE_LENGTH = 300

async function getCurrentUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.id ?? null
}

async function assertCurrentUserIsParticipant(groupOutingId: string) {
  const userId = await getCurrentUserId()

  if (!userId) {
    throw new Error('Debes iniciar sesión para usar el chat de la salida.')
  }

  const { data, error } = await supabase
    .from('group_outing_participants')
    .select('id')
    .eq('group_outing_id', groupOutingId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('Solo los participantes pueden usar el chat de esta salida.')
  }

  return userId
}

export const groupOutingChatService = {
  async getGroupOutingMessages(groupOutingId: string): Promise<GroupOutingMessage[]> {
    await assertCurrentUserIsParticipant(groupOutingId)

    const { data, error } = await supabase
      .from('group_outing_messages')
      .select(
        `
        id,
        group_outing_id,
        user_id,
        message,
        created_at,
        profiles:user_id (username, avatar_url, full_name)
      `
      )
      .eq('group_outing_id', groupOutingId)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return (data ?? []) as GroupOutingMessage[]
  },

  async sendGroupOutingMessage(
    groupOutingId: string,
    message: string
  ): Promise<void> {
    const trimmedMessage = message.trim()

    if (!trimmedMessage) {
      throw new Error('Escribe un mensaje antes de enviarlo.')
    }

    if (trimmedMessage.length > MAX_GROUP_OUTING_MESSAGE_LENGTH) {
      throw new Error(
        `El mensaje no puede superar ${MAX_GROUP_OUTING_MESSAGE_LENGTH} caracteres.`
      )
    }

    const userId = await assertCurrentUserIsParticipant(groupOutingId)

    const { error } = await supabase.from('group_outing_messages').insert([
      {
        group_outing_id: groupOutingId,
        user_id: userId,
        message: trimmedMessage,
      },
    ])

    if (error) {
      throw error
    }
  },
}
