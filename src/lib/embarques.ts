import { supabase } from "./supabase";
import type { Embarque, EmbarqueStatus } from "@/types/embarque";

export async function updateEmbarqueStatus(
  id: string,
  status: EmbarqueStatus
) {
  const payload: Record<string, string | null> = { status };

  if (status === "motorista_avisado") {
    payload.avisado_at = new Date().toISOString();
  }

  if (status === "concluido") {
    payload.confirmado_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("embarques")
    .update(payload as never)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteEmbarque(id: string) {
  const { error } = await supabase.from("embarques").delete().eq("id", id);
  if (error) throw error;
}

export async function moveEmbarqueDate(id: string, novaData: string) {
  const { error } = await supabase
    .from("embarques")
    .update({ data: novaData } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function listEmbarques(): Promise<Embarque[]> {
  const { data, error } = await supabase
    .from("embarques")
    .select("*")
    .order("data", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Embarque[];
}
