<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { listDirectory, homePath } from "../lib/tauri";
  import type { FileEntry } from "../lib/tauri";

  interface Props {
    // Only show files whose extension is in this list (plus all directories).
    // Empty = show all files.
    extensions?: string[];
    onselect: (path: string) => void;
    oncancel: () => void;
  }

  let { extensions = [], onselect, oncancel }: Props = $props();

  let currentPath = $state("");
  let entries = $state<FileEntry[]>([]);
  let selectedIndex = $state(0);
  let error = $state<string | null>(null);

  function matches(entry: FileEntry): boolean {
    if (entry.is_dir) return true;
    if (extensions.length === 0) return true;
    return entry.extension !== null && extensions.includes(entry.extension);
  }

  async function load(path: string) {
    try {
      const all = await listDirectory(path, false);
      entries = all.filter(matches);
      currentPath = path;
      selectedIndex = 0;
      error = null;
    } catch (e) {
      error = String(e);
    }
  }

  async function enter(entry: FileEntry) {
    if (entry.is_dir) {
      await load(entry.path);
    } else {
      onselect(entry.path);
    }
  }

  async function goUp() {
    const p = currentPath.replace(/\/+$/, "");
    const idx = p.lastIndexOf("/");
    const parent = idx > 0 ? p.slice(0, idx) : "/";
    await load(parent);
  }

  function handleKey(e: KeyboardEvent) {
    e.stopPropagation();
    const count = entries.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (count > 0) selectedIndex = Math.min(selectedIndex + 1, count - 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (count > 0) selectedIndex = Math.max(selectedIndex - 1, 0);
        break;
      case "Enter":
        e.preventDefault();
        if (count > 0) enter(entries[selectedIndex]);
        break;
      case "Backspace":
      case "ArrowLeft":
        e.preventDefault();
        goUp();
        break;
      case "Escape":
        e.preventDefault();
        oncancel();
        break;
    }
  }

  onMount(async () => {
    window.addEventListener("keydown", handleKey, true);
    const home = await homePath();
    await load(home);
  });

  onDestroy(() => window.removeEventListener("keydown", handleKey, true));
</script>

<div class="backdrop" role="presentation" onclick={oncancel}>
  <div class="dialog" role="dialog" aria-modal="true" aria-label="Select file"
       onclick={(e) => e.stopPropagation()}>
    <div class="path truncate">{currentPath}</div>

    <div class="list">
      {#if error}
        <div class="empty">{error}</div>
      {:else if entries.length === 0}
        <div class="empty">No matching files here</div>
      {:else}
        {#each entries as entry, i}
          <button
            class="row"
            class:focused={selectedIndex === i}
            data-picker-path={entry.path}
            onclick={() => enter(entry)}
          >
            <span class="icon">{entry.is_dir ? "📁" : "🖼"}</span>
            <span class="name truncate">{entry.name}</span>
          </button>
        {/each}
      {/if}
    </div>

    <p class="hint">
      <kbd>↑↓</kbd> navigate &nbsp; <kbd>Enter</kbd> select &nbsp;
      <kbd>Backspace</kbd> up &nbsp; <kbd>Esc</kbd> cancel
    </p>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 120;
    animation: fadeIn 150ms ease;
  }

  .dialog {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 28px 32px;
    width: 720px;
    max-width: 90vw;
    height: 70vh;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .path {
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 0.9rem;
    color: var(--text-muted);
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
  }

  .list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-height: 0;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 14px;
    background: transparent;
    border: 2px solid transparent;
    border-radius: var(--radius-sm);
    color: var(--text);
    text-align: left;
    width: 100%;
  }

  .row.focused {
    background: var(--surface-2);
    border-color: var(--accent);
  }

  .icon {
    font-size: 1.1rem;
  }

  .name {
    flex: 1;
    min-width: 0;
  }

  .empty {
    color: var(--text-dim);
    text-align: center;
    padding: 40px;
  }

  .hint {
    color: var(--text-dim);
    font-size: 0.8rem;
    text-align: center;
  }

  kbd {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 2px 6px;
    font-family: inherit;
    font-size: 0.85em;
    color: var(--text-muted);
  }
</style>
