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
 * Returns null if no action is bound to the pressed key.
 *
 * `Backspace` is always treated as `back` as a convenience fallback unless
 * the keymap explicitly binds it elsewhere.
 */
export function resolveAction(event: KeyboardEvent, keymap: Keymap): Action | null {
  const key = event.key;
  const keyLower = key.length === 1 ? key.toLowerCase() : key;

  for (const action of Object.keys(keymap) as Action[]) {
    for (const bound of keymap[action]) {
      const boundNorm = bound.length === 1 ? bound.toLowerCase() : bound;
      if (boundNorm === keyLower) return action;
    }
  }

  // Convenience: Backspace falls back to "back" if not otherwise bound
  if (key === "Backspace") {
    const boundElsewhere = Object.values(keymap).some((keys) => keys.includes("Backspace"));
    if (!boundElsewhere) return "back";
  }

  return null;
}

/** Produce a readable label for a physical key name. */
export function keyLabel(key: string): string {
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
  return map[key] ?? (key.length === 1 ? key.toUpperCase() : key);
}
