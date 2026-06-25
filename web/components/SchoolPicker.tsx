"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useRef } from "react";
import type { SchoolMeta } from "@/lib/data/types";
import clsx from "clsx";

interface Props {
  schools: SchoolMeta[];
  current: string;
  hrefBuilder?: (slug: string) => string;
  className?: string;
}

export default function SchoolPicker({
  schools,
  current,
  hrefBuilder = (slug) => `/compare/${slug}`,
  className,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return schools;
    return schools.filter((s) => s.display.toLowerCase().includes(needle));
  }, [q, schools]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const currentMeta = schools.find((s) => s.slug === current);

  function pick(slug: string) {
    setOpen(false);
    setQ("");
    router.push(hrefBuilder(slug));
  }

  return (
    <div ref={containerRef} className={clsx("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-w-[180px] items-center justify-between gap-2 rounded-lg border border-ink-300 bg-white px-3 py-2 text-left text-sm font-medium text-ink-800 hover:border-ink-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      >
        <span className="truncate">{currentMeta?.display ?? "Pick a school"}</span>
        <svg
          aria-hidden
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={clsx("text-ink-400 transition", open && "rotate-180")}
        >
          <path d="M5.25 7.5l4.75 4.75L14.75 7.5z" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-[60vh] overflow-hidden rounded-lg border border-ink-200 bg-white shadow-lg sm:max-h-[420px]">
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search schools…"
            className="w-full border-b border-ink-100 px-3 py-2 text-sm outline-none placeholder:text-ink-400"
          />
          <ul className="max-h-[50vh] overflow-y-auto sm:max-h-[360px]">
            {filtered.map((s) => (
              <li key={s.slug}>
                <button
                  type="button"
                  onClick={() => pick(s.slug)}
                  className={clsx(
                    "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-ink-50",
                    s.slug === current && "bg-accent-soft text-accent-dark",
                  )}
                >
                  <span>{s.display}</span>
                  <span className="text-[11px] uppercase tracking-wide text-ink-400">
                    {s.type}
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-ink-400">No matches</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
