"use client";

import { useActionState } from "react";
import { setContributionNameHiddenAction, type SetNameHiddenResult } from "./actions";

const initialState: SetNameHiddenResult = {};

interface HideNameButtonProps {
  contributionId: string;
  hidden: boolean;
}

export function HideNameButton({ contributionId, hidden }: HideNameButtonProps) {
  const [state, formAction, isPending] = useActionState(setContributionNameHiddenAction, initialState);

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="contributionId" value={contributionId} />
      <input type="hidden" name="hidden" value={hidden ? "false" : "true"} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-white transition-colors hover:border-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {hidden ? "Restore name" : "Hide name"}
      </button>
      {state.error && (
        <span role="alert" className="text-neutral-500">
          {state.error}
        </span>
      )}
    </form>
  );
}
