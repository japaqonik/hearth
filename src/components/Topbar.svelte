<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { navigation, TOPBAR_ITEMS } from "../stores/navigation";
  import { effectiveKeymap } from "../stores/settings";
  import { resolveAction } from "../lib/keyboard";
  import Logo from "./Logo.svelte";

  let time = $state("");
  let timer: ReturnType<typeof setInterval>;
  let focusZone = $derived($navigation.focusZone);
  let focusedTopbarIndex = $derived($navigation.focusedTopbarIndex);
  let powerMenuOpen = $derived($navigation.powerMenuOpen);
  let keymap = $derived($effectiveKeymap);

  function updateClock() {
    const now = new Date();
    time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function handleKey(e: KeyboardEvent) {
    if (focusZone !== "topbar" || powerMenuOpen) return;

    const action = resolveAction(e, keymap);
    if (!action) return;

    switch (action) {
      case "left":
        e.preventDefault();
        navigation.moveTopbar("left");
        break;
      case "right":
        e.preventDefault();
        navigation.moveTopbar("right");
        break;
      case "down":
      case "back":
        e.preventDefault();
        navigation.leaveTopbar();
        break;
      case "confirm":
        e.preventDefault();
        activateFocused();
        break;
    }
  }

  function activateFocused() {
    const item = TOPBAR_ITEMS[focusedTopbarIndex];
    if (item === "settings") {
      navigation.leaveTopbar();
      navigation.goTo("settings");
    } else if (item === "power") {
      navigation.openPowerMenu();
    }
  }

  onMount(() => {
    updateClock();
    timer = setInterval(updateClock, 1000);
    window.addEventListener("keydown", handleKey);
  });

  onDestroy(() => {
    clearInterval(timer);
    window.removeEventListener("keydown", handleKey);
  });
</script>

<header class="topbar">
  <div class="topbar-left">
    <Logo size={48} />
    <span class="app-title">Hearth</span>
  </div>

  <div class="topbar-right">
    <span class="clock">{time}</span>

    <button
      class="icon-btn"
      class:focused={focusZone === "topbar" && focusedTopbarIndex === 0}
      title="Settings"
      onclick={() => { navigation.goTo("settings"); }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06
                 a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09
                 A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83
                 l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09
                 A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83
                 l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09
                 a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83
                 l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09
                 a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </button>

    <button
      class="icon-btn"
      class:focused={focusZone === "topbar" && focusedTopbarIndex === 1}
      title="Power"
      onclick={() => navigation.openPowerMenu()}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
        <line x1="12" y1="2" x2="12" y2="12"/>
      </svg>
    </button>
  </div>
</header>

<style>
  .topbar {
    height: var(--topbar-h);
    min-height: var(--topbar-h);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--edge);
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .app-title {
    font-size: 2.2rem;
    font-weight: 800;
    color: var(--text);
    letter-spacing: -0.02em;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .clock {
    font-size: 1.8rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    color: var(--text);
    min-width: 5ch;
    text-align: right;
  }

  .icon-btn {
    background: none;
    border: 2px solid transparent;
    color: var(--text-muted);
    padding: 8px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color var(--transition), background var(--transition), border-color var(--transition);
  }

  .icon-btn:hover {
    color: var(--text);
    background: var(--surface-2);
  }

  .icon-btn.focused {
    color: var(--text);
    border-color: var(--accent);
    box-shadow: 0 0 12px var(--accent-glow);
  }
</style>
