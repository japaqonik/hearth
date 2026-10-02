<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { navigation } from "../stores/navigation";

  let time = $state("");
  let timer: ReturnType<typeof setInterval>;

  function updateClock() {
    const now = new Date();
    time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  onMount(() => {
    updateClock();
    timer = setInterval(updateClock, 1000);
  });

  onDestroy(() => clearInterval(timer));
</script>

<header class="topbar">
  <div class="topbar-left">
    <span class="app-title">Pi Launcher</span>
  </div>

  <div class="topbar-right">
    <span class="clock">{time}</span>

    <button
      class="icon-btn"
      title="Settings"
      onclick={() => navigation.goTo("settings")}
    >
      <!-- gear icon -->
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"
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

    <!-- Power button — visual stub, no action in Phase 1 -->
    <button class="icon-btn icon-btn--dim" title="Power (not yet active)">
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"
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

  .app-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-muted);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .clock {
    font-size: 1.4rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    color: var(--text);
    min-width: 5ch;
    text-align: right;
  }

  .icon-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    padding: 8px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color var(--transition), background var(--transition);
  }

  .icon-btn:hover,
  .icon-btn:focus-visible {
    color: var(--text);
    background: var(--surface-2);
  }

  .icon-btn--dim {
    opacity: 0.3;
  }
</style>
