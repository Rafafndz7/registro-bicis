import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "./supabase-types"

// Singleton para el cliente de Supabase en el lado del cliente
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    // Configurar cliente con opciones para permitir IPs locales
    supabaseClient = createClientComponentClient<Database>({
      options: {
        // Aumentar el tiempo de espera para redes lentas
        global: {
          fetch: (url, options) => {
            return fetch(url, {
              ...options,
              // Aumentar timeout a 30 segundos
              signal: options?.signal || AbortSignal.timeout(30000),
              // Asegurar que las credenciales se envían
              credentials: "include",
            })
          },
        },
      },
    })
  }
  return supabaseClient
}

// Función para limpiar el cliente (útil para debugging)
export const clearSupabaseClient = () => {
  supabaseClient = null
}
