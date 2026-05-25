"use client";

import dynamic from "next/dynamic";

const SinglePageDashboard = dynamic(
  () => import("@/components/SinglePageDashboard"),
  { ssr: false }
);

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <SinglePageDashboard />
    </main>
  );
}
