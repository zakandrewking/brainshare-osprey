import "./cell-renderer.css";

import { Identification, RedisStatus, Stats } from "@/stores/table-store";
import {
  isValidBoolean,
  isValidEnumValue,
  isValidNumber,
} from "@/utils/validation";

interface CellRendererProps {
  identification: Identification | undefined;
  redisStatus: RedisStatus | undefined;
  redisMatches: Set<string> | undefined;
  redisInfo: { link_prefix?: string } | undefined;
  stats: Stats | undefined;
}

// Helper function to append formatted value
function showValueOrEmpty(
  span: HTMLSpanElement,
  bar: HTMLDivElement,
  anchor: HTMLAnchorElement,
  value: string | null
) {
  span.style.display = "inline";
  anchor.style.display = "none";
  bar.style.display = "none";

  // reset span styles
  span.style.color = "unset";
  span.style.backgroundColor = "unset";
  if (value === null) {
    span.classList.add("empty");
    span.textContent = "[EMPTY]";
  } else {
    span.classList.remove("empty");
    span.textContent = value;
  }
}

export function createCellRenderer({
  identification,
  redisStatus,
  redisMatches,
  redisInfo,
  stats,
}: CellRendererProps) {
  return function cellRenderer(
    instance: any,
    td: HTMLTableCellElement,
    row: number,
    col: number,
    prop: any,
    value: any,
    cellProperties: any
  ) {
    const columnType = identification?.type;

    let span: HTMLSpanElement | null = null;
    let bar: HTMLDivElement | null = null;
    let anchor: HTMLAnchorElement | null = null;

    // generate cell content and bar on demand
    if (td.children.length === 0) {
      // span
      span = document.createElement("span");
      span.className = "cell-content";
      const textNode = document.createTextNode(value);
      span.appendChild(textNode);
      td.appendChild(span);

      // bar
      bar = document.createElement("div");
      bar.className = "cell-bar";
      td.appendChild(bar);

      // anchor
      anchor = document.createElement("a");
      anchor.className = "cell-link";
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      td.appendChild(anchor);
    } else {
      [span, bar, anchor] = Array.from(td.children) as [
        HTMLSpanElement,
        HTMLDivElement,
        HTMLAnchorElement
      ];
    }

    // for layout of children
    td.style.position = "relative";

    // Handle numeric columns (integers and decimals)
    if (columnType === "integer-numbers" || columnType === "decimal-numbers") {
      // Update content
      showValueOrEmpty(span, bar, anchor, value);
      anchor.style.display = "none";

      const numValue = parseFloat(value);

      // Update bar visualization if valid number with stats
      if (stats && !isNaN(numValue)) {
        const isPositive = numValue >= 0;
        const effectiveMin = stats.absoluteMin ?? stats.min;
        const effectiveMax = stats.absoluteMax ?? stats.max;
        const maxAbs = Math.max(Math.abs(effectiveMin), Math.abs(effectiveMax));

        // Check if value is within absolute bounds
        const isOutOfBounds =
          (stats.absoluteMin !== undefined && numValue < stats.absoluteMin) ||
          (stats.absoluteMax !== undefined && numValue > stats.absoluteMax);

        if (isOutOfBounds) {
          // Show red indicator for out of bounds
          bar.style.display = "block";
          bar.style.position = "absolute";
          bar.style.left = "unset";
          bar.style.right = "0";
          bar.style.top = "0";
          bar.style.bottom = "0";
          bar.style.width = "3px";
          bar.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
        } else {
          // Show normal bar visualization
          const percentage = (Math.abs(numValue) / maxAbs) * 50;
          bar.style.display = "block";
          bar.style.position = "absolute";
          bar.style.left = isPositive ? "50%" : "0";
          bar.style.right = "unset";
          bar.style.top = "0";
          bar.style.bottom = "0";
          bar.style.width = `${percentage}%`;
          bar.style.backgroundColor = isPositive
            ? "rgba(34, 197, 94, 0.1)"
            : "rgba(239, 68, 68, 0.1)";
        }
      } else if (!isValidNumber(value, columnType)) {
        // Update indicator for invalid values
        bar.style.display = "block";
        bar.style.position = "absolute";
        bar.style.left = "unset";
        bar.style.right = "0";
        bar.style.top = "0";
        bar.style.bottom = "0";
        bar.style.width = "3px";
        bar.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
      } else {
        bar.style.display = "none";
      }

      return td;
    }

    // Handle boolean columns
    if (columnType === "boolean-values") {
      // Update content
      showValueOrEmpty(span, bar, anchor, value);

      if (value && isValidBoolean(value)) {
        const lowerValue = value.toString().toLowerCase();
        if (["true", "t", "y", "1"].includes(lowerValue)) {
          span.style.color = "rgba(34, 197, 94, 0.8)";
          bar.style.display = "none";
        } else if (["false", "f", "n", "0"].includes(lowerValue)) {
          span.style.color = "rgba(239, 68, 68, 0.8)";
          bar.style.display = "none";
        }
      } else {
        // Update indicator for invalid values
        bar.style.display = "block";
        bar.style.position = "absolute";
        bar.style.left = "unset";
        bar.style.right = "0";
        bar.style.top = "0";
        bar.style.bottom = "0";
        bar.style.width = "3px";
        bar.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
      }

      return td;
    }

    // Handle enum values
    if (columnType === "enum-values") {
      // Update content
      showValueOrEmpty(span, bar, anchor, value);

      // const columnData = instance.getDataAtCol(col);
      const isValid = isValidEnumValue(value, []);

      // Update indicator
      bar.style.display = "block";
      bar.style.position = "absolute";
      bar.style.left = "unset";
      bar.style.right = "0";
      bar.style.top = "0";
      bar.style.bottom = "0";
      bar.style.width = "3px";
      bar.style.backgroundColor = isValid
        ? "rgba(34, 197, 94, 0.2)"
        : "rgba(239, 68, 68, 0.2)";

      return td;
    }

    // Handle Redis matches
    if (redisStatus === RedisStatus.MATCHED && redisMatches && redisInfo) {
      const isMatch = redisMatches.has(value);
      const linkPrefix = redisInfo.link_prefix;

      if (isMatch && linkPrefix) {
        span.style.display = "none";
        anchor.style.display = "inline";
        // TODO links are expensive to render, so we can instead simulate them
        // with a click event on the span
        anchor.href = `${linkPrefix}${value}`;
        anchor.textContent = `${value} ↗`;
      } else {
        showValueOrEmpty(span, bar, anchor, value);
      }

      // Update indicator
      bar.style.display = "block";
      bar.style.position = "absolute";
      bar.style.left = "unset";
      bar.style.right = "0";
      bar.style.top = "0";
      bar.style.bottom = "0";
      bar.style.width = "3px";
      bar.style.backgroundColor = isMatch
        ? "rgba(34, 197, 94, 0.2)"
        : "rgba(239, 68, 68, 0.2)";

      return td;
    }

    // fallback to basic text
    showValueOrEmpty(span, bar, anchor, value);
    return td;
  };
}
