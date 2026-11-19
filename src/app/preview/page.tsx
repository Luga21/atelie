"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PreviewShell } from "@/features/preview/PreviewShell";

function PreviewRoute() {
  const params = useSearchParams();
  return <PreviewShell courseId={params.get("id")} lessonId={params.get("lesson")} />;
}

export default function PreviewPage() {
  return (
    <Suspense>
      <PreviewRoute />
    </Suspense>
  );
}
