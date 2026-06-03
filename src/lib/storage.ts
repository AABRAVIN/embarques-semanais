import { supabase } from "./supabaseClient";

export const STORAGE_LIMIT_MB = 500;

export async function getStorageUsageMB(): Promise<number> {
  // Primary: call get_database_size RPC (PostgreSQL pg_database_size)
  // Create this function in Supabase SQL editor:
  //   CREATE OR REPLACE FUNCTION get_database_size()
  //   RETURNS bigint LANGUAGE sql AS $$
  //     SELECT pg_database_size(current_database());
  //   $$;
  try {
    const { data, error } = await supabase.rpc("get_database_size");
    if (!error && data != null) {
      return Math.round((data / (1024 * 1024)) * 100) / 100;
    }
  } catch {}

  // Fallback: sum file sizes from storage buckets
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets) return 0;
    let totalBytes = 0;
    for (const bucket of buckets) {
      const { data: files } = await supabase.storage
        .from(bucket.name)
        .list("", { limit: 10000 });
      if (files) {
        for (const file of files) {
          const meta = file.metadata as { size?: number } | null;
          if (meta?.size) totalBytes += meta.size;
        }
      }
    }
    return Math.round((totalBytes / (1024 * 1024)) * 100) / 100;
  } catch {
    return 0;
  }
}
