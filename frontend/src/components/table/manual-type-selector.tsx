"use client";

import React from "react";

import useSWR from "swr";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTriggerWithCaret,
} from "@/components/ui/dropdown-menu";
import {
  IdentificationStatus,
  RedisStatus,
  useTableStore,
} from "@/stores/table-store";
import {
  COLUMN_TYPES,
  ColumnTypeDefinition,
  CustomTypeDefinition,
} from "@/utils/column-types";
import { createClient } from "@/utils/supabase/client";

interface ManualTypeSelectorProps {
  column: number;
  isLoadingIdentifications: boolean;
  handleCompareWithRedis: (
    column: number,
    type: number,
    signal: AbortSignal
  ) => Promise<void>;
}

export function ManualTypeSelector({
  column,
  isLoadingIdentifications,
  handleCompareWithRedis,
}: ManualTypeSelectorProps) {
  const supabase = createClient();
  const { state, dispatch } = useTableStore();

  const { data: customTypes } = useSWR(
    "/custom-types",
    async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("custom_type")
        .select("*")
        .eq("user_id", user.id);
      if (error) console.error("Failed to fetch custom types:", error);
      return data?.map((type) => ({ ...type, is_custom: true })) || [];
    },
    {
      // We'll revalidate manually
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const customTypesInt =
    customTypes?.map(
      (x) =>
        ({
          name: x.name,
          description: x.description,
        } as CustomTypeDefinition)
    ) || [];
  const allTypes: (ColumnTypeDefinition | CustomTypeDefinition)[] = [
    ...COLUMN_TYPES,
    ...customTypesInt,
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Manual Type Selection</label>
      <DropdownMenu>
        <DropdownMenuTriggerWithCaret
          disabled={
            isLoadingIdentifications ||
            state.redisStatus[column] === RedisStatus.MATCHING ||
            state.identificationStatus[column] ===
              IdentificationStatus.IDENTIFYING
          }
        >
          {state.identifications[column]?.type || "Select a type..."}
        </DropdownMenuTriggerWithCaret>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup
            value={state.identifications[column]?.type || ""}
            onValueChange={async (value) => {
              // Update column identification
              const selectedType = allTypes.find((type) => type.name === value);
              if (selectedType) {
                dispatch({
                  type: "setIdentification",
                  column: column,
                  identification: {
                    type: value,
                    description:
                      selectedType.description || `Manually set as ${value}`,
                  },
                });
                dispatch({
                  type: "setIdentificationStatus",
                  column,
                  status: IdentificationStatus.IDENTIFIED,
                });

                // Start Redis comparison for custom types
                if (selectedType.is_custom) {
                  const controller = new AbortController();
                  const typeKey = selectedType.id;
                  await handleCompareWithRedis(
                    column,
                    typeKey,
                    controller.signal
                  );
                }
              }
            }}
          >
            {allTypes.map((type) => (
              <DropdownMenuRadioItem key={type.name} value={type.name}>
                <div className="flex items-center justify-between w-full">
                  <span>{type.name}</span>
                  {type.is_custom && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                      Custom
                    </span>
                  )}
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
