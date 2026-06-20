"use client";

import { useActionState } from "react";
import { toggleCampaignActiveAction, type SettingsActionResult } from "./actions";

const initialState: SettingsActionResult = {};

interface PauseToggleButtonProps {
  isActive: boolean;
}

export function PauseToggleButton({ isActive }: PauseToggleButtonProps) {
  const [state, formAction, isPending] = useActionState(toggleCampaignActiveAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="nextActive" value={isActive ? "false" : "true"} />
      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-full border border-neutral-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:border-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isActive ? "Pause new contributions" : "Resume new contributions"}
      </button>
      {state.error && (
        <p role="alert" className="text-xs text-neutral-500">
          {state.error}
        </p>
      )}
    </form>
  );
}
