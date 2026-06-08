import { useRef, useState } from "react";
import { User, Camera, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabaseClient";
import { uploadAvatar } from "@/lib/avatar";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  size?: "sm" | "md";
  className?: string;
}

const SIZE_MAP = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
};

const ICON_SIZE_MAP = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
};

export function AvatarUpload({ size = "md", className }: AvatarUploadProps) {
  const { profile, refreshProfile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const avatarUrl = profile?.avatar_url;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    try {
      const url = await uploadAvatar(profile.id, file);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      await refreshProfile();
      setImgError(false);
    } catch (err) {
      console.error("Erro ao fazer upload do avatar:", err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleClick() {
    if (uploading) return;
    inputRef.current?.click();
  }

  const showImage = avatarUrl && !imgError;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        title="Alterar foto"
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-full overflow-hidden transition-all",
          SIZE_MAP[size],
          showImage
            ? "border-2 border-border hover:border-primary/50"
            : "bg-sidebar-hover hover:bg-sidebar-hover/80",
          uploading && "opacity-60 cursor-not-allowed",
          className
        )}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-sidebar-foreground" />
        ) : showImage ? (
          <>
            <img
              src={avatarUrl}
              alt="Avatar"
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/40 group">
              <Camera className="h-3.5 w-3.5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </>
        ) : (
          <>
            <User className={cn("text-sidebar-foreground", ICON_SIZE_MAP[size])} />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/20">
              <Camera className="h-3.5 w-3.5 text-sidebar-foreground opacity-0 transition-opacity hover:opacity-100" />
            </div>
          </>
        )}
      </button>
    </>
  );
}
