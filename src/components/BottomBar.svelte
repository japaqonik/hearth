<script lang="ts">
  interface Hint {
    keys: string;
    label: string;
    available?: boolean; // when false, the hint is dimmed (default true)
  }

  interface Props {
    hints: Hint[];
    message?: string | null;
    optionsMode?: boolean;
  }

  let { hints, message = null, optionsMode = false }: Props = $props();
</script>

<div class="bottom-bar" class:has-message={!!message} class:options={optionsMode}>
  {#if message}
    <span class="message">{message}</span>
  {:else}
    {#each hints as hint}
      <span class="hint" class:dim={hint.available === false}>
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
    gap: 24px;
    padding: 0 var(--edge);
    background: var(--surface);
    border-top: 1px solid var(--border);
    flex-shrink: 0;
    transition: border-top-color var(--transition), background var(--transition);
  }

  .bottom-bar.options {
    background: var(--surface-2);
    border-top-color: var(--accent);
  }

  .bottom-bar.has-message {
    border-top-color: var(--accent);
  }

  .hint {
    display: flex;
    align-items: center;
    gap: 8px;
    transition: opacity var(--transition);
  }

  .hint.dim {
    opacity: 0.35;
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

  .options kbd {
    background: var(--surface-3);
  }
</style>
