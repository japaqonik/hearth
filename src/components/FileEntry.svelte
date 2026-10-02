<script lang="ts">
  import type { FileEntry } from "../lib/tauri";
  import { formatSize, formatDate } from "../lib/utils";

  interface Props {
    entry: FileEntry;
    focused: boolean;
    onclick: () => void;
  }

  let { entry, focused, onclick }: Props = $props();

  $effect(() => {
    if (focused) {
      const el = document.querySelector(`[data-entry-path="${CSS.escape(entry.path)}"]`) as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  });
</script>

<button
  class="entry"
  class:focused
  data-entry-path={entry.path}
  {onclick}
>
  <span class="icon">
    {#if entry.is_dir}
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    {/if}
  </span>

  <span class="name truncate">{entry.name}</span>

  <span class="meta">
    {#if entry.is_dir}
      <span class="chevron">›</span>
    {:else}
      <span class="size">{formatSize(entry.size)}</span>
      <span class="date">{formatDate(entry.modified)}</span>
    {/if}
  </span>
</button>

<style>
  .entry {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    padding: 12px 20px;
    background: transparent;
    border: 2px solid transparent;
    border-radius: var(--radius-sm);
    color: var(--text);
    text-align: left;
    transition: background var(--transition), border-color var(--transition);
  }

  .entry:hover {
    background: var(--surface-2);
  }

  .entry.focused {
    background: var(--surface-2);
    border-color: var(--accent);
    box-shadow: 0 0 12px var(--accent-glow);
  }

  .icon {
    display: flex;
    align-items: center;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .entry.focused .icon {
    color: var(--accent);
  }

  .name {
    flex: 1;
    font-size: 1.05rem;
    min-width: 0;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-shrink: 0;
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .size {
    min-width: 70px;
    text-align: right;
  }

  .date {
    min-width: 90px;
    text-align: right;
  }

  .chevron {
    font-size: 1.4rem;
    color: var(--text-dim);
  }
</style>
