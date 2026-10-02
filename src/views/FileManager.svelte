<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { navigation } from "../stores/navigation";

  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      navigation.goBack();
    }
  }

  onMount(() => window.addEventListener("keydown", handleKey));
  onDestroy(() => window.removeEventListener("keydown", handleKey));
</script>

<div class="filemanager fade-in">
  <div class="placeholder">
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="1.5"
         stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-dim)">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
    <h2>Files</h2>
    <p>Coming in Phase 2</p>
    <p class="hint">Press <kbd>Esc</kbd> to go back</p>
  </div>
</div>

<style>
  .filemanager {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    color: var(--text-muted);
  }

  h2 {
    color: var(--text);
  }

  p {
    color: var(--text-muted);
    font-size: 1rem;
  }

  .hint {
    margin-top: 8px;
    color: var(--text-dim);
    font-size: 0.9rem;
  }

  kbd {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 2px 8px;
    font-family: inherit;
    font-size: 0.85em;
    color: var(--text-muted);
  }
</style>
