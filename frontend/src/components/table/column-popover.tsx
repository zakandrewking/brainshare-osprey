"use client";

import React from "react";

import { CircleAlert } from "lucide-react";

import { type User } from "@supabase/supabase-js";

import {
  IdentificationStatus,
  type IdentificationStoreActions,
  type IdentificationStoreDispatch,
  type IdentificationStoreState,
  RedisStatus,
} from "@/stores/identification-store";
import { createClient } from "@/utils/supabase/client";
import { logInRedirect } from "@/utils/url";

import { type CustomTypeContext } from "../custom-type/custom-type-form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { InternalLink } from "../ui/link";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Switch } from "../ui/switch";
import { FilterButtons } from "./filter-buttons";
import { PopoverState } from "./header-renderer";
import { ManualTypeSelector } from "./manual-type-selector";
import MatchesBox from "./matches-box";

interface ColumnPopoverProps {
  state: IdentificationStoreState;
  popoverState: PopoverState;
  parsedData: any[][];
  headers: string[];
  prefixedId: string;
  isLoadingIdentifications: boolean;
  hotRef: React.RefObject<any>;
  dispatch: IdentificationStoreDispatch;
  actions: IdentificationStoreActions;
  onPopoverClose: () => void;
  onCustomTypeClick: (context: CustomTypeContext) => void;
  handleCompareWithRedis: (
    column: number,
    typeId: string,
    signal: AbortSignal
  ) => Promise<void>;
  handleIdentifyColumn: (column: number, signal: AbortSignal) => Promise<void>;
  pathname: string;
}

