/**
 * NOTE: CMD-C copy does not work in Chrome Canary with handsontable
 */

"use client";

import "./csv-table.css";
import "handsontable/styles/handsontable.css";
import "handsontable/styles/ht-theme-main.css";

import React from "react";

import { registerAllModules } from "handsontable/registry";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { HotTable } from "@handsontable/react-wrapper";

import { compareColumnWithRedis } from "@/actions/compare-column";
import {
  ColumnIdentification,
  identifyColumn,
} from "@/actions/identify-column";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ACCEPTABLE_TYPES } from "@/utils/column-types";

import { ColumnStats, createCellRenderer } from "./table/cell-renderer";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

registerAllModules();

interface CSVTableProps {
  setHasHeader: (hasHeader: boolean) => void;
  hasHeader: boolean;
  headers: string[];
  parsedData: any[][];
}

interface ResourceInfo {
  description: string;
  link: string;
  link_prefix: string;
}

// const openai = new OpenAI({
//   apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
//   dangerouslyAllowBrowser: true,
// });

function isProteinColumn(header: string): boolean {
  const proteinPatterns = [
    /protein/i,
    /prot[\s_-]?id/i,
    /protein[\s_-]?identifier/i,
  ];
  return proteinPatterns.some((pattern) => pattern.test(header));
}

interface PopoverState {
  column: number;
  rect: { left: number; bottom: number };
}

