"use server";

import { type IdentificationStoreState } from "@/stores/identification-store";
import { getUser } from "@/utils/supabase/server";

export async function saveTableIdentifications(
  prefixedId: string,
  state: IdentificationStoreState
) {
  const { user, supabase } = await getUser();
  if (!user) throw new Error("Not authenticated");

  // Convert Sets to Arrays and stringify for JSON compatibility
  const serializableIdentifications = {
    activeFilters: state.activeFilters,
    hasHeader: state.hasHeader,
    identifications: state.identifications,
    redisMatchData: state.redisMatchData,
    redisInfo: state.redisInfo,
    stats: state.stats,
    typeOptions: state.typeOptions,
    prefixedId: state.prefixedId,
    redisMatches: Object.fromEntries(
      Object.entries(state.redisMatches).map(([k, v]) => [k, Array.from(v)])
    ),
  };

  const { error } = await supabase
    .from("table_identification")
    .upsert(
      {
        prefixed_id: prefixedId,
        user_id: user.id,
        identifications: JSON.stringify(serializableIdentifications),
      },
      {
        onConflict: "prefixed_id,user_id",
      }
    )
    .select();

  if (error) {
    console.error("Failed to save identifications:", error);
    throw error;
  } else {
    console.log("Saved identifications");
  }
}

export async function loadTableIdentifications(
  prefixedId: string
): Promise<IdentificationStoreState | null> {
  const { user, supabase } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("table_identification")
    .select("identifications")
    .eq("prefixed_id", prefixedId)
    .eq("user_id", user.id)
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
    activeFilters: stored.activeFilters,
    hasHeader: stored.hasHeader,
    identifications: stored.identifications,
    redisMatchData: stored.redisMatchData,
    redisInfo: stored.redisInfo,
    stats: stored.stats,
    typeOptions: stored.typeOptions,
    prefixedId: stored.prefixedId,
    redisMatches: Object.fromEntries(
      Object.entries(stored.redisMatches || {}).map(([k, v]) => [
        k,
        new Set(v as string[]),
      ])
    ),
    // Initialize status fields with defaults
    identificationStatus: {},
    redisStatus: {},
    isSaving: false,
  };
}
