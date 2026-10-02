<script lang="ts">
  import { onMount } from "svelte";

  interface Props {
    initialName: string;
    onconfirm: (newName: string) => void;
    oncancel: () => void;
  }

  let { initialName, onconfirm, oncancel }: Props = $props();

  let value = $state(initialName);
  let inputEl: HTMLInputElement | undefined = $state();

  onMount(() => {
    // Focus the field and select the name part (without extension)
    if (inputEl) {
      inputEl.focus();
      const dot = initialName.lastIndexOf(".");
      if (dot > 0) {
        inputEl.setSelectionRange(0, dot);
      } else {
        inputEl.select();
      }
    }
  });

  function handleKey(e: KeyboardEvent) {
    // Stop keys from reaching the file manager underneath
    e.stopPropagation();

    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed.length > 0) onconfirm(trimmed);
    } else if (e.key === "Escape") {
      e.preventDefault();
      oncancel();
    }
  }
</script>

<div class="backdrop" role="presentation" onclick={oncancel}>
  <div class="dialog" role="dialog" aria-modal="true" aria-label="Rename"
       onclick={(e) => e.stopPropagation()}>
    <h2 class="title">Rename</h2>

    <!-- svelte-ignore a11y_autofocus -->
    <input
      bind:this={inputEl}
      bind:value
      class="input"
      type="text"
      spellcheck="false"
      autocomplete="off"
      onkeydown={handleKey}
    />

    <p class="hint"><kbd>Enter</kbd> confirm &nbsp; <kbd>Esc</kbd> cancel</p>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    animation: fadeIn 150ms ease;
  }

  .dialog {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 40px 48px;
    min-width: 480px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  .title {
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--text-muted);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .input {
    width: 100%;
    padding: 14px 16px;
    background: var(--surface-2);
    border: 2px solid var(--accent);
    border-radius: var(--radius-sm);
    color: var(--text);
    font-size: 1.1rem;
    font-family: inherit;
    outline: none;
  }

  .hint {
    color: var(--text-dim);
    font-size: 0.85rem;
  }

  kbd {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 2px 7px;
    font-family: inherit;
    font-size: 0.8em;
    color: var(--text-muted);
  }
</style>
