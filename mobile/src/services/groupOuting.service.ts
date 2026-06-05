import { supabase } from '../lib/supabase'; 
import { GroupOuting, CreateGroupOutingDTO } from '../types/groupOuting';
// Se migra la importación a la API de compatibilidad histórica recomendada por Expo SDK 54
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export const groupOutingService = {
  /**
   * Obtiene el ID del usuario autenticado actualmente de manera segura.
   */
  async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.error("Error al obtener el usuario actual:", error);
      return null;
    }
  },

  /**
   * Obtiene todas las salidas grupales con estado visible.
   * Incluye el perfil del creador, la cuenta de participantes y sus archivos multimedia.
   */
  async getGroupOutings(): Promise<GroupOuting[]> {
    const { data: { user } } = await supabase.auth.getUser();
    const nowIso = new Date().toISOString();

    // 1. Obtener salidas visibles junto con perfiles y archivos multimedia asociados
    const { data, error } = await supabase
      .from('group_outings')
      .select(`
        *,
        profiles:user_id (username, avatar_url, full_name),
        group_outing_media (file_path, sort_order)
      `)
      .eq('moderation_status', 'visible')
      .gte('date_time', nowIso)
      .order('date_time', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    // 2. Enriquecer los datos calculando participantes y estados de inscripción del usuario activo
    const enrichedOutings = await Promise.all(
      data.map(async (outing) => {
        const { count, error: countError } = await supabase
          .from('group_outing_participants')
          .select('*', { count: 'exact', head: true })
          .eq('group_outing_id', outing.id);

        let isUserJoined = false;
        if (user) {
          const { data: participantData } = await supabase
            .from('group_outing_participants')
            .select('id')
            .eq('group_outing_id', outing.id)
            .eq('user_id', user.id)
            .maybeSingle(); 
        
          isUserJoined = !!participantData;
        }

        const safeProfiles = outing.profiles ? outing.profiles : {
          username: 'Senderista Anónimo',
          avatar_url: null,
          full_name: 'Usuario de pruebas'
        };

        return {
          ...outing,
          profiles: safeProfiles,
          participant_count: countError ? 1 : (count || 1), 
          is_user_joined: isUserJoined,
        };
      })
    );

    return enrichedOutings as GroupOuting[];
  },

  /**
   * Crea una nueva salida grupal. Si se adjunta una URI de imagen, se procesa la lectura binaria
   * mediante el sistema de archivos nativo, se almacena en el Bucket de Supabase y se genera
   * la relación en la tabla multimedia.
   */
  async createGroupOuting(dto: CreateGroupOutingDTO, imageUri?: string | null): Promise<GroupOuting> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Debes iniciar sesión para crear una salida grupal.');

    if (new Date(dto.date_time) <= new Date()) {
      throw new Error('La fecha y hora de la salida debe ser programada en el futuro.');
    }

    // 1. Registrar la salida grupal base
    const { data: newOuting, error: outingError } = await supabase
      .from('group_outings')
      .insert([
        {
          title: dto.title,
          description: dto.description,
          destination: dto.destination,
          meeting_point: dto.meeting_point, 
          date_time: dto.date_time,
          max_participants: dto.max_participants,
          user_id: user.id,
          moderation_status: 'visible'
        }
      ])
      .select()
      .single();

    if (outingError) throw outingError;
    if (!newOuting) throw new Error('No se recibieron los datos de la salida creada.');

    // 2. Procesamiento y carga del archivo adjunto si existe
    if (imageUri) {
      try {
        const cleanUri = imageUri.split('?')[0];
        const rawExt = cleanUri.split('.').pop() || 'jpg';
        const fileExt = rawExt.toLowerCase() === 'jpeg' ? 'jpg' : rawExt.toLowerCase();
        
        const fileName = `${user.id}/${newOuting.id}-${Date.now()}.${fileExt}`;
        const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';

        // Lectura nativa usando la interfaz legacy permitida de Expo SDK 54
        const base64Data = await FileSystem.readAsStringAsync(imageUri, {
          encoding: 'base64',
        });

        const arrayBuffer = decode(base64Data);

        // Carga del binario al Storage de Supabase
        const { error: uploadError } = await supabase.storage
          .from('outings_images')
          .upload(fileName, arrayBuffer, {
            contentType: mimeType,
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('outings_images')
          .getPublicUrl(fileName);

        // Registro en la tabla relacional multimedia
        const { error: mediaError } = await supabase
          .from('group_outing_media')
          .insert([
            {
              group_outing_id: newOuting.id,
              file_path: publicUrl,
              file_type: 'image',
              sort_order: 0
            }
          ]);

        if (mediaError) throw mediaError;

      } catch (uploadErr: any) {
        console.error('Error crítico en el procesamiento de archivo adjunto:', uploadErr);
        throw new Error(`La salida se creó, pero falló la carga de la imagen: ${uploadErr.message || uploadErr}`);
      }
    }

    return newOuting as GroupOuting;
  },

  /**
   * Realiza un borrado lógico de una salida grupal modificando su estado de moderación.
   */
  async deleteGroupOuting(outingId: string): Promise<boolean> {
    const { error } = await supabase
      .from('group_outings')
      .update({ moderation_status: 'hidden' }) 
      .eq('id', outingId);
  
    if (error) throw error;
    return true;
  },

  /**
   * Gestiona el control de flujo de inscripciones y desinscripciones de usuarios a salidas grupales.
   */
  async toggleJoinGroupOuting(outingId: string, isCurrentlyJoined: boolean): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Debes iniciar sesión para realizar esta acción.');

    const { data: outing } = await supabase
      .from('group_outings')
      .select('user_id, max_participants')
      .eq('id', outingId)
      .single();

    if (isCurrentlyJoined) {
      if (outing && outing.user_id === user.id) {
        throw new Error('Como organizador, no puedes abandonar la salida. Si deseas cancelarla por completo, usa el botón "Borrar".');
      }

      const { error, count } = await supabase
        .from('group_outing_participants')
        .delete({ count: 'exact' })
        .eq('group_outing_id', outingId)
        .eq('user_id', user.id);

      if (error) throw error;
      if (count === 0) {
        throw new Error('No se pudo remover la inscripción. Verifica tus permisos.');
      }
      return false; 
    } else {
      const { count } = await supabase
        .from('group_outing_participants')
        .select('*', { count: 'exact', head: true })
        .eq('group_outing_id', outingId);

      if (outing && count !== null && count >= outing.max_participants) {
        throw new Error('Lo sentimos, esta salida ya completó su cupo de plazas disponibles.');
      }

      const { error } = await supabase
        .from('group_outing_participants')
        .insert([
          { group_outing_id: outingId, user_id: user.id }
        ]);

      if (error) throw error;
      return true; 
    }
  }
};
