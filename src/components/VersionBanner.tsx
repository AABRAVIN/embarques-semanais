import { useState } from "react";
import { APP_VERSION, isNewVersion, markVersionSeen } from "@/lib/version";
import { X } from "lucide-react";

export function VersionBanner() {
  const [visible, setVisible] = useState(isNewVersion());

  if (!visible) return null;

  return (
    <div className="flex items-center justify-between gap-2 bg-primary/10 px-4 py-2 text-sm text-primary">
      <span>
        Sistema atualizado para a versão <strong>{APP_VERSION}</strong>!
      </span>
      <button
        onClick={() => {
          markVersionSeen();
          setVisible(false);
        }}
        className="rounded p-0.5 transition-colors hover:bg-primary/20"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
