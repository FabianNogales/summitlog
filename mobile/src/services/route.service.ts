import { supabase } from '../lib/supabase'
import type { RouteItem } from '../types/route'

export async function getPublishedRoutes() {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('publication_status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as RouteItem[]
}