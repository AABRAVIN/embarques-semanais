import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables"
  );
}

let _supabase: ReturnType<typeof createClient<Database>> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_, prop, receiver) {
    if (!_supabase) {
      _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: typeof window !== "undefined" ? localStorage : undefined,
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    }
    return Reflect.get(_supabase, prop, receiver);
  },
});
