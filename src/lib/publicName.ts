const MAX_PUBLIC_NAME_LENGTH = 30;

// Basic, intentionally small word list — a "basic profanity filter" per spec,
// not a comprehensive moderation system.
const BLOCKED_WORDS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "cunt",
  "nigger",
  "faggot",
  "retard",
];

// Built at runtime (not as a literal escape in source) to avoid embedding
// raw control bytes in this file.
const CONTROL_CHAR_PATTERN = new RegExp(
  `[${String.fromCharCode(0)}-${String.fromCharCode(31)}${String.fromCharCode(127)}]`,
  "g",
);

function stripControlCharacters(input: string): string {
  return input.replace(CONTROL_CHAR_PATTERN, "");
}

export function sanitizePublicName(raw: string): string {
  const stripped = stripControlCharacters(raw);
  const collapsed = stripped.replace(/\s+/g, " ").trim();
  return collapsed.slice(0, MAX_PUBLIC_NAME_LENGTH);
}

export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((word) => lower.includes(word));
}

export interface PublicNameInput {
  isAnonymous: boolean;
  customName?: string;
}

export interface PublicNameResult {
  isAnonymous: boolean;
  publicName: string | null;
}

export type PublicNameValidation =
  | { ok: true; value: PublicNameResult }
  | { ok: false; error: string };

export function validatePublicName(input: PublicNameInput): PublicNameValidation {
  if (input.isAnonymous) {
    return { ok: true, value: { isAnonymous: true, publicName: null } };
  }

  const sanitized = sanitizePublicName(input.customName ?? "");

  if (sanitized.length === 0) {
    return { ok: false, error: "Enter a name or choose Anonymous." };
  }

  if (containsProfanity(sanitized)) {
    return { ok: false, error: "That name isn't allowed. Try something else." };
  }

  return { ok: true, value: { isAnonymous: false, publicName: sanitized } };
}
