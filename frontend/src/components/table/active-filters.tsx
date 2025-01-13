import { X } from "lucide-react";

import { useTableStore } from "@/stores/table-store";

import { Button } from "../ui/button";

interface ActiveFiltersProps {
  headers: string[];
}

export function ActiveFilters({ headers }: ActiveFiltersProps) {
  const { state, dispatch, actions } = useTableStore();

  const handleRemoveFilter = (column: number) => {
    dispatch(actions.removeFilter(column));
  };

  const handleClearAllFilters = () => {
    dispatch(actions.clearFilters());
  };

  if (state.activeFilters.length === 0) return null;

  return (
    <div className="relative top-[-50px] left-[-15px] bg-muted rounded-sm w-[calc(100%-65px)] overflow-scroll">
      <div className="flex items-center gap-2 p-2">
        <div className="text-sm text-muted-foreground">Active Filters:</div>
        <div className="flex flex-wrap gap-2">
          {state.activeFilters.map((filter) => {
            const identification = state.identifications[filter.column];
            if (!identification) return null;

            const filterName =
              filter.type === "valid-only" ? "Valid Values" : "Invalid Values";

            return (
              <Button
                key={filter.column}
                variant="secondary"
                size="sm"
                className="h-7 gap-2"
                onClick={() => handleRemoveFilter(filter.column)}
              >
                {headers[filter.column]}: {filterName}
                <X className="h-3 w-3" />
              </Button>
            );
          })}
          {state.activeFilters.length > 1 && (
            <Button
              variant="secondary"
              size="sm"
              className="h-7"
              onClick={handleClearAllFilters}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}