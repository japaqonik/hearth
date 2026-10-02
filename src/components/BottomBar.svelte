<script lang="ts">
  interface Hint {
    keys: string;
    label: string;
  }

  interface Props {
    hints: Hint[];
    message?: string | null;
  }

  let { hints, message = null }: Props = $props();
</script>

<div class="bottom-bar" class:has-message={!!message}>
  {#if message}
    <span class="message">{message}</span>
  {:else}
    {#each hints as hint}
      <span class="hint">
        <kbd>{hint.keys}</kbd>
        <span class="label">{hint.label}</span>
      </span>
    {/each}
  {/if}
</div>

<style>
  .bottom-bar {
    height: var(--bottombar-h);
    min-height: var(--bottombar-h);
    display: flex;
    align-items: center;
    gap: 28px;
    padding: 0 var(--edge);
    background: var(--surface);
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }

  .bottom-bar.has-message {
    border-top-color: var(--accent);
  }

  .hint {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .label {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .message {
    font-size: 0.9rem;
    color: var(--text);
  }

  kbd {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 3px 9px;
    font-family: inherit;
    font-size: 0.8rem;
    color: var(--text);
    min-width: 24px;
    text-align: center;
  }
</style>
