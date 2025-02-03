/**
 * Load CSV data from GitHub
 */

"use client";

import React from "react";

import CSVTable from "@/components/csv-table";
import { MiniLoadingSpinner } from "@/components/mini-loading-spinner";
import { useAsyncEffect } from "@/hooks/use-async-effect";
import { editStoreHooks as editHooks } from "@/stores/edit-store";
// import { useIdentificationStoreHooks } from "@/stores/identification-store";
import { parseCsv } from "@/utils/csv";

interface GitHubTableProps {
  url: string;
  prefixedId: string;
}

export default function GitHubTable({ url, prefixedId }: GitHubTableProps) {
  const [isLoading, setIsLoading] = React.useState(true);

  // edit store
  const prefixedIdFromStore = editHooks.usePrefixedId();
  const resetWithPrefixedId = editHooks.useResetWithPrefixedId();
  const setData = editHooks.useSetData();

  // // identification store
  // const idHooks = useIdentificationStoreHooks();
  // const idStoreLoadWithPrefixedId = idHooks.useLoadWithPrefixedId();

  useAsyncEffect(
    async () => {
      // if we've already loaded this table, don't load it again
      if (prefixedIdFromStore === prefixedId) {
        setIsLoading(false);
        return;
      }

      resetWithPrefixedId(prefixedId);
      const response = await fetch(url, {
        headers: {
          // Range: "bytes=0-5000",
        },
      });
      const data = await response.text();
      const { headers, parsedData } = await parseCsv(data);
      setData({
        headers,
        parsedData,
      });
      setIsLoading(false);
    },
    async () => {},
    [url]
  );

  // useEffect(() => {
  //   // start loading identifications & widgets; if the prefixed ID is already
  //   // loaded, this will do nothing
  //   idStoreLoadWithPrefixedId(prefixedId);
  // }, [idStoreLoadWithPrefixedId, prefixedId]);

  if (isLoading) {
    return <MiniLoadingSpinner />;
  }

  return <CSVTable prefixedId={prefixedId} />;
}
