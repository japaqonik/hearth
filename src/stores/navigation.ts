import { writable } from "svelte/store";

export type View = "home" | "filemanager" | "settings";

// Topbar buttons in order: settings, power
export const TOPBAR_ITEMS = ["settings", "power"] as const;
export type TopbarItem = typeof TOPBAR_ITEMS[number];

export type FocusZone = "grid" | "topbar";

interface NavigationState {
  currentView: View;
  previousView: View | null;
  focusedTileIndex: number;
  focusZone: FocusZone;
  focusedTopbarIndex: number;  // index into TOPBAR_ITEMS
  powerMenuOpen: boolean;
}

function createNavigation() {
  const { subscribe, update, set } = writable<NavigationState>({
    currentView: "home",
    previousView: null,
    focusedTileIndex: 0,
    focusZone: "grid",
    focusedTopbarIndex: 0,
    powerMenuOpen: false,
  });

  return {
    subscribe,

    goTo(view: View) {
      update((s) => ({
        ...s,
        previousView: s.currentView,
        currentView: view,
        focusedTileIndex: 0,
        focusZone: "grid",
      }));
    },

    goBack() {
      update((s) => ({
        ...s,
        currentView: s.previousView ?? "home",
        previousView: null,
        focusedTileIndex: 0,
        focusZone: "grid",
      }));
    },

    setFocus(index: number) {
      update((s) => ({ ...s, focusedTileIndex: index }));
    },

    // Enter topbar from grid
    enterTopbar() {
      update((s) => ({ ...s, focusZone: "topbar", focusedTopbarIndex: 0 }));
    },

    // Return to grid from topbar
    leaveTopbar() {
      update((s) => ({ ...s, focusZone: "grid" }));
    },

    moveTopbar(dir: "left" | "right") {
      update((s) => {
        const max = TOPBAR_ITEMS.length - 1;
        const next = dir === "right"
          ? Math.min(s.focusedTopbarIndex + 1, max)
          : Math.max(s.focusedTopbarIndex - 1, 0);
        return { ...s, focusedTopbarIndex: next };
      });
    },

    openPowerMenu() {
      update((s) => ({ ...s, powerMenuOpen: true }));
    },

    closePowerMenu() {
      update((s) => ({ ...s, powerMenuOpen: false, focusZone: "topbar", focusedTopbarIndex: 1 }));
    },

    reset() {
      set({
        currentView: "home",
        previousView: null,
        focusedTileIndex: 0,
        focusZone: "grid",
        focusedTopbarIndex: 0,
        powerMenuOpen: false,
      });
    },
  };
}

export const navigation = createNavigation();
