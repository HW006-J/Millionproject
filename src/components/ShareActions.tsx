"use client";

import { useState } from "react";

interface ShareActionsProps {
  shareText: string;
  shareUrl: string;
}

export function ShareActions({ shareText, shareUrl }: ShareActionsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable; nothing more we can safely do here.
    }
  }

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: shareText, url: shareUrl });
        return;
      } catch {
        // User cancelled, or the share sheet failed — fall back to copy.
      }
    }
    await handleCopy();
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <button
        type="button"
        onClick={handleShare}
        className="rounded-full bg-white px-6 py-3 text-sm font-semibold tracking-wide text-black transition-opacity hover:opacity-90"
      >
        Share
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-full border border-neutral-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:border-white"
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
