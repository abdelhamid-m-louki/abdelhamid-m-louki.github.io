import { createClient } from '@supabase/supabase-js';

let clientUnique = null;

/**
 * Client Supabase admin (service_role — bypass RLS).
 * Jamais exposé au navigateur : uniquement dans les functions Vercel.
 */
export function clientAdmin() {
  if (clientUnique) return clientUnique;

  const url = process.env.SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !cle) {
    throw new Error(
      "Variables d'environnement manquantes : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  clientUnique = createClient(url, cle, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return clientUnique;
}