export default function CSVTable({
  setHasHeader,
  hasHeader,
  headers,
  parsedData,
}: CSVTableProps) {
  const { theme } = useTheme();
  const hasSystemDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  /**
   * Tracks the Redis match status for each column after type identification.
   * Key: Column index
   * TODO what if we are allowing column reordering?
   * Value: Object containing:
   *   - matches: Number of values found in Redis
   *   - total: Total number of values in the column
   */
  const [columnRedisStatus, setColumnRedisStatus] = React.useState<
    Record<number, { matches: number; total: number }>
  >({});

  const [columnStats, setColumnStats] = React.useState<
    Record<number, ColumnStats>
  >({});
  const [columnIdentifications, setColumnIdentifications] = React.useState<
    Record<number, ColumnIdentification>
  >({});

  const [columnRedisMatches, setColumnRedisMatches] = React.useState<
    Record<number, Set<string>>
  >({});
  const [columnRedisInfo, setColumnRedisInfo] = React.useState<
    Record<number, { link_prefix?: string }>
  >({});

  const [popoverState, setPopoverState] = React.useState<PopoverState | null>(
    null
  );

  const [identifyingColumns, setIdentifyingColumns] = React.useState<
    Set<number>
  >(new Set());

  //   const handleDetectDisplayCode = async (columnIndex: number) => {
  //     try {
  //       const columnName = headers[columnIndex];
  //       const firstFiveRows = parsedData
  //         .slice(0, 5)
  //         .map((row) => row[columnIndex]);

  //       const prompt = `Analyze this column of data:
  // Column name: ${columnName}
  // First 5 values: ${firstFiveRows.join(", ")}

  // Please provide a brief summary of what type of data this appears to be and any patterns you notice.`;

  //       // const completion = await openai.chat.completions.create({
  //       //   messages: [{ role: "user", content: prompt }],
  //       //   model: "gpt-3.5-turbo",
  //       // });

  //       // const summary = completion.choices[0]?.message?.content;
  //       // console.log(`Analysis for column "${columnName}":`);
  //       // console.log(summary);

  //       // TODO
  //       // https://github.com/TanStack/table/issues/3636

  //       toast.success("Analysis complete! Check the console for details.");
  //     } catch (error) {
  //       console.error("Error analyzing column:", error);
  //       toast.error("Failed to analyze column");
  //     }
  //   };

  // Function to calculate stats for a column
  const calculateColumnStats = React.useCallback((data: any[]): ColumnStats => {
    const numbers = data
      .map((val) => (typeof val === "string" ? parseFloat(val) : val))
      .filter((num) => !isNaN(num));

    return {
      min: Math.min(...numbers),
      max: Math.max(...numbers),
    };
  }, []);

  // Update column stats when column is identified as numeric
  React.useEffect(() => {
    Object.entries(columnIdentifications).forEach(([col, identification]) => {
      const colIndex = parseInt(col);
      if (
        (identification.type === "integer-numbers" ||
          identification.type === "decimal-numbers") &&
        !columnStats[colIndex]
      ) {
        const columnData = parsedData.map((row) => row[colIndex]);
        setColumnStats((prev) => ({
          ...prev,
          [colIndex]: calculateColumnStats(columnData),
        }));
      }
    });
  }, [columnIdentifications, parsedData, calculateColumnStats, columnStats]);

  // Fix a bug where the theme class is not being applied by HotTable
  const fixTheme = React.useCallback(() => {
    Array.from(document.getElementsByClassName("ht-wrapper")).forEach((el) => {
      el.classList.remove("ht-theme-main-dark");
      el.classList.remove("ht-theme-main");
      el.classList.add(
        theme === "dark" || (theme === "system" && hasSystemDarkMode)
          ? "ht-theme-main-dark"
          : "ht-theme-main"
      );
    });
  }, [theme, hasSystemDarkMode]);
  React.useEffect(() => {
    fixTheme();
  }, [theme]);
  React.useEffect(() => {
    fixTheme();
  }, [hasSystemDarkMode]);
  React.useEffect(() => {
    const timeout = setTimeout(fixTheme, 200);
    return () => clearTimeout(timeout);
  }, []);

  const toggleHeader = () => {
    setHasHeader(!hasHeader);
    setColumnStats({});
  };

  const handleIdentifyColumn = async (column: number) => {
    try {
      setIdentifyingColumns((prev) => new Set(prev).add(column));
      const columnName = headers[column];
      const sampleValues = parsedData.slice(0, 10).map((row) => row[column]);

      const identification = await identifyColumn(columnName, sampleValues);
      setColumnIdentifications((prev) => ({
        ...prev,
        [column]: identification,
      }));

      // After identifying the column, check Redis if it's a known type
      if (identification.type !== "unknown") {
        const columnValues = parsedData.map((row) => row[column]);
        const redisResult = await compareColumnWithRedis(
          columnValues,
          identification.type
        );
        setColumnRedisStatus((prev) => ({
          ...prev,
          [column]: {
            matches: redisResult.matches.length,
            total: columnValues.length,
          },
        }));
        // Store the actual matching values for cell styling
        setColumnRedisMatches((prev) => ({
          ...prev,
          [column]: new Set(redisResult.matches),
        }));
        // Store the resource info for link generation
        setColumnRedisInfo((prev) => ({
          ...prev,
          [column]: redisResult.info,
        }));
      }

      toast.success(
        <div>
          <p className="font-semibold">{identification.type}</p>
          <p className="text-sm text-muted-foreground">
            {identification.description}
          </p>
        </div>
      );
    } catch (error) {
      console.error("Error identifying column:", error);
      toast.error("Failed to identify column");
    } finally {
      setIdentifyingColumns((prev) => {
        const next = new Set(prev);
        next.delete(column);
        return next;
      });
    }
  };

  const handleCompareWithRedis = async (column: number) => {
    try {
      const columnValues = parsedData.map((row) => row[column]);
      const setKey = headers[column]; // Using header as the Redis set key

      const result = await compareColumnWithRedis(columnValues, setKey);

      toast.success(`Comparison Results:
        ${result.matches.length} matches found
        ${result.missingInRedis.length} values missing in Redis
        ${result.missingInColumn.length} values missing in column`);

      console.log("Detailed results:", result);
    } catch (error) {
      toast.error("Failed to compare with Redis");
    }
  };

  const afterGetColHeader = (column: number, TH: HTMLTableCellElement) => {
    if (!TH) return;

    // Clear existing content
    while (TH.firstChild) {
      TH.removeChild(TH.firstChild);
    }

    // Create container div
    const container = document.createElement("div");
    container.className = "flex items-center justify-between px-2 py-1";

    // Create text span
    const textSpan = document.createElement("span");
    textSpan.textContent = headers[column] || `Column ${column + 1}`;
    container.appendChild(textSpan);

    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "flex items-center gap-1";

    // Add loading indicator or status icon
    if (identifyingColumns.has(column)) {
      const loadingIcon = document.createElement("span");
      loadingIcon.innerHTML =
        '<div class="w-4 h-4"><div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div></div>';
      loadingIcon.title = "Identifying column type...";
      buttonContainer.appendChild(loadingIcon);
    } else if (columnIdentifications[column]) {
      const type = columnIdentifications[column].type;
      const statusIcon = document.createElement("span");

      if (columnRedisStatus[column]?.matches > 0) {
        // Show green checkmark for Redis matches
        statusIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><path d="M20 6L9 17l-5-5"/></svg>`;
        statusIcon.title = `${columnRedisStatus[column].matches} out of ${columnRedisStatus[column].total} values found in Redis`;
      } else if (ACCEPTABLE_TYPES.includes(type as any)) {
        // Show green checkmark for acceptable types
        statusIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><path d="M20 6L9 17l-5-5"/></svg>`;
        statusIcon.title = `Identified as ${type}`;
      } else {
        // Show red X for unknown or unsupported types
        statusIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        statusIcon.title = `Unknown or unsupported type: ${type}`;
      }

      buttonContainer.appendChild(statusIcon);
    }

    // Add menu button
    const menuButton = document.createElement("button");
    menuButton.textContent = "...";
    menuButton.className =
      "px-2 py-1 text-xs bg-transparent hover:bg-gray-200 rounded";
    menuButton.addEventListener("pointerdown", (e) => {
      // capture the pointer event before it reaches onPointerDownOutside in
      // PopoverContent
      e.stopPropagation();
    });
    menuButton.addEventListener("mousedown", (e) => {
      // capture the mouse event before it reaches the table
      e.stopPropagation();
    });
    menuButton.addEventListener("click", (e) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const tableRect =
        TH.closest(".handsontable")?.getBoundingClientRect() ?? new DOMRect();

      // If clicking the same column, close it
      if (popoverState?.column === column) {
        setPopoverState(null);
        return;
      }

      // Update position and column
      setPopoverState({
        column,
        rect: {
          left: rect.left - tableRect.left,
          bottom: rect.bottom - tableRect.top,
        },
      });
    });

    buttonContainer.appendChild(menuButton);
    container.appendChild(buttonContainer);
    TH.appendChild(container);
  };

  if (!parsedData.length) return <div>Loading...</div>;

  return (
    <div className="relative w-full">
      <div className="mb-4">
        <Button onClick={toggleHeader} variant="ghost">
          {hasHeader ? "Disable Header Row" : "Enable Header Row"}
        </Button>
      </div>

      {popoverState && (
        <Popover
          key={popoverState.column}
          defaultOpen={true}
          onOpenChange={(open) => !open && setPopoverState(null)}
        >
          <PopoverTrigger asChild>
            <div
              style={{
                position: "absolute",
                visibility: "hidden",
              }}
            />
          </PopoverTrigger>
          <PopoverContent
            style={{
              position: "fixed",
              top: "0px",
              left: "0px",
              transform: `translate(${popoverState.rect.left}px, ${popoverState.rect.bottom}px)`,
            }}
            className="w-80 [&[data-state=open]]:animate-none [&[data-state=closed]]:animate-none"
            sideOffset={0}
            collisionPadding={20}
            onFocusOutside={(e) => {
              // This is hard to prevent in external components, so we'll just
              // disabled the feature
              e.preventDefault();
            }}
          >
            <div className="space-y-4">
              {columnIdentifications[popoverState.column] && (
                <div className="space-y-2">
                  <h4 className="font-medium">
                    {columnIdentifications[popoverState.column].type}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {columnIdentifications[popoverState.column].description}
                  </p>
                </div>
              )}

              {columnRedisStatus[popoverState.column]?.matches > 0 &&
                columnRedisInfo[popoverState.column] && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      Resource Information
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {`${
                        columnRedisStatus[popoverState.column].matches
                      } out of ${
                        columnRedisStatus[popoverState.column].total
                      } values found`}
                    </div>
                    {columnRedisInfo[popoverState.column].link_prefix && (
                      <a
                        href={columnRedisInfo[popoverState.column].link_prefix}
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
                    )}
                  </div>
                )}

              <Button
                onClick={() => handleIdentifyColumn(popoverState.column)}
                variant="secondary"
                className="w-full"
              >
                Identify column type
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <HotTable
        // themeName={theme === "dark" ? "ht-theme-main-dark" : "ht-theme-main"}
        data={parsedData}
        colWidths={100}
        width="100%"
        colHeaders={headers}
        rowHeaders={true}
        manualColumnResize={false}
        manualRowResize={false}
        readOnly={true}
        // height="auto" // don't use this; too slow
        rowHeights={24}
        wordWrap={false}
        autoWrapRow={false}
        autoWrapCol={false}
        contextMenu={["copy", "cut"]}
        licenseKey="non-commercial-and-evaluation"
        afterGetColHeader={afterGetColHeader}
        cells={(row: number, col: number) => ({
          renderer: createCellRenderer({
            columnIdentifications,
            columnRedisStatus,
            columnRedisMatches,
            columnRedisInfo,
            columnStats,
          }),
        })}
      />
    </div>
  );
}
