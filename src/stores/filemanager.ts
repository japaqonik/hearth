import { writable } from "svelte/store";
import type { FileEntry } from "../lib/tauri";
import { listDirectory, homePath } from "../lib/tauri";

interface FileManagerState {
  currentPath: string;
  entries: FileEntry[];
  selectedIndex: number;
  history: string[];
  loading: boolean;
  error: string | null;
}

function createFileManager() {
  const { subscribe, update, set } = writable<FileManagerState>({
    currentPath: "",
    entries: [],
    selectedIndex: 0,
    history: [],
    loading: false,
    error: null,
  });

  async function loadPath(path: string, showHidden: boolean, pushHistory = true) {
    update((s) => ({ ...s, loading: true, error: null }));
    try {
      const entries = await listDirectory(path, showHidden);
      update((s) => ({
        ...s,
        currentPath: path,
        entries,
        selectedIndex: 0,
        loading: false,
        error: null,
        history: pushHistory && s.currentPath ? [...s.history, s.currentPath] : s.history,
      }));
    } catch (e) {
      update((s) => ({
        ...s,
        loading: false,
        error: String(e),
      }));
    }
  }

  return {
    subscribe,

    /** Open the file manager at the home directory. */
    async init(showHidden: boolean) {
      const home = await homePath();
      await loadPath(home, showHidden, false);
    },

    /** Navigate into a directory. */
    async enterDir(path: string, showHidden: boolean) {
      await loadPath(path, showHidden, true);
    },

    /** Go up one directory level. */
    async goUp(showHidden: boolean) {
      let parent = "";
      update((s) => {
        const p = s.currentPath.replace(/\/+$/, "");
        const idx = p.lastIndexOf("/");
        parent = idx > 0 ? p.slice(0, idx) : "/";
        return s;
      });
      if (parent) {
        await loadPath(parent, showHidden, false);
      }
    },

    setSelected(index: number) {
      update((s) => ({ ...s, selectedIndex: index }));
    },

    clearError() {
      update((s) => ({ ...s, error: null }));
    },

    reset() {
      set({
        currentPath: "",
        entries: [],
        selectedIndex: 0,
        history: [],
        loading: false,
        error: null,
      });
    },
  };
}

export const filemanager = createFileManager();
