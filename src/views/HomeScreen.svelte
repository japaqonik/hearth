<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import AppGrid from "../components/AppGrid.svelte";
  import { navigation } from "../stores/navigation";
  import { settings } from "../stores/settings";
  import { registerInput } from "../lib/input";
  import type { Action } from "../lib/keyboard";
  import { invoke } from "@tauri-apps/api/core";

  const COLS = 3;

  let focusedIndex = $state(0);
  let tiles = $derived($settings.apps.tiles);
  let focusZone = $derived($navigation.focusZone);
  let powerMenuOpen = $derived($navigation.powerMenuOpen);
  let errorMsg = $state("");
  let errorTimer: ReturnType<typeof setTimeout>;

  function showError(msg: string) {
    errorMsg = msg;
    clearTimeout(errorTimer);
    errorTimer = setTimeout(() => (errorMsg = ""), 4000);
  }

  async function activateTile(tile: typeof tiles[number]) {
    if (tile.command === "__filemanager__") {
      navigation.goTo("filemanager");
      return;
    }
    if (tile.command === "__settings__") {
      navigation.goTo("settings");
      return;
    }
    try {
      await invoke("launch_app", { command: tile.command, args: tile.args });
    } catch (e) {
      showError(`Could not launch "${tile.name}": ${e}`);
    }
  }

  function handleAction(action: Action | null, e: KeyboardEvent | MouseEvent) {
    // Only handle input when focus is in the grid and no overlay is open
    if (focusZone !== "grid" || powerMenuOpen) return;

    const count = tiles.length;
    if (count === 0) return;

    if (!action) return;

    switch (action) {
      case "right":
        e.preventDefault();
        focusedIndex = Math.min(focusedIndex + 1, count - 1);
        break;
      case "left":
        e.preventDefault();
        focusedIndex = Math.max(focusedIndex - 1, 0);
        break;
      case "down":
        e.preventDefault();
        focusedIndex = Math.min(focusedIndex + COLS, count - 1);
        break;
      case "up":
        e.preventDefault();
        // If we're in the top row, move focus to topbar
        if (focusedIndex < COLS) {
          navigation.enterTopbar();
        } else {
          focusedIndex = Math.max(focusedIndex - COLS, 0);
        }
        break;
      case "confirm":
        e.preventDefault();
        activateTile(tiles[focusedIndex]);
        break;
    }
  }

  // When topbar leaves back to grid, restore focus
  $effect(() => {
    if (focusZone === "grid") {
      // keep focusedIndex as-is
    }
  });

  let teardown: () => void;
  onMount(() => { teardown = registerInput(handleAction); });
  onDestroy(() => teardown?.());
</script>

<div class="homescreen fade-in">
  <div class="grid-area">
    <AppGrid
      {tiles}
      {focusedIndex}
      active={focusZone === "grid"}
      onactivate={activateTile}
    />
  </div>

  {#if errorMsg}
    <div class="error-toast">{errorMsg}</div>
  {/if}
</div>

<style>
  .homescreen {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--edge);
    position: relative;
  }

  .grid-area {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .error-toast {
    position: absolute;
    bottom: var(--edge);
    left: 50%;
    transform: translateX(-50%);
    background: var(--surface-2);
    border: 1px solid var(--accent);
    color: var(--text);
    padding: 12px 24px;
    border-radius: var(--radius-sm);
    font-size: 0.95rem;
    max-width: 600px;
    text-align: center;
    animation: fadeIn 150ms ease;
  }
</style>
