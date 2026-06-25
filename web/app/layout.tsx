import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    default: "CDS Open — university data explorer",
    template: "%s | CDS Open",
  },
  description:
    "Explore Common Data Set reports from 44 U.S. universities. Compare any school to peer group means across admissions, tuition, financial aid, and outcomes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-ink-100 bg-white/80 backdrop-blur sticky top-0 z-20">
          <div className="container-page flex h-14 items-center justify-between">
            <Link href="/" className="flex items-baseline gap-1.5 font-semibold text-ink-800">
              <span className="text-accent">CDS</span>
              <span className="hidden sm:inline">Open</span>
              <span className="sr-only">Home</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/explore" className="rounded px-2.5 py-1.5 text-ink-700 hover:bg-ink-50">
                Explore
              </Link>
              <Link href="/compare/stanford" className="rounded px-2.5 py-1.5 text-ink-700 hover:bg-ink-50">
                Compare
              </Link>
              <a
                href="https://github.com/mzrascoff/cds-open"
                className="rounded px-2.5 py-1.5 text-ink-500 hover:bg-ink-50"
              >
                GitHub
              </a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="mt-16 border-t border-ink-100 bg-white">
          <div className="container-page py-8 text-xs text-ink-500">
            <p>
              Source data: Common Data Set reports from each institution, parsed by{" "}
              <a className="underline hover:text-ink-700" href="https://github.com/mzrascoff/cds-open">
                cds-open
              </a>
              .
            </p>
            <p className="mt-1">
              CDS data remains the intellectual property of each respective institution; this site is for non-commercial educational/research use.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
