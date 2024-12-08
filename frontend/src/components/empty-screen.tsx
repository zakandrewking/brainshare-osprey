import Image from "next/image";

import robotCsv from "./robot-csv.png";

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <Image src={robotCsv} alt="robot-csv" className="w-56" priority />
      <div className="text-2xl font-bold mt-4">
        The best place to share your scientific data.
      </div>
    </div>
  );
}
