"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Editor } from "@/features/editor/Editor";

function EditorRoute() {
  const id = useSearchParams().get("id");
  return <Editor courseId={id} />;
}

export default function EditorPage() {
  return (
    <Suspense>
      <EditorRoute />
    </Suspense>
  );
}
