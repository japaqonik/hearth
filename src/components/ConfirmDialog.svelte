<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { get } from "svelte/store";
  import { effectiveKeymap } from "../stores/settings";
  import { resolveAction } from "../lib/keyboard";

  interface Props {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onconfirm: () => void;
    oncancel: () => void;
  }

  let {
    title,
    message,
    confirmLabel = "Delete",
    cancelLabel = "Cancel",
    onconfirm,
    oncancel,
  }: Props = $props();

  // 0 = Cancel (default focus), 1 = Confirm — deliberately defaults to the safe option
  let focusedIndex = $state(0);

  function handleKey(e: KeyboardEvent) {
    e.stopPropagation();
    const action = resolveAction(e, get(effectiveKeymap));
    switch (action) {
      case "left":
      case "right":
        e.preventDefault();
        focusedIndex = focusedIndex === 0 ? 1 : 0;
        break;
      case "confirm":
        e.preventDefault();
        if (focusedIndex === 1) onconfirm();
        else oncancel();
        break;
      case "back":
        e.preventDefault();
        oncancel();
        break;
    }
  }

  onMount(() => window.addEventListener("keydown", handleKey, true));
  onDestroy(() => window.removeEventListener("keydown", handleKey, true));
</script>

<div class="backdrop" role="presentation" onclick={oncancel}>
  <div class="dialog" role="dialog" aria-modal="true" aria-label={title}
       onclick={(e) => e.stopPropagation()}>
    <h2 class="title">{title}</h2>
    <p class="message">{message}</p>

    <div class="actions">
      <button
        class="btn"
        class:focused={focusedIndex === 0}
        onclick={oncancel}
      >
        {cancelLabel}
      </button>
      <button
        class="btn btn--danger"
        class:focused={focusedIndex === 1}
        onclick={onconfirm}
      >
        {confirmLabel}
      </button>
    </div>
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
    z-index: 110;
    animation: fadeIn 150ms ease;
  }

  .dialog {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 40px 48px;
    min-width: 440px;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  .title {
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--text);
  }

  .message {
    color: var(--text-muted);
    font-size: 1rem;
    text-align: center;
    line-height: 1.5;
  }

  .actions {
    display: flex;
    gap: 16px;
    margin-top: 8px;
  }

  .btn {
    padding: 12px 32px;
    background: var(--surface-2);
    border: 2px solid transparent;
    border-radius: var(--radius-sm);
    color: var(--text);
    font-size: 1rem;
    font-weight: 500;
    transition: background var(--transition), border-color var(--transition);
  }

  .btn:hover {
    background: var(--surface-3);
  }

  .btn.focused {
    border-color: var(--accent);
    box-shadow: 0 0 14px var(--accent-glow);
    background: var(--surface-3);
  }

  .btn--danger.focused {
    border-color: #ff4444;
    box-shadow: 0 0 14px rgba(255, 68, 68, 0.4);
  }

  .btn--danger {
    color: #ff6666;
  }
</style>
