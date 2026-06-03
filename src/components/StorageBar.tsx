import { useState, useEffect } from "react";
import { HardDrive } from "lucide-react";
import { getStorageUsageMB, STORAGE_LIMIT_MB } from "@/lib/storage";

export function StorageBar() {
  const [usageMB, setUsageMB] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStorageUsageMB().then((mb) => {
      setUsageMB(mb);
      setLoading(false);
    });
  }, []);

  const percent = Math.min((usageMB / STORAGE_LIMIT_MB) * 100, 100);

  let barColor = "bg-green-500";
  let textColor = "text-green-500";
  if (percent > 90) {
    barColor = "bg-red-500";
    textColor = "text-red-500";
  } else if (percent >= 80) {
    barColor = "bg-yellow-500";
    textColor = "text-yellow-500";
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <HardDrive className="h-3.5 w-3.5 shrink-0" />
          <span>Armazenamento</span>
        </div>
        {!loading && (
          <span className={`text-xs font-medium whitespace-nowrap ${textColor}`}>
            {usageMB.toFixed(1)} MB de {STORAGE_LIMIT_MB} MB ({percent.toFixed(0)}%)
          </span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        {loading ? (
          <div className="h-full w-1/3 rounded-full bg-muted-foreground/20 animate-pulse" />
        ) : (
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        )}
      </div>
    </div>
  );
}
