import { writable } from "svelte/store";
import type { FileEntry } from "../lib/tauri";
import {
  listDirectory,
  homePath,
  trashEntry,
  renameEntry,
  copyEntry,
  moveEntry,
} from "../lib/tauri";

export type ClipboardOp = "copy" | "cut";

export interface Clipboard {
  op: ClipboardOp;
  path: string;
  name: string;
}

interface FileManagerState {
  currentPath: string;
  entries: FileEntry[];
  selectedIndex: number;
  history: string[];
  loading: boolean;
  error: string | null;
  clipboard: Clipboard | null;
}

function createFileManager() {
  const { subscribe, update, set } = writable<FileManagerState>({
    currentPath: "",
    entries: [],
    selectedIndex: 0,
    history: [],
    loading: false,
    error: null,
    clipboard: null,
  });

  let currentPathValue = "";
  subscribe((s) => (currentPathValue = s.currentPath));

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
      update((s) => ({ ...s, loading: false, error: String(e) }));
    }
  }

  /** Reload the current directory, preserving the selected index. */
  async function reload(showHidden: boolean) {
    const path = currentPathValue;
    if (!path) return;
    try {
      const entries = await listDirectory(path, showHidden);
      update((s) => ({
        ...s,
        entries,
        selectedIndex: Math.min(s.selectedIndex, Math.max(entries.length - 1, 0)),
        error: null,
      }));
    } catch (e) {
      update((s) => ({ ...s, error: String(e) }));
    }
  }

  return {
    subscribe,

    async init(showHidden: boolean) {
      const home = await homePath();
      await loadPath(home, showHidden, false);
    },

    async enterDir(path: string, showHidden: boolean) {
      await loadPath(path, showHidden, true);
    },

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

    reload,

    // ── Clipboard operations ──────────────────────────────

    copyToClipboard(entry: FileEntry) {
      update((s) => ({
        ...s,
        clipboard: { op: "copy", path: entry.path, name: entry.name },
      }));
    },

    cutToClipboard(entry: FileEntry) {
      update((s) => ({
        ...s,
        clipboard: { op: "cut", path: entry.path, name: entry.name },
      }));
    },

    clearClipboard() {
      update((s) => ({ ...s, clipboard: null }));
    },

    /** Paste the clipboard into the current directory. Returns an error string or null. */
    async paste(clipboard: Clipboard, showHidden: boolean): Promise<string | null> {
      const dest = currentPathValue;
      try {
        if (clipboard.op === "copy") {
          await copyEntry(clipboard.path, dest);
        } else {
          await moveEntry(clipboard.path, dest);
          // Cut is one-shot — clear after a successful move
          update((s) => ({ ...s, clipboard: null }));
        }
        await reload(showHidden);
        return null;
      } catch (e) {
        return String(e);
      }
    },

    /** Rename an entry. Returns an error string or null. */
    async rename(path: string, newName: string, showHidden: boolean): Promise<string | null> {
      try {
        await renameEntry(path, newName);
        await reload(showHidden);
        return null;
      } catch (e) {
        return String(e);
      }
    },

    /** Move an entry to trash. Returns an error string or null. */
    async trash(path: string, showHidden: boolean): Promise<string | null> {
      try {
        await trashEntry(path);
        await reload(showHidden);
        return null;
      } catch (e) {
        return String(e);
      }
    },

    reset() {
      set({
        currentPath: "",
        entries: [],
        selectedIndex: 0,
        history: [],
        loading: false,
        error: null,
        clipboard: null,
      });
    },
  };
}

export const filemanager = createFileManager();
