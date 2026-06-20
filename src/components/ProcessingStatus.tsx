"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

interface ProcessingStatusProps {
  contributionId: string;
}

export function ProcessingStatus({ contributionId }: ProcessingStatusProps) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    startedAtRef.current = Date.now();

    const interval = setInterval(() => {
      if (startedAtRef.current !== null && Date.now() - startedAtRef.current > POLL_TIMEOUT_MS) {
        setTimedOut(true);
        clearInterval(interval);
        return;
      }

      fetch(`/api/contributions/${contributionId}/status`)
        .then((response) => (response.ok ? response.json() : null))
        .then((data: { status?: string } | null) => {
          if (data?.status && data.status !== "PENDING") {
            clearInterval(interval);
            router.refresh();
          }
        })
        .catch(() => {
          // Transient network error — try again on the next interval.
        });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [contributionId, router]);

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-2xl font-semibold">Processing your contribution…</p>
      <p className="text-sm text-neutral-400">
        {timedOut
          ? "Still processing — this can take a few seconds. Refresh to check again."
          : "This usually only takes a moment."}
      </p>
    </div>
  );
}
