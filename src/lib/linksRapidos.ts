import { supabase } from "./supabaseClient";
import type { LinksRapidos } from "@/types/linksRapidos";

export async function listLinksRapidos(): Promise<LinksRapidos[]> {
  const { data, error } = await supabase
    .from("links_rapidos")
    .select("*")
    .order("ordem", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LinksRapidos[];
}

export async function createLinksRapidos(input: { nome: string; url: string; ordem: number }) {
  const { error } = await supabase
    .from("links_rapidos")
    .insert([input] as never);
  if (error) throw error;
}

export async function updateLinksRapidos(id: string, input: { nome: string; url: string; ordem: number }) {
  const { error } = await supabase
    .from("links_rapidos")
    .update(input as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteLinksRapidos(id: string) {
  const { error } = await supabase
    .from("links_rapidos")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
