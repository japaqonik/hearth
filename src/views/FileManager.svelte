<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Breadcrumb from "../components/Breadcrumb.svelte";
  import FileList from "../components/FileList.svelte";
  import BottomBar from "../components/BottomBar.svelte";
  import { navigation } from "../stores/navigation";
  import { filemanager } from "../stores/filemanager";
  import { settings } from "../stores/settings";
  import { openFile } from "../lib/tauri";
  import type { FileEntry } from "../lib/tauri";

  const PAGE = 10;

  const hints = [
    { keys: "↑↓", label: "Navigate" },
    { keys: "Enter", label: "Open" },
    { keys: "Backspace", label: "Up" },
    { keys: "Esc", label: "Back" },
  ];

  let currentPath = $derived($filemanager.currentPath);
  let entries = $derived($filemanager.entries);
  let selectedIndex = $derived($filemanager.selectedIndex);
  let error = $derived($filemanager.error);
  let showHidden = $derived($settings.media.show_hidden);
  let focusZone = $derived($navigation.focusZone);
  let powerMenuOpen = $derived($navigation.powerMenuOpen);

  // Only highlight a file when the list actually has focus
  let listActive = $derived(focusZone === "grid" && !powerMenuOpen);

  // Transient message shown in the bottom bar (e.g. unsupported file)
  let message = $state<string | null>(null);
  let messageTimer: ReturnType<typeof setTimeout>;

  function flash(msg: string) {
    message = msg;
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => (message = null), 4000);
  }

  async function activate(entry: FileEntry) {
    if (entry.is_dir) {
      await filemanager.enterDir(entry.path, showHidden);
    } else {
      try {
        await openFile(entry.path, $settings);
      } catch (e) {
        flash(String(e));
      }
    }
  }

  function handleKey(e: KeyboardEvent) {
    // Ignore keys when the power menu is open or the topbar has focus
    if (powerMenuOpen || focusZone === "topbar") return;

    const count = entries.length;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (count > 0) filemanager.setSelected(Math.min(selectedIndex + 1, count - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        // At the top of the list, hand off to the topbar
        if (selectedIndex === 0) {
          navigation.enterTopbar();
        } else if (count > 0) {
          filemanager.setSelected(Math.max(selectedIndex - 1, 0));
        }
        break;
      case "PageDown":
        e.preventDefault();
        if (count > 0) filemanager.setSelected(Math.min(selectedIndex + PAGE, count - 1));
        break;
      case "PageUp":
        e.preventDefault();
        if (count > 0) filemanager.setSelected(Math.max(selectedIndex - PAGE, 0));
        break;
      case "Home":
        e.preventDefault();
        if (count > 0) filemanager.setSelected(0);
        break;
      case "End":
        e.preventDefault();
        if (count > 0) filemanager.setSelected(count - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (count > 0) activate(entries[selectedIndex]);
        break;
      case "Backspace":
      case "ArrowLeft":
        e.preventDefault();
        filemanager.goUp(showHidden);
        break;
      case "Escape":
        e.preventDefault();
        navigation.goBack();
        break;
    }
  }

  onMount(async () => {
    window.addEventListener("keydown", handleKey);
    await filemanager.init(showHidden);
  });

  onDestroy(() => {
    window.removeEventListener("keydown", handleKey);
    clearTimeout(messageTimer);
  });
</script>

<div class="filemanager fade-in">
  <Breadcrumb path={currentPath} />

  <FileList
    {entries}
    {selectedIndex}
    active={listActive}
    onactivate={activate}
  />

  <BottomBar
    {hints}
    message={message ?? error}
  />
</div>

<style>
  .filemanager {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
  }
</style>
