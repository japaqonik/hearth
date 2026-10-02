import { writable } from "svelte/store";

export type View = "home" | "filemanager" | "settings";

interface NavigationState {
  currentView: View;
  previousView: View | null;
  focusedTileIndex: number;
}

function createNavigation() {
  const { subscribe, update, set } = writable<NavigationState>({
    currentView: "home",
    previousView: null,
    focusedTileIndex: 0,
  });

  return {
    subscribe,
    goTo(view: View) {
      update((s) => ({
        ...s,
        previousView: s.currentView,
        currentView: view,
        focusedTileIndex: 0,
      }));
    },
    goBack() {
      update((s) => ({
        ...s,
        currentView: s.previousView ?? "home",
        previousView: null,
        focusedTileIndex: 0,
      }));
    },
    setFocus(index: number) {
      update((s) => ({ ...s, focusedTileIndex: index }));
    },
    reset() {
      set({ currentView: "home", previousView: null, focusedTileIndex: 0 });
    },
  };
}

export const navigation = createNavigation();
