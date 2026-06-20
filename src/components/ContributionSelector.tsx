"use client";

import { useId, useMemo, useState } from "react";
import {
  MAX_CONTRIBUTION_CENTS,
  MIN_CONTRIBUTION_CENTS,
  PRESET_AMOUNTS_CENTS,
  formatCents,
  isValidCustomAmountCents,
  parseDollarsToCents,
} from "@/lib/money";

export function ContributionSelector() {
  const [selectedCents, setSelectedCents] = useState<number | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const customInputId = useId();

  const customCents = isCustom ? parseDollarsToCents(customInput) : null;

  const customError = useMemo(() => {
    if (!isCustom || customInput.trim() === "") return null;
    if (customCents === null) {
      return "Enter a dollar amount with up to two decimal places.";
    }
    if (!isValidCustomAmountCents(customCents)) {
      return `Enter an amount between ${formatCents(
        MIN_CONTRIBUTION_CENTS,
      )} and ${formatCents(MAX_CONTRIBUTION_CENTS)}.`;
    }
    return null;
  }, [isCustom, customInput, customCents]);

  const canSubmit = isCustom
    ? isValidCustomAmountCents(customCents)
    : selectedCents !== null;

  function selectPreset(cents: number) {
    setSelectedCents(cents);
    setIsCustom(false);
    setCustomInput("");
  }

  function selectCustom() {
    setIsCustom(true);
    setSelectedCents(null);
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <div className="grid w-full grid-cols-3 gap-2">
        {PRESET_AMOUNTS_CENTS.map((cents) => {
          const isActive = !isCustom && selectedCents === cents;
          return (
            <button
              key={cents}
              type="button"
              onClick={() => selectPreset(cents)}
              aria-pressed={isActive}
              className={`rounded-full border px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "border-white bg-white text-black"
                  : "border-neutral-700 text-white hover:border-white"
              }`}
            >
              {formatCents(cents).replace(/\.00$/, "")}
            </button>
          );
        })}
        <button
          type="button"
          onClick={selectCustom}
          aria-pressed={isCustom}
          className={`rounded-full border px-4 py-3 text-sm font-medium transition-colors ${
            isCustom
              ? "border-white bg-white text-black"
              : "border-neutral-700 text-white hover:border-white"
          }`}
        >
          Custom
        </button>
      </div>

      {isCustom && (
        <div className="w-full">
          <label htmlFor={customInputId} className="sr-only">
            Custom contribution amount in dollars
          </label>
          <div className="flex items-center rounded-full border border-neutral-700 px-4 py-3 focus-within:border-white">
            <span className="mr-1 text-neutral-400">$</span>
            <input
              id={customInputId}
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={customInput}
              onChange={(event) => setCustomInput(event.target.value)}
              className="w-full bg-transparent text-white outline-none placeholder:text-neutral-600"
              aria-invalid={customError !== null}
              aria-describedby={customError ? `${customInputId}-error` : undefined}
            />
          </div>
          {customError && (
            <p
              id={`${customInputId}-error`}
              className="mt-2 text-xs text-neutral-400"
            >
              {customError}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={!canSubmit}
        className="mt-2 w-full rounded-full bg-white px-8 py-4 text-base font-semibold tracking-wide text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
      >
        ADD TO THE MILLION
      </button>
    </div>
  );
}
