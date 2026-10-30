"use client";

import { useState, useTransition } from "react";
import type { ActionState } from "@/lib/action-types";

export function CsvButton({
  action,
  filename,
  label = "Export CSV",
}: {
  action: () => Promise<ActionState>;
  filename: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function run() {
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        setMessage(res.message);
        return;
      }
      const blob = new Blob([res.message], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage(`Downloaded ${filename}`);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button type="button" onClick={run} disabled={pending} className="btn btn-ghost disabled:opacity-60">
        {pending ? "Preparing…" : label}
      </button>
      {message && (
        <span role="status" className="font-sans text-[10px] text-ink-soft">
          {message.length > 90 ? "Export prepared." : message}
        </span>
      )}
    </div>
  );
}
