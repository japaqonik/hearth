import { get } from "svelte/store";
import { effectiveKeymap } from "../stores/settings";
import { resolveActionFromEvent } from "./keyboard";
import type { Action } from "./keyboard";

/**
 * Register global listeners for both keyboard and mouse input, routing each to
 * a single action handler. The handler receives the resolved logical action
 * plus the original event (so it can call preventDefault, inspect the key for
 * mnemonic shortcuts, etc.).
 *
 * Mouse buttons are only dispatched when they resolve to a bound action — a
 * stray left-click that isn't bound to anything is ignored, so normal clicking
 * (e.g. in a launched browser) is unaffected while Hearth has focus.
 *
 * Returns a teardown function to remove the listeners.
 */
export function registerInput(
  handler: (action: Action | null, event: KeyboardEvent | MouseEvent) => void,
): () => void {
  const onKey = (e: KeyboardEvent) => {
    const action = resolveActionFromEvent(e, get(effectiveKeymap));
    handler(action, e);
  };

  const onMouse = (e: MouseEvent) => {
    const action = resolveActionFromEvent(e, get(effectiveKeymap));
    // Only intervene for mouse buttons that are actually bound to an action.
    if (action === null) return;
    handler(action, e);
  };

  window.addEventListener("keydown", onKey);
  window.addEventListener("mousedown", onMouse);

  return () => {
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("mousedown", onMouse);
  };
}
