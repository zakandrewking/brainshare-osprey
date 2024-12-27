"use server";

import { TableStore } from "@/stores/table-store";
import { createClient } from "@/utils/supabase/server";

export async function saveTableIdentifications(
  fileId: string,
  identifications: TableStore
) {
  try {
    throw new Error("test");

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Convert Sets to Arrays and stringify for JSON compatibility
    const serializableIdentifications = {
      ...identifications,
      redisMatches: Object.fromEntries(
        Object.entries(identifications.redisMatches).map(([k, v]) => [
          k,
          Array.from(v),
        ])
      ),
    };

    const { error } = await supabase
      .from("table_identification")
      .upsert({
        file_id: fileId,
        user_id: user.id,
        identifications: JSON.stringify(serializableIdentifications),
      })
      .select();

    if (error) throw error;
  } catch (error) {
    console.error("Failed to save identifications:", error);
    throw new Error("Backend is unreachable");
  }
}

export async function loadTableIdentifications(
  fileId: string
): Promise<TableStore | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("table_identification")
    .select("identifications")
    .eq("file_id", fileId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  // Parse JSON and convert Arrays back to Sets
  if (typeof data.identifications !== "string")
    throw new Error("Invalid identifications format");
  const stored = JSON.parse(data.identifications);
  return {
    ...stored,
    redisMatches: Object.fromEntries(
      Object.entries(stored.redisMatches || {}).map(([k, v]) => [
        k,
        new Set(v as string[]),
      ])
    ),
  } as TableStore;
}
