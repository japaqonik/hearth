// Logical input actions. Views reason about these, never raw key names.
export type Action =
  | "up"
  | "down"
  | "left"
  | "right"
  | "confirm"
  | "back"
  | "options"
  | "pageUp"
  | "pageDown"
  | "home"
  | "end"
  | "delete"
  | "editCommand"; // secondary action (edit a tile's command in Settings)

// A keymap maps a logical action to one or more physical key names
// (as reported by KeyboardEvent.key). Multiple keys may map to one action.
export type Keymap = Record<Action, string[]>;

// Default bindings — mirror the current hardcoded behavior.
export const DEFAULT_KEYMAP: Keymap = {
  up:          ["ArrowUp"],
  down:        ["ArrowDown"],
  left:        ["ArrowLeft", "Backspace"],
  right:       ["ArrowRight"],
  confirm:     ["Enter", " "],
  back:        ["Escape"],
  options:     ["m"],
  pageUp:      ["PageUp"],
  pageDown:    ["PageDown"],
  home:        ["Home"],
  end:         ["End"],
  delete:      ["Delete"],
  editCommand: ["e"],
};

// Human-friendly labels for the settings UI, in display order.
export const ACTION_LABELS: { action: Action; label: string }[] = [
  { action: "up",          label: "Up" },
  { action: "down",        label: "Down" },
  { action: "left",        label: "Left / Back out" },
  { action: "right",       label: "Right / Enter section" },
  { action: "confirm",     label: "Confirm / Open" },
  { action: "back",        label: "Back / Cancel" },
  { action: "options",     label: "Options menu" },
  { action: "pageUp",      label: "Page up" },
  { action: "pageDown",    label: "Page down" },
  { action: "home",        label: "Jump to first" },
  { action: "end",         label: "Jump to last" },
  { action: "delete",      label: "Delete" },
  { action: "editCommand", label: "Edit command (Apps)" },
];

/**
 * Resolve a KeyboardEvent to a logical action using the given keymap.
 * Returns null if no action is bound to the pressed input.
 *
 * `Backspace` is always treated as `back` as a convenience fallback unless
 * the keymap explicitly binds it elsewhere.
 */

// Mouse buttons are stored as tokens "Mouse<button>" where <button> is the
// MouseEvent.button value (0 = left, 1 = middle, 2 = right, 3/4 = back/forward).
export const MOUSE_PREFIX = "Mouse";

export function isMouseToken(token: string): boolean {
  return token.startsWith(MOUSE_PREFIX) && /^Mouse\d+$/.test(token);
}

/** Canonical input token for a keyboard event (the key name). */
export function tokenFromKeyboardEvent(e: KeyboardEvent): string {
  return e.key;
}

/** Canonical input token for a mouse event, e.g. "Mouse0" for left button. */
export function tokenFromMouseEvent(e: MouseEvent): string {
  return `${MOUSE_PREFIX}${e.button}`;
}

/** Normalize a token for comparison (single letters are case-insensitive). */
function normToken(token: string): string {
  return token.length === 1 ? token.toLowerCase() : token;
}

/** Resolve a raw input token to a logical action using the keymap. */
export function resolveToken(token: string, keymap: Keymap): Action | null {
  const norm = normToken(token);

  for (const action of Object.keys(keymap) as Action[]) {
    for (const bound of keymap[action]) {
      if (normToken(bound) === norm) return action;
    }
  }

  // Convenience: Backspace falls back to "back" if not otherwise bound
  if (token === "Backspace") {
    const boundElsewhere = Object.values(keymap).some((keys) => keys.includes("Backspace"));
    if (!boundElsewhere) return "back";
  }

  return null;
}

/** Resolve a keyboard OR mouse event to a logical action. */
export function resolveActionFromEvent(
  event: KeyboardEvent | MouseEvent,
  keymap: Keymap,
): Action | null {
  const token =
    event instanceof MouseEvent
      ? tokenFromMouseEvent(event)
      : tokenFromKeyboardEvent(event as KeyboardEvent);
  return resolveToken(token, keymap);
}

/** Keyboard-only resolver (kept for callers that only handle key events). */
export function resolveAction(event: KeyboardEvent, keymap: Keymap): Action | null {
  return resolveToken(event.key, keymap);
}

/** Produce a readable label for a physical input token (key or mouse button). */
export function keyLabel(token: string): string {
  if (isMouseToken(token)) {
    const n = token.slice(MOUSE_PREFIX.length);
    const names: Record<string, string> = {
      "0": "L-Click",
      "1": "M-Click",
      "2": "R-Click",
      "3": "Mouse Back",
      "4": "Mouse Fwd",
    };
    return names[n] ?? `Mouse ${n}`;
  }
  const map: Record<string, string> = {
    " ": "Space",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    Escape: "Esc",
    Enter: "Enter",
    Backspace: "Backspace",
    Delete: "Del",
    PageUp: "PgUp",
    PageDown: "PgDn",
  };
  return map[token] ?? (token.length === 1 ? token.toUpperCase() : token);
}

/**
 * Actions that must always remain reachable, or the UI (and the rebind flow
 * itself) becomes unusable. These guard against soft-locking the app.
 */
export const ESSENTIAL_ACTIONS: Action[] = [
  "up",
  "down",
  "left",
  "right",
  "confirm",
  "back",
];

/**
 * Given a (candidate) keymap, return the set of essential actions that would
 * be UNREACHABLE — meaning no key press resolves to them. This accounts for
 * both empty bindings and *shadowing* (an earlier-ordered action stealing a
 * key via `resolveAction`'s first-match behavior).
 *
 * An action is reachable if at least one of its bound keys resolves back to
 * that same action through `resolveAction`.
 */
export function unreachableEssentialActions(keymap: Keymap): Action[] {
  const unreachable: Action[] = [];

  for (const action of ESSENTIAL_ACTIONS) {
    const tokens = keymap[action] ?? [];
    const reachable = tokens.some((t) => resolveToken(t, keymap) === action);
    if (!reachable) unreachable.push(action);
  }

  return unreachable;
}
