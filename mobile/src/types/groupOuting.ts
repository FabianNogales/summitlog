export interface GroupOuting {
    id: string;
    user_id: string;
    title: string;
    destination: string;
    description?: string;
    meeting_point: string;
    meeting_lat?: number;
    meeting_lng?: number;
    date_time: string; // ISO String
    max_participants: number;
    moderation_status: 'visible' | 'hidden';
    created_at: string;
    updated_at: string;
    
    // Relaciones virtuales que traeremos con JOINS de Supabase
    profiles?: {
      username: string;
      avatar_url?: string;
      full_name?: string;
    };
    // Para contar cuántos se han unido
    participant_count?: number;
    // Para saber si el usuario logueado ya está inscrito
    is_user_joined?: boolean;
  
    // 🔴 NUEVA RELACIÓN MULTIMEDIA ADAPTADA
    group_outing_media?: {
      id?: string;
      group_outing_id?: string;
      file_path: string;
      file_type?: string;
      sort_order?: number;
      created_at?: string;
    }[];
  }
  
  export interface CreateGroupOutingDTO {
    title: string;
    destination: string;
    description?: string;
    meeting_point: string;
    meeting_lat?: number;
    meeting_lng?: number;
    date_time: string;
    max_participants: number;
  }