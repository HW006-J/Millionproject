"use client";

import { useActionState } from "react";
import { updateCampaignTargetAction, type SettingsActionResult } from "./actions";

const initialState: SettingsActionResult = {};

interface TargetEditFormProps {
  currentTargetDollars: string;
}

export function TargetEditForm({ currentTargetDollars }: TargetEditFormProps) {
  const [state, formAction, isPending] = useActionState(updateCampaignTargetAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="targetDollars" className="text-xs uppercase tracking-wide text-neutral-500">
        Campaign target (USD)
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-neutral-400">$</span>
        <input
          id="targetDollars"
          name="targetDollars"
          type="text"
          inputMode="decimal"
          defaultValue={currentTargetDollars}
          className="w-48 rounded-full border border-neutral-700 bg-transparent px-4 py-2 text-white outline-none focus:border-white"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "Saving…" : "Update target"}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="text-xs text-neutral-500">
          {state.error}
        </p>
      )}
    </form>
  );
}
