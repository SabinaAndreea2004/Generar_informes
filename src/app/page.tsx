"use client";

import dynamic from "next/dynamic";

const DashboardShell = dynamic(
  () => import("@/components/DashboardShell"),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <DashboardShell />
    </main>
  );
}
