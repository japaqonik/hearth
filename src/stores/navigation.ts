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
  launching: boolean;          // an external app is being launched
  launchingName: string;       // name shown in the launch overlay
}

function createNavigation() {
  const { subscribe, update, set } = writable<NavigationState>({
    currentView: "home",
    previousView: null,
    focusedTileIndex: 0,
    focusZone: "grid",
    focusedTopbarIndex: 0,
    powerMenuOpen: false,
    launching: false,
    launchingName: "",
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

    startLaunching(name: string) {
      update((s) => ({ ...s, launching: true, launchingName: name }));
    },

    stopLaunching() {
      update((s) => ({ ...s, launching: false, launchingName: "" }));
    },

    reset() {
      set({
        currentView: "home",
        previousView: null,
        focusedTileIndex: 0,
        focusZone: "grid",
        focusedTopbarIndex: 0,
        powerMenuOpen: false,
        launching: false,
        launchingName: "",
      });
    },
  };
}

export const navigation = createNavigation();
