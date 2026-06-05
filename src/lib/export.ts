import * as XLSX from "xlsx";
import { supabase } from "./supabaseClient";
import type { Embarque } from "@/types/embarque";

export async function fetchAllEmbarquesForExport(): Promise<Embarque[]> {
  const { data: active, error } = await supabase
    .from("embarques")
    .select("*")
    .order("data", { ascending: false });

  if (error) throw error;

  const all: Embarque[] = (active ?? []) as Embarque[];

  try {
    const { data: files, error: listError } = await supabase.storage
      .from("backup-historico")
      .list();

    if (listError || !files) return all;

    const jsonFiles = files.filter((f) => f.name.endsWith(".json"));

    for (const file of jsonFiles) {
      try {
        const { data: blob, error: dlError } = await supabase.storage
          .from("backup-historico")
          .download(file.name);

        if (dlError || !blob) continue;

        const text = await blob.text();
        const parsed: Embarque[] = JSON.parse(text);

        if (Array.isArray(parsed)) {
          all.push(...parsed);
        }
      } catch {
        // skip individual file errors
      }
    }
  } catch {
    // bucket may not exist — continue with active data only
  }

  return all;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToExcel(data: Embarque[]) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Embarques");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const dateStr = new Date().toISOString().split("T")[0];
  triggerDownload(blob, `embarques_backup_${dateStr}.xlsx`);
}

export function exportToJSON(data: Embarque[]) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const dateStr = new Date().toISOString().split("T")[0];
  triggerDownload(blob, `embarques_backup_${dateStr}.json`);
}
