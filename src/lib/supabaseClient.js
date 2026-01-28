// src/lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

// Usamos import.meta.env para acceder a las variables de entorno de Astro
// que deben estar definidas en tu archivo .env:
// PUBLIC_SUPABASE_URL="https://pmrgvvsoowpxonkjjaug.supabase.co"
// PUBLIC_SUPABASE_ANON_KEY="TU_CLAVE_ANONIMA"

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Verifica si las variables están definidas para evitar errores
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Las variables de entorno de Supabase no están configuradas correctamente.");
}

const storage = typeof window !== "undefined" ? window.sessionStorage : undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage,
  },
});
