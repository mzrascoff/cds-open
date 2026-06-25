"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { PeerGroup } from "@/lib/data/types";
import clsx from "clsx";

interface Props {
  groups: PeerGroup[];
  current: string;
}

export default function PeerGroupToggle({ groups, current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function setGroup(id: string) {
    const params = new URLSearchParams(sp);
    params.set("peers", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-ink-500">Compared to:</span>
      <div className="inline-flex flex-wrap rounded-lg border border-ink-200 bg-white p-0.5">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGroup(g.id)}
            className={clsx(
              "rounded-md px-2.5 py-1 font-medium transition",
              g.id === current
                ? "bg-ink-800 text-white"
                : "text-ink-600 hover:bg-ink-50",
            )}
          >
            {g.label}
          </button>
        ))}
      </div>
    </div>
  );
}
