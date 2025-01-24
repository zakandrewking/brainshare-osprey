import { create } from "zustand";

import { applyEdits } from "@/utils/tables";

export type Edit =
  | { edit: "deleteRow"; row: number }
  | { edit: "deleteColumn"; column: number }
  | { edit: "edit"; column?: number; row?: number; value?: string };

interface EditState {
  rawData: string | null;
  headers: string[] | null;
  parsedData: string[][];
  filteredData: string[][];
  edits: Edit[];
}

interface EditActions {
  reset: () => void;
  setHeaders: (headers: string[]) => void;
  setParsedData: (parsedData: string[][]) => void;
  setFilteredData: (filteredData: string[][]) => void;
  deleteRow: (row: number) => void;
  deleteColumn: (column: number) => void;
}

const initialState: EditState = {
  rawData: "",
  headers: [],
  parsedData: [],
  filteredData: [],
  edits: [],
};

export type EditStore = EditState & EditActions;

// IMPORTANT: If starting state is non-deterministic or user-specific, we need
// to create & new store with every request (use React Context):
// - https://github.com/pmndrs/zustand/discussions/2326#discussioncomment-10102892
// - https://zustand.docs.pmnd.rs/guides/nextjs
export const useEditStore = create<EditStore>((set) => ({
  ...initialState,

  reset: () => set(initialState),

  setHeaders: (headers) => set({ headers }),

  setParsedData: (parsedData) => set({ parsedData }),

  setFilteredData: (filteredData) => set({ filteredData }),

  deleteRow: (row) =>
    set((state) => {
      const edit = { edit: "deleteRow" as const, row };
      const { parsedData, filteredData } = applyEdits(
        state.parsedData,
        state.filteredData,
        [edit]
      );
      return {
        parsedData,
        filteredData,
        edits: [...state.edits, edit],
      };
    }),

  deleteColumn: (column) =>
    set((state) => {
      const edit = { edit: "deleteColumn" as const, column };
      const { parsedData, filteredData } = applyEdits(
        state.parsedData,
        state.filteredData,
        [edit]
      );
      return {
        parsedData,
        filteredData,
        edits: [...state.edits, edit],
      };
    }),
}));