export function ColumnPopover({
  state,
  popoverState,
  parsedData,
  headers,
  prefixedId,
  isLoadingIdentifications,
  hotRef,
  dispatch,
  actions,
  onPopoverClose,
  onCustomTypeClick,
  handleCompareWithRedis,
  handleIdentifyColumn,
  pathname,
}: ColumnPopoverProps) {
  const supabase = createClient();
  const [user, setUser] = React.useState<User | null | undefined>(undefined);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, [supabase]);

  return (
    <Popover
      key={popoverState.column}
      defaultOpen={true}
      onOpenChange={(open) => !open && onPopoverClose()}
    >
      <PopoverTrigger asChild>
        <div
          id="popover-trigger"
          style={{
            position: "fixed",
            left: popoverState.rect.left,
            top: popoverState.rect.top + 28,
          }}
        />
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        sideOffset={5}
        collisionPadding={20}
        side="bottom"
        align="start"
        onFocusOutside={(e) => {
          e.preventDefault();
        }}
      >
        {user === undefined ? (
          <></>
        ) : user === null ? (
          <InternalLink href={logInRedirect(pathname)}>
            Log in to edit columns
          </InternalLink>
        ) : (
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-4 space-y-4">
            {state.identifications[popoverState.column] && (
              <>
                {state.identificationStatus[popoverState.column] ===
                  IdentificationStatus.DELETED && (
                  <div className="flex items-center gap-2 p-3 text-sm text-destructive-foreground">
                    <CircleAlert className="h-6 w-6 text-red-500" />
                    <span>This custom type no longer exists.</span>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">
                      {state.identifications[popoverState.column]?.type}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {state.identifications[popoverState.column]?.description}
                    </p>

                    {/* Custom type link */}
                    {state.identifications[popoverState.column]?.id && (
                      <InternalLink
                        href={`/type/${
                          state.identifications[popoverState.column]?.name
                        }`}
                        disabled={
                          state.identificationStatus[popoverState.column] ===
                          IdentificationStatus.DELETED
                        }
                      >
                        View Custom Type
                      </InternalLink>
                    )}
                  </div>

                  <MatchesBox
                    identification={state.identifications[popoverState.column]}
                    redisData={state.redisMatchData[popoverState.column]}
                    columnData={parsedData.map(
                      (row) => row[popoverState.column]
                    )}
                    min={
                      state.typeOptions[popoverState.column]?.min ?? undefined
                    }
                    max={
                      state.typeOptions[popoverState.column]?.max ?? undefined
                    }
                  />

                  <FilterButtons column={popoverState.column} />
                </div>
              </>
            )}

            {/* Redis match info */}
            {state.redisInfo[popoverState.column]?.link && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Resource Information</div>
                <a
                  href={state.redisInfo[popoverState.column]?.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                >
                  View Resource
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </div>
            )}

            <ManualTypeSelector
              column={popoverState.column}
              isLoadingIdentifications={isLoadingIdentifications}
              handleCompareWithRedis={handleCompareWithRedis}
            />

            {/* Absolute bounds controls for numeric columns */}
            {state.identifications[popoverState.column]?.type ===
              "integer-numbers" ||
            state.identifications[popoverState.column]?.type ===
              "decimal-numbers" ? (
              <div className="space-y-2">
                <div className="text-sm font-medium">Absolute Bounds</div>
                {state.stats[popoverState.column] && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">
                          Min
                        </label>
                        <Input
                          type="number"
                          step={
                            state.identifications[popoverState.column]?.type ===
                            "integer-numbers"
                              ? "1"
                              : "any"
                          }
                          value={
                            state.typeOptions[popoverState.column]?.min ?? ""
                          }
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? null
                                : state.identifications[popoverState.column]
                                    ?.type === "integer-numbers"
                                ? Math.round(Number(e.target.value))
                                : Number(e.target.value);
                            dispatch(
                              actions.setOptionMin(popoverState.column, value)
                            );
                            // Force re-render of all cells in the column
                            if (hotRef.current?.hotInstance) {
                              hotRef.current.hotInstance.render();
                            }
                          }}
                          placeholder={"−∞"}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">
                          Max
                        </label>
                        <Input
                          type="number"
                          step={
                            state.identifications[popoverState.column]?.type ===
                            "integer-numbers"
                              ? "1"
                              : "any"
                          }
                          value={
                            state.typeOptions[popoverState.column]?.max ?? ""
                          }
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? null
                                : state.identifications[popoverState.column]
                                    ?.type === "integer-numbers"
                                ? Math.round(Number(e.target.value))
                                : Number(e.target.value);
                            dispatch(
                              actions.setOptionMax(popoverState.column, value)
                            );
                            // Force re-render of all cells in the column
                            if (hotRef.current?.hotInstance) {
                              hotRef.current.hotInstance.render();
                            }
                          }}
                          placeholder={"∞"}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={
                          state.typeOptions[popoverState.column]?.logarithmic ??
                          false
                        }
                        onCheckedChange={(checked) => {
                          dispatch(
                            actions.setOptionLogarithmic(
                              popoverState.column,
                              checked
                            )
                          );
                          // Force re-render of all cells in the column
                          if (hotRef.current?.hotInstance) {
                            hotRef.current.hotInstance.render();
                          }
                        }}
                      />
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Use logarithmic scale
                      </label>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            <div className="pt-4 border-t">
              <Button
                onClick={() => {
                  const columnValues = parsedData.map(
                    (row) => row[popoverState.column]
                  );
                  // Map the current identification type to a custom type kind
                  const currentType =
                    state.identifications[popoverState.column]?.type;
                  let initialKind: "decimal" | "integer" | "enum" = "enum";
                  if (currentType === "decimal-numbers") {
                    initialKind = "decimal";
                  } else if (currentType === "integer-numbers") {
                    initialKind = "integer";
                  }
                  // Set the context and open the modal
                  onCustomTypeClick({
                    columnIndex: popoverState.column,
                    columnName: headers[popoverState.column] ?? "",
                    allValues: columnValues,
                    prefixedId,
                    initialKind,
                    initialMinValue:
                      state.typeOptions[popoverState.column]?.min ?? undefined,
                    initialMaxValue:
                      state.typeOptions[popoverState.column]?.max ?? undefined,
                    initialLogScale:
                      state.typeOptions[popoverState.column]?.logarithmic,
                  });
                }}
                variant="secondary"
                className="w-full mb-2"
                disabled={
                  isLoadingIdentifications ||
                  state.identificationStatus[popoverState.column] ===
                    IdentificationStatus.IDENTIFYING ||
                  state.redisStatus[popoverState.column] ===
                    RedisStatus.MATCHING
                }
              >
                Create a new type for this column
              </Button>

              <Button
                onClick={() => {
                  const controller = new AbortController();
                  handleIdentifyColumn(popoverState.column, controller.signal);
                }}
                variant="secondary"
                className="w-full"
                disabled={
                  isLoadingIdentifications ||
                  state.identificationStatus[popoverState.column] ===
                    IdentificationStatus.IDENTIFYING ||
                  state.redisStatus[popoverState.column] ===
                    RedisStatus.MATCHING
                }
              >
                Auto-identify column type
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
