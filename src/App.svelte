<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { convertFileSrc } from "@tauri-apps/api/core";
  import Topbar from "./components/Topbar.svelte";
  import PowerMenu from "./components/PowerMenu.svelte";
  import LaunchOverlay from "./components/LaunchOverlay.svelte";
  import HomeScreen from "./views/HomeScreen.svelte";
  import FileManager from "./views/FileManager.svelte";
  import Settings from "./views/Settings.svelte";
  import { navigation } from "./stores/navigation";
  import { settings } from "./stores/settings";
  import defaultBackground from "./assets/backgrounds/default.jpg";

  // Safety-net timeout: if focus-loss never fires (compositor quirk), clear the
  // launch overlay after this long so it can never get stuck.
  const LAUNCH_TIMEOUT_MS = 8000;
  let launchTimer: ReturnType<typeof setTimeout> | undefined;

  // When the launched app's window takes over, our WebView loses focus — the DOM
  // `blur` event fires. We dismiss the overlay then. (No Tauri permission needed.)
  function onBlur() {
    if ($navigation.launching) clearLaunch();
  }

  function clearLaunch() {
    clearTimeout(launchTimer);
    navigation.stopLaunching();
  }

  onMount(async () => {
    await settings.load();
    window.addEventListener("blur", onBlur);
  });

  onDestroy(() => window.removeEventListener("blur", onBlur));

  // When launching begins, arm the fallback timeout.
  let launching = $derived($navigation.launching);
  let launchingName = $derived($navigation.launchingName);
  $effect(() => {
    if (launching) {
      clearTimeout(launchTimer);
      launchTimer = setTimeout(() => navigation.stopLaunching(), LAUNCH_TIMEOUT_MS);
    }
  });

  let currentView = $derived($navigation.currentView);
  let powerMenuOpen = $derived($navigation.powerMenuOpen);
  let accent = $derived($settings.appearance.accent_color);
  let backgroundPath = $derived($settings.appearance.background_path);

  // Background: a user-chosen image if set, otherwise the bundled default wallpaper.
  let backgroundUrl = $derived(
    backgroundPath ? convertFileSrc(backgroundPath) : defaultBackground
  );

  // Apply accent color as a CSS variable override on :root
  $effect(() => {
    if (accent) {
      document.documentElement.style.setProperty("--accent", accent);
      // Derive a translucent glow from the accent
      document.documentElement.style.setProperty("--accent-glow", hexToGlow(accent));
    }
  });

  function hexToGlow(hex: string): string {
    const m = hex.replace("#", "");
    if (m.length !== 6) return "rgba(229, 9, 20, 0.35)";
    const r = parseInt(m.slice(0, 2), 16);
    const g = parseInt(m.slice(2, 4), 16);
    const b = parseInt(m.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.35)`;
  }
</script>

<div
  class="layout"
  class:has-bg={!!backgroundUrl}
  style={backgroundUrl ? `background-image: url('${backgroundUrl}')` : ""}
>
  <Topbar />

  <main class="content">
    {#if currentView === "home"}
      <HomeScreen />
    {:else if currentView === "filemanager"}
      <FileManager />
    {:else if currentView === "settings"}
      <Settings />
    {/if}
  </main>

  {#if powerMenuOpen}
    <PowerMenu />
  {/if}

  {#if launching}
    <LaunchOverlay appName={launchingName} />
  {/if}
</div>

<style>
  .layout {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    background-size: cover;
    background-position: center;
  }

  /* Dark overlay for legibility when a background image is set */
  .layout.has-bg::before {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(15, 20, 25, 0.6);
    pointer-events: none;
    z-index: 0;
  }

  /* Keep the topbar (first child header) above the overlay */
  .layout :global(header) {
    position: relative;
    z-index: 1;
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
    position: relative;
    z-index: 1;
  }
</style>
