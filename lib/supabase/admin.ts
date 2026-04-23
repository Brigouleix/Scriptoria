import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client avec la service_role key.
 * Contourne le RLS — à utiliser uniquement côté serveur dans les routes admin.
 * Ajouter SUPABASE_SERVICE_ROLE_KEY dans .env.local (Supabase > Settings > API).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!key || key === 'REMPLACE_PAR_TA_CLE_SERVICE_ROLE') {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY manquante dans .env.local. ' +
      'Récupère-la sur Supabase > Settings > API > service_role.'
    )
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
