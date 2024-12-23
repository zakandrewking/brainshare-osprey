"use client";

import React from "react";

import Papa, { ParseResult } from "papaparse";

import CSVTable from "@/components/csv-table";
import { useAsyncEffect } from "@/hooks/use-async-effect";
import supabase from "@/utils/supabase/client";
import { detectHeaderRow } from "@/utils/tables";

interface FileTableProps {
  bucketId: string;
  objectPath: string;
}

export default function FileTable({ bucketId, objectPath }: FileTableProps) {
  const [rawData, setRawData] = React.useState<Array<Array<string>>>([]);
  const [hasHeader, setHasHeader] = React.useState<boolean>(true);
  const [headers, setHeaders] = React.useState<Array<string>>([]);
  const [parsedData, setParsedData] = React.useState<Array<Array<string>>>([]);

  const updateTableData = (rows: string[][], headerEnabled: boolean) => {
    if (headerEnabled && rows.length > 0) {
      setHeaders(rows[0]);
      setParsedData(rows.slice(1));
    } else {
      setHeaders(Array(rows[0]?.length || 0).fill(""));
      setParsedData(rows);
    }
  };

  React.useEffect(() => {
    updateTableData(rawData, hasHeader);
  }, [hasHeader]);

  useAsyncEffect(
    async () => {
      const { data: signedUrl } = await supabase.storage
        .from(bucketId)
        .createSignedUrl(objectPath, 60);

      if (!signedUrl?.signedUrl) {
        throw new Error("Failed to get signed URL");
      }

      const response = await fetch(signedUrl.signedUrl, {
        headers: {
          //   Range: "bytes=0-5000", // Only get first 5KB for initial load
        },
      });

      const data = await response.text();
      Papa.parse(data, {
        complete: (results: ParseResult<string[]>) => {
          const rows = results.data;
          setRawData(rows);
          const detectedHeader = detectHeaderRow(rows);
          setHasHeader(detectedHeader);
          updateTableData(rows, detectedHeader);
        },
      });
    },
    async () => {},
    [bucketId, objectPath]
  );

  return (
    <CSVTable hasHeader={hasHeader} headers={headers} parsedData={parsedData} />
  );
}
