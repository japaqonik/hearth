<script lang="ts">
  import FileEntry from "./FileEntry.svelte";
  import type { FileEntry as FileEntryType } from "../lib/tauri";

  interface Props {
    entries: FileEntryType[];
    selectedIndex: number;
    active: boolean;
    onactivate: (entry: FileEntryType) => void;
  }

  let { entries, selectedIndex, active, onactivate }: Props = $props();
</script>

<div class="file-list">
  {#if entries.length === 0}
    <div class="empty">This folder is empty</div>
  {:else}
    {#each entries as entry, i}
      <FileEntry
        {entry}
        focused={active && selectedIndex === i}
        onclick={() => onactivate(entry)}
      />
    {/each}
  {/if}
</div>

<style>
  .file-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px var(--edge);
    min-height: 0;
  }

  .empty {
    color: var(--text-dim);
    font-size: 1rem;
    text-align: center;
    padding: 48px;
  }
</style>
