<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Breadcrumb from "../components/Breadcrumb.svelte";
  import FileList from "../components/FileList.svelte";
  import BottomBar from "../components/BottomBar.svelte";
  import RenameDialog from "../components/RenameDialog.svelte";
  import ConfirmDialog from "../components/ConfirmDialog.svelte";
  import { navigation } from "../stores/navigation";
  import { filemanager } from "../stores/filemanager";
  import { settings } from "../stores/settings";
  import { openFile } from "../lib/tauri";
  import { registerInput } from "../lib/input";
  import type { Action } from "../lib/keyboard";
  import type { FileEntry } from "../lib/tauri";

  const PAGE = 10;

  let currentPath = $derived($filemanager.currentPath);
  let entries = $derived($filemanager.entries);
  let selectedIndex = $derived($filemanager.selectedIndex);
  let error = $derived($filemanager.error);
  let clipboard = $derived($filemanager.clipboard);
  let showHidden = $derived($settings.media.show_hidden);
  let focusZone = $derived($navigation.focusZone);
  let powerMenuOpen = $derived($navigation.powerMenuOpen);
  let launching = $derived($navigation.launching);

  // Options mode (toggled with M) and dialog state
  let optionsMode = $state(false);
  let renameOpen = $state(false);
  let confirmOpen = $state(false);

  let selectedEntry = $derived(entries[selectedIndex] as FileEntry | undefined);

  // Any modal/overlay that should block list navigation
  let dialogOpen = $derived(renameOpen || confirmOpen);

  let listActive = $derived(
    focusZone === "grid" && !powerMenuOpen && !dialogOpen
  );

  // Transient message in the bottom bar
  let message = $state<string | null>(null);
  let messageTimer: ReturnType<typeof setTimeout>;

  function flash(msg: string) {
    message = msg;
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => (message = null), 2000);
  }

  // ── Bottom bar hints ────────────────────────────────────
  let normalHints = [
    { keys: "↑↓", label: "Navigate" },
    { keys: "Enter", label: "Open" },
    { keys: "Backspace", label: "Up" },
    { keys: "Esc", label: "Back" },
    { keys: "M", label: "Options" },
  ];

  let optionHints = $derived([
    { keys: "H", label: showHidden ? "Hide hidden" : "Show hidden" },
    { keys: "C", label: "Copy" },
    { keys: "X", label: "Cut" },
    { keys: "V", label: "Paste", available: clipboard !== null },
    { keys: "R", label: "Rename" },
    { keys: "Del", label: "Delete" },
    { keys: "Esc", label: "Close" },
  ]);

  // ── Actions ─────────────────────────────────────────────
  async function activate(entry: FileEntry) {
    if (entry.is_dir) {
      await filemanager.enterDir(entry.path, showHidden);
    } else {
      // Opening a file launches an external player — show the launch overlay.
      navigation.startLaunching(entry.name);
      try {
        await openFile(entry.path, $settings);
      } catch (e) {
        navigation.stopLaunching();
        flash(String(e));
      }
    }
  }

  async function toggleHidden() {
    const next = { ...$settings };
    next.media.show_hidden = !next.media.show_hidden;
    await settings.save(next);
    await filemanager.reload(next.media.show_hidden);
  }

  async function doPaste() {
    if (!clipboard) return;
    const err = await filemanager.paste(clipboard, showHidden);
    if (err) flash(err);
  }

  async function confirmRename(newName: string) {
    renameOpen = false;
    if (!selectedEntry) return;
    const err = await filemanager.rename(selectedEntry.path, newName, showHidden);
    if (err) flash(err);
  }

  async function confirmDelete() {
    confirmOpen = false;
    if (!selectedEntry) return;
    const err = await filemanager.trash(selectedEntry.path, showHidden);
    if (err) flash(err);
    else flash(`Moved "${selectedEntry.name}" to trash`);
  }

  // ── Input ───────────────────────────────────────────────
  function handleAction(action: Action | null, e: KeyboardEvent | MouseEvent) {
    // Dialogs and overlays handle their own input
    if (dialogOpen || powerMenuOpen || focusZone === "topbar" || launching) return;

    const count = entries.length;
    const isKey = e instanceof KeyboardEvent;

    // Options-mode-specific letter shortcuts (file operations, keyboard only)
    if (optionsMode) {
      if (isKey) {
        switch ((e as KeyboardEvent).key.toLowerCase()) {
          case "h":
            e.preventDefault();
            toggleHidden();
            return;
          case "c":
            e.preventDefault();
            if (selectedEntry) {
              filemanager.copyToClipboard(selectedEntry);
              flash(`Copied "${selectedEntry.name}"`);
            }
            return;
          case "x":
            e.preventDefault();
            if (selectedEntry) {
              filemanager.cutToClipboard(selectedEntry);
              flash(`Cut "${selectedEntry.name}"`);
            }
            return;
          case "v":
            e.preventDefault();
            doPaste();
            return;
          case "r":
            e.preventDefault();
            if (selectedEntry) renameOpen = true;
            return;
        }
      }
      if (action === "delete") {
        e.preventDefault();
        if (selectedEntry) confirmOpen = true;
        return;
      }
      if (action === "back" || action === "options") {
        e.preventDefault();
        optionsMode = false;
        return;
      }
      // fall through for navigation actions below
    }

    if (!action) return;

    switch (action) {
      case "down":
        e.preventDefault();
        if (count > 0) filemanager.setSelected(Math.min(selectedIndex + 1, count - 1));
        break;
      case "up":
        e.preventDefault();
        if (selectedIndex === 0 && !optionsMode) {
          navigation.enterTopbar();
        } else if (count > 0) {
          filemanager.setSelected(Math.max(selectedIndex - 1, 0));
        }
        break;
      case "pageDown":
        e.preventDefault();
        if (count > 0) filemanager.setSelected(Math.min(selectedIndex + PAGE, count - 1));
        break;
      case "pageUp":
        e.preventDefault();
        if (count > 0) filemanager.setSelected(Math.max(selectedIndex - PAGE, 0));
        break;
      case "home":
        e.preventDefault();
        if (count > 0) filemanager.setSelected(0);
        break;
      case "end":
        e.preventDefault();
        if (count > 0) filemanager.setSelected(count - 1);
        break;
      case "confirm":
        e.preventDefault();
        if (count > 0) activate(entries[selectedIndex]);
        break;
      case "left":
        // Left goes up a directory level
        e.preventDefault();
        filemanager.goUp(showHidden);
        break;
      case "back":
        // Back returns to the home screen
        e.preventDefault();
        navigation.goBack();
        break;
      case "options":
        e.preventDefault();
        optionsMode = true;
        break;
    }
  }

  let teardown: () => void;
  onMount(async () => {
    teardown = registerInput(handleAction);
    await filemanager.init(showHidden, $settings.media.media_root);
  });

  onDestroy(() => {
    teardown?.();
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
    hints={optionsMode ? optionHints : normalHints}
    {optionsMode}
    message={message ?? error}
  />
</div>

{#if renameOpen && selectedEntry}
  <RenameDialog
    initialName={selectedEntry.name}
    onconfirm={confirmRename}
    oncancel={() => (renameOpen = false)}
  />
{/if}

{#if confirmOpen && selectedEntry}
  <ConfirmDialog
    title="Move to Trash"
    message={`Move "${selectedEntry.name}" to the trash?`}
    confirmLabel="Move to Trash"
    onconfirm={confirmDelete}
    oncancel={() => (confirmOpen = false)}
  />
{/if}

<style>
  .filemanager {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
  }
</style>
