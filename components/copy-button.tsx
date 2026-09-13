"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="absolute right-2 top-2 rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
