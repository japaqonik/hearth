<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { navigation } from "../stores/navigation";

  const options = [
    { id: "close",    label: "Close Hearth",  icon: "x-circle",     available: true },
    { id: "shutdown", label: "Shutdown",       icon: "power",        available: true },
  ] as const;

  type OptionId = typeof options[number]["id"];

  let focusedIndex = $state(0);
  let error = $state<string | null>(null);

  async function activate(id: OptionId) {
    if (id === "close") {
      await invoke("close_app");
    } else if (id === "shutdown") {
      try {
        await invoke("shutdown");
        // If shutdown succeeds the system goes down; this line rarely runs
        navigation.closePowerMenu();
      } catch (e) {
        error = `Shutdown failed: ${e}`;
      }
    }
  }

  function handleKey(e: KeyboardEvent) {
    switch (e.key) {
      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault();
        focusedIndex = Math.max(focusedIndex - 1, 0);
        break;
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        focusedIndex = Math.min(focusedIndex + 1, options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        activate(options[focusedIndex].id);
        break;
      case "Escape":
        e.preventDefault();
        navigation.closePowerMenu();
        break;
    }
  }

  onMount(() => window.addEventListener("keydown", handleKey));
  onDestroy(() => window.removeEventListener("keydown", handleKey));
</script>

<!-- Backdrop -->
<div class="backdrop" role="presentation" onclick={() => navigation.closePowerMenu()}>
  <!-- Dialog — stop click propagation so clicking inside doesn't close -->
  <div class="dialog" role="dialog" aria-modal="true" aria-label="Power menu"
       onclick={(e) => e.stopPropagation()}>

    <h2 class="title">Power</h2>

    <div class="options">
      {#each options as option, i}
        <button
          class="option"
          class:focused={focusedIndex === i}
          onclick={() => activate(option.id)}
        >
          {#if option.id === "close"}
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="1.8"
                 stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="1.8"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
              <line x1="12" y1="2" x2="12" y2="12"/>
            </svg>
          {/if}
          <span>{option.label}</span>
        </button>
      {/each}
    </div>

    {#if error}
      <p class="error">{error}</p>
    {/if}

    <p class="hint"><kbd>Esc</kbd> to cancel</p>
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
    min-width: 320px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
  }

  .title {
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--text-muted);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .option {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: var(--surface-2);
    border: 2px solid transparent;
    border-radius: var(--radius-sm);
    color: var(--text);
    font-size: 1.1rem;
    font-weight: 500;
    width: 100%;
    transition: background var(--transition), border-color var(--transition);
  }

  .option:hover {
    background: var(--surface-3);
  }

  .option.focused {
    border-color: var(--accent);
    box-shadow: 0 0 16px var(--accent-glow);
    background: var(--surface-3);
  }

  .error {
    color: #ff6666;
    font-size: 0.9rem;
    text-align: center;
    max-width: 320px;
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
