<script lang="ts">
  import { onMount } from "svelte";
  import { convertFileSrc } from "@tauri-apps/api/core";
  import Topbar from "./components/Topbar.svelte";
  import PowerMenu from "./components/PowerMenu.svelte";
  import HomeScreen from "./views/HomeScreen.svelte";
  import FileManager from "./views/FileManager.svelte";
  import Settings from "./views/Settings.svelte";
  import { navigation } from "./stores/navigation";
  import { settings } from "./stores/settings";

  onMount(async () => {
    await settings.load();
  });

  let currentView = $derived($navigation.currentView);
  let powerMenuOpen = $derived($navigation.powerMenuOpen);
  let accent = $derived($settings.appearance.accent_color);
  let backgroundPath = $derived($settings.appearance.background_path);

  // Convert a filesystem path to an asset URL the webview can load
  let backgroundUrl = $derived(
    backgroundPath ? convertFileSrc(backgroundPath) : ""
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
    background: rgba(13, 13, 13, 0.6);
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
