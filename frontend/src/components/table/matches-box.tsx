import { isValidBoolean, isValidNumber } from "@/utils/validation";

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-2 p-3 bg-muted/50 rounded-lg flex items-center gap-2 text-sm">
      {children}
    </div>
  );
}

export default function MatchesBox({
  type,
  redisData,
  columnData,
  min,
  max,
}: {
  type: string;
  redisData: { matches: number; total: number };
  columnData: any[];
  min?: number;
  max?: number;
}) {
  if (redisData?.matches && redisData.matches > 0) {
    return (
      <Box>{`${redisData.matches} of ${redisData.total} values found in Redis`}</Box>
    );
  }

  if (type === "integer-numbers" || type === "decimal-numbers") {
    const validValues = columnData.filter((value) =>
      isValidNumber(value, type, min, max)
    );
    const rangeText =
      min !== undefined || max !== undefined
        ? ` (${min !== undefined ? `min: ${min}` : ""}${
            min !== undefined && max !== undefined ? ", " : ""
          }${max !== undefined ? `max: ${max}` : ""})`
        : "";
    return (
      <Box>{`${validValues.length} of ${columnData.length} values are valid ${
        type === "integer-numbers" ? "integers" : "decimals"
      }${rangeText}`}</Box>
    );
  }

  if (type === "enum-values") {
    const nonEmptyValues = columnData.filter(
      (value) => value !== null && value !== undefined && value !== ""
    );
    const uniqueValues = new Set(nonEmptyValues);
    return (
      <Box>{`${uniqueValues.size} unique values across ${nonEmptyValues.length} non-empty values`}</Box>
    );
  }

  if (type === "boolean-values") {
    const validValues = columnData.filter((value) => isValidBoolean(value));
    return (
      <Box>{`${validValues.length} of ${columnData.length} values are valid booleans`}</Box>
    );
  }

  return <></>;
}