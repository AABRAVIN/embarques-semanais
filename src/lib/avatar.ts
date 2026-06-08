import { supabase } from "./supabaseClient";

const BUCKET = "avatars";

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "png";
  const filePath = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

export async function deleteAvatar(userId: string): Promise<void> {
  const { data: files } = await supabase.storage
    .from(BUCKET)
    .list(userId);

  if (!files || files.length === 0) return;

  const paths = files.map((f) => `${userId}/${f.name}`);
  await supabase.storage.from(BUCKET).remove(paths);
}
