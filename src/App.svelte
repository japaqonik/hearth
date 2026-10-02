<script lang="ts">
  import { onMount } from "svelte";
  import "./app.css";
  import Topbar from "./components/Topbar.svelte";
  import HomeScreen from "./views/HomeScreen.svelte";
  import FileManager from "./views/FileManager.svelte";
  import Settings from "./views/Settings.svelte";
  import { navigation } from "./stores/navigation";
  import { settings } from "./stores/settings";

  onMount(async () => {
    await settings.load();
  });

  let currentView = $derived($navigation.currentView);
</script>

<div class="layout">
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
</div>

<style>
  .layout {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
  }
</style>
