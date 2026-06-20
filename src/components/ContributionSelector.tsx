"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MAX_CONTRIBUTION_CENTS,
  MIN_CONTRIBUTION_CENTS,
  PRESET_AMOUNTS_CENTS,
  formatCents,
  isValidCustomAmountCents,
  parseDollarsToCents,
} from "@/lib/money";

export function ContributionSelector() {
  const router = useRouter();

  const [selectedCents, setSelectedCents] = useState<number | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const customInputId = useId();

  const [showName, setShowName] = useState(false);
  const [customName, setCustomName] = useState("");
  const nameInputId = useId();

  const [hideAmountPublicly, setHideAmountPublicly] = useState(false);
  const hideAmountId = useId();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const activeCents = isCustom ? customCents : selectedCents;
  const canSubmit =
    (isCustom ? isValidCustomAmountCents(customCents) : selectedCents !== null) &&
    (!showName || customName.trim().length > 0);

  function selectPreset(cents: number) {
    setSelectedCents(cents);
    setIsCustom(false);
    setCustomInput("");
  }

  function selectCustom() {
    setIsCustom(true);
    setSelectedCents(null);
  }

  async function handleSubmit() {
    if (!canSubmit || activeCents === null || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents: activeCents,
          isAnonymous: !showName,
          customName: showName ? customName : undefined,
          hideAmountPublicly,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error ?? "Something went wrong. Try again.");
        setIsSubmitting(false);
        return;
      }

      router.push(data.redirectUrl);
    } catch {
      setSubmitError("Something went wrong. Try again.");
      setIsSubmitting(false);
    }
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

      <div className="flex w-full flex-col items-center gap-3 border-t border-neutral-800 pt-4">
        <div className="grid w-full grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setShowName(false)}
            aria-pressed={!showName}
            className={`rounded-full border px-4 py-3 text-sm font-medium transition-colors ${
              !showName
                ? "border-white bg-white text-black"
                : "border-neutral-700 text-white hover:border-white"
            }`}
          >
            Anonymous
          </button>
          <button
            type="button"
            onClick={() => setShowName(true)}
            aria-pressed={showName}
            className={`rounded-full border px-4 py-3 text-sm font-medium transition-colors ${
              showName
                ? "border-white bg-white text-black"
                : "border-neutral-700 text-white hover:border-white"
            }`}
          >
            Show my name
          </button>
        </div>

        {showName && (
          <div className="w-full">
            <label htmlFor={nameInputId} className="sr-only">
              Public display name
            </label>
            <input
              id={nameInputId}
              type="text"
              placeholder="Your name"
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              maxLength={30}
              className="w-full rounded-full border border-neutral-700 bg-transparent px-4 py-3 text-white outline-none placeholder:text-neutral-600 focus:border-white"
            />
          </div>
        )}

        <label
          htmlFor={hideAmountId}
          className="flex w-full items-center gap-2 text-sm text-neutral-400"
        >
          <input
            id={hideAmountId}
            type="checkbox"
            checked={hideAmountPublicly}
            onChange={(event) => setHideAmountPublicly(event.target.checked)}
            className="h-4 w-4 rounded border-neutral-700 bg-transparent accent-white"
          />
          Hide my contribution amount when sharing
        </label>
      </div>

      {submitError && (
        <p role="alert" className="text-xs text-neutral-400">
          {submitError}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        className="mt-2 w-full rounded-full bg-white px-8 py-4 text-base font-semibold tracking-wide text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
      >
        {isSubmitting ? "Adding..." : "ADD TO THE MILLION"}
      </button>
    </div>
  );
}
