<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { navigation } from "../stores/navigation";
  import { settings, effectiveKeymap } from "../stores/settings";
  import { launchApp, detectTerminal, autostartStatus, setAutostart } from "../lib/tauri";
  import type { Config, AppTile } from "../stores/settings";
  import { ACTION_LABELS, DEFAULT_KEYMAP, keyLabel, unreachableEssentialActions, tokenFromKeyboardEvent, tokenFromMouseEvent } from "../lib/keyboard";
  import type { Action, Keymap } from "../lib/keyboard";
  import { registerInput } from "../lib/input";
  import FilePicker from "../components/FilePicker.svelte";
  import RenameDialog from "../components/RenameDialog.svelte";
  import ConfirmDialog from "../components/ConfirmDialog.svelte";

  const SECTIONS = ["Appearance", "Media", "Apps", "Controls", "System"] as const;
  type Section = typeof SECTIONS[number];

  const ACCENT_COLORS = [
    "#2dd4bf", "#38bdf8", "#a78bfa", "#4ade80",
    "#f59e42", "#fb7185", "#facc15", "#eaf0f2",
  ];

  // Focus model: "sections" (left list) or "content" (right panel)
  let zone = $state<"sections" | "content">("sections");
  let sectionIndex = $state(0);
  let contentIndex = $state(0);

  // Appearance section uses a 2D model: row 0 = swatches (horizontal), row 1 = background
  let appearanceRow = $state(0);
  let swatchIndex = $state(0);

  let section = $derived(SECTIONS[sectionIndex]);
  let cfg = $derived($settings);

  // Overlays
  let pickerOpen = $state(false);
  let renameOpen = $state(false);
  let confirmOpen = $state(false);
  let editingTileIndex = $state(-1);
  let renameTarget = $state<"root" | "terminal" | "tileName" | "tileCommand" | null>(null);
  let renameInitial = $state("");

  let powerMenuOpen = $derived($navigation.powerMenuOpen);
  let focusZone = $derived($navigation.focusZone);

  let dialogOpen = $derived(pickerOpen || renameOpen || confirmOpen);

  // Transient toast message
  let message = $state<string | null>(null);
  let messageTimer: ReturnType<typeof setTimeout>;
  function flash(msg: string) {
    message = msg;
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => (message = null), 3000);
  }

  // Number of focusable rows in each section's content
  let contentCount = $derived.by(() => {
    switch (section) {
      case "Appearance": return ACCENT_COLORS.length + 1; // colors + background row
      case "Media":      return 1;                         // media root
      case "Apps":       return cfg.apps.tiles.length + 1; // tiles + "Add tile"
      case "Controls":   return ACTION_LABELS.length + 1;  // actions + reset row
      case "System":     return 2;                         // autostart toggle + open terminal
      default:           return 0;
    }
  });

  // Rebind capture state for the Controls section
  let rebinding = $state(false);
  let rebindAction = $state<Action | null>(null);

  // Scroll the focused content row into view as the selection moves
  $effect(() => {
    if (zone !== "content") return;
    // Reference contentIndex/section so the effect re-runs on change
    const _ = contentIndex + section;
    queueMicrotask(() => {
      const el = document.querySelector(
        `[data-content-index="${contentIndex}"]`
      ) as HTMLElement | null;
      el?.scrollIntoView({ block: "nearest" });
    });
  });

  async function update(mut: (c: Config) => void) {
    const next = structuredClone($settings);
    mut(next);
    await settings.save(next);
  }

  // ── Appearance actions ──
  async function setAccent(color: string) {
    await update((c) => (c.appearance.accent_color = color));
  }
  function openBackgroundPicker() {
    pickerOpen = true;
  }
  async function clearBackground() {
    await update((c) => (c.appearance.background_path = ""));
  }

  // ── Apps actions ──
  async function addTile() {
    await update((c) =>
      c.apps.tiles.push({ name: "New App", command: "", args: [], icon: "globe" })
    );
  }
  async function deleteTile(index: number) {
    await update((c) => c.apps.tiles.splice(index, 1));
    contentIndex = Math.min(contentIndex, contentCount - 2);
  }

  // ── System actions ──
  // Real autostart state is the presence of the .desktop file, read on mount
  let autostartEnabled = $state(false);

  async function toggleAutostart() {
    const next = !autostartEnabled;
    try {
      await setAutostart(next);
      autostartEnabled = next;
      // Keep the config flag in sync for display/consistency
      await update((c) => (c.system.autostart = next));
    } catch (e) {
      flash(`Autostart change failed: ${e}`);
    }
  }
  async function openTerminal() {
    // Always resolve to a terminal that actually exists on this system
    let term = cfg.system.terminal;
    try {
      const detected = await detectTerminal();
      // If config has nothing useful, or detection found a real one, prefer detected
      if (!term || term === "xterm") {
        term = detected;
        await update((c) => (c.system.terminal = term));
      }
    } catch {}

    try {
      await launchApp(term, []);
    } catch (e) {
      // Fall back to a detected terminal if the configured one failed
      try {
        const detected = await detectTerminal();
        if (detected !== term) {
          await launchApp(detected, []);
          await update((c) => (c.system.terminal = detected));
          return;
        }
      } catch {}
      flash(`Could not open terminal "${term}": ${e}`);
    }
  }

  // ── Controls (keybinding) actions ──
  function currentKeysFor(action: Action): string[] {
    const configured = cfg.controls?.keymap?.[action];
    if (configured && configured.length > 0) return configured;
    return DEFAULT_KEYMAP[action];
  }

  function startRebind(action: Action) {
    rebindAction = action;
    rebinding = true;
  }

  // Core rebind logic — works on a canonical input token (key name or MouseN).
  async function commitRebind(token: string) {
    const action = rebindAction;
    if (!action) return;

    const norm = (t: string) => (t.length === 1 ? t.toLowerCase() : t);
    const target = norm(token);
    const sameToken = (t: string) => norm(t) === target;

    // "Move" semantics: a token belongs to exactly one action. Assigning it to
    // `action` removes it from whatever else held it.
    const current = $effectiveKeymap;
    const candidate: Keymap = {} as Keymap;
    for (const a of Object.keys(current) as Action[]) {
      candidate[a] = current[a].filter((t) => !sameToken(t));
    }
    candidate[action] = [token];

    // Reject if this would strip the last binding from any essential action.
    const broken = unreachableEssentialActions(candidate);
    if (broken.length > 0) {
      const labels = broken
        .map((a) => ACTION_LABELS.find((x) => x.action === a)?.label ?? a)
        .join(", ");
      rebinding = false;
      rebindAction = null;
      flash(`Can't bind — would leave no key for: ${labels}. Rebind that first.`);
      return;
    }

    await update((c) => {
      c.controls = { keymap: {} };
      for (const a of Object.keys(candidate) as Action[]) {
        c.controls.keymap[a] = candidate[a];
      }
    });

    rebinding = false;
    rebindAction = null;
    flash(`Bound "${action}" to ${keyLabel(token)}`);
  }

  function captureRebind(e: KeyboardEvent) {
    if (!rebinding) return;
    // Called while rebinding — the next key press becomes the new binding
    e.preventDefault();
    e.stopPropagation();

    // Escape always cancels the rebind without changing anything
    if (e.key === "Escape") {
      rebinding = false;
      rebindAction = null;
      return;
    }

    commitRebind(tokenFromKeyboardEvent(e));
  }

  function captureRebindMouse(e: MouseEvent) {
    if (!rebinding) return;
    // The next mouse button press becomes the new binding
    e.preventDefault();
    e.stopPropagation();
    commitRebind(tokenFromMouseEvent(e));
  }

  async function resetKeymap() {
    await update((c) => {
      c.controls = { keymap: {} };
    });
    flash("Controls reset to defaults");
  }

  // ── Rename dialog dispatch ──
  function startRename(target: typeof renameTarget, initial: string, tileIndex = -1) {
    renameTarget = target;
    renameInitial = initial;
    editingTileIndex = tileIndex;
    renameOpen = true;
  }

  async function confirmRename(value: string) {
    renameOpen = false;
    await update((c) => {
      if (renameTarget === "root") c.media.media_root = value;
      else if (renameTarget === "terminal") c.system.terminal = value;
      else if (renameTarget === "tileName" && editingTileIndex >= 0)
        c.apps.tiles[editingTileIndex].name = value;
      else if (renameTarget === "tileCommand" && editingTileIndex >= 0)
        c.apps.tiles[editingTileIndex].command = value;
    });
    renameTarget = null;
    editingTileIndex = -1;
  }

  // ── Content activation (Enter on a content row) ──
  function activateContent() {
    switch (section) {
      case "Media":
        startRename("root", cfg.media.media_root);
        break;
      case "Apps":
        if (contentIndex < cfg.apps.tiles.length) {
          // Edit tile name on Enter; delete via Del handled in key handler
          startRename("tileName", cfg.apps.tiles[contentIndex].name, contentIndex);
        } else {
          addTile();
        }
        break;
      case "Controls":
        if (contentIndex < ACTION_LABELS.length) {
          startRebind(ACTION_LABELS[contentIndex].action);
        } else {
          resetKeymap();
        }
        break;
      case "System":
        if (contentIndex === 0) toggleAutostart();
        else openTerminal();
        break;
    }
  }

  function handleAppearanceKey(action: string, e: KeyboardEvent | MouseEvent) {
    if (appearanceRow === 0) {
      // Swatch row — horizontal
      switch (action) {
        case "right":
          e.preventDefault();
          swatchIndex = Math.min(swatchIndex + 1, ACCENT_COLORS.length - 1);
          break;
        case "left":
          e.preventDefault();
          if (swatchIndex === 0) {
            zone = "sections";
          } else {
            swatchIndex = swatchIndex - 1;
          }
          break;
        case "down":
          e.preventDefault();
          appearanceRow = 1;
          break;
        case "confirm":
          e.preventDefault();
          setAccent(ACCENT_COLORS[swatchIndex]);
          break;
      }
    } else {
      // Background row
      switch (action) {
        case "up":
          e.preventDefault();
          appearanceRow = 0;
          break;
        case "left":
          e.preventDefault();
          zone = "sections";
          break;
        case "confirm":
          e.preventDefault();
          openBackgroundPicker();
          break;
      }
    }
  }

  function handleAction(action: Action | null, e: KeyboardEvent | MouseEvent) {
    // While rebinding, the dedicated capture listeners handle input
    if (rebinding) return;

    if (dialogOpen || powerMenuOpen || focusZone === "topbar") return;

    if (zone === "sections") {
      if (!action) return;
      switch (action) {
        case "down":
          e.preventDefault();
          sectionIndex = Math.min(sectionIndex + 1, SECTIONS.length - 1);
          break;
        case "up":
          e.preventDefault();
          if (sectionIndex === 0) navigation.enterTopbar();
          else sectionIndex = Math.max(sectionIndex - 1, 0);
          break;
        case "right":
        case "confirm":
          e.preventDefault();
          zone = "content";
          contentIndex = 0;
          appearanceRow = 0;
          break;
        case "back":
          e.preventDefault();
          navigation.goBack();
          break;
      }
      return;
    }

    // zone === "content"
    if (!action) return;

    // Back always returns to the section list from content
    if (action === "back") {
      e.preventDefault();
      zone = "sections";
      return;
    }

    if (section === "Appearance") {
      handleAppearanceKey(action, e);
      return;
    }

    // Default linear navigation for Media / Apps / Controls / System
    switch (action) {
      case "left":
        e.preventDefault();
        zone = "sections";
        break;
      case "down":
        e.preventDefault();
        contentIndex = Math.min(contentIndex + 1, contentCount - 1);
        break;
      case "up":
        e.preventDefault();
        contentIndex = Math.max(contentIndex - 1, 0);
        break;
      case "confirm":
        e.preventDefault();
        activateContent();
        break;
      case "editCommand":
        // Edit command of a tile (secondary action in Apps)
        if (section === "Apps" && contentIndex < cfg.apps.tiles.length) {
          e.preventDefault();
          startRename("tileCommand", cfg.apps.tiles[contentIndex].command, contentIndex);
        }
        break;
      case "delete":
        if (section === "Apps" && contentIndex < cfg.apps.tiles.length) {
          e.preventDefault();
          editingTileIndex = contentIndex;
          confirmOpen = true;
        }
        break;
    }
  }

  let teardown: () => void;
  onMount(async () => {
    // Capture-phase listeners handle rebinding (they no-op unless rebinding and
    // stopPropagation so nav doesn't also fire). Both key and mouse are accepted.
    window.addEventListener("keydown", captureRebind, true);
    window.addEventListener("mousedown", captureRebindMouse, true);
    // Main navigation (keyboard + bound mouse buttons)
    teardown = registerInput(handleAction);
    try {
      autostartEnabled = await autostartStatus();
    } catch {}
  });
  onDestroy(() => {
    window.removeEventListener("keydown", captureRebind, true);
    window.removeEventListener("mousedown", captureRebindMouse, true);
    teardown?.();
    clearTimeout(messageTimer);
  });
</script>

<div class="settings fade-in">
  <!-- Section list -->
  <nav class="sections" class:active={zone === "sections"}>
    {#each SECTIONS as s, i}
      <button
        class="section-item"
        class:focused={zone === "sections" && sectionIndex === i && focusZone !== "topbar"}
        class:current={sectionIndex === i}
        onclick={() => { sectionIndex = i; zone = "content"; contentIndex = 0; }}
      >
        {s}
      </button>
    {/each}
  </nav>

  <!-- Content panel -->
  <div class="content">
    {#if section === "Appearance"}
      <h2>Appearance</h2>

      <div class="field-group">
        <span class="field-label">Accent color</span>
        <div class="swatches">
          {#each ACCENT_COLORS as color, i}
            <button
              class="swatch"
              class:focused={zone === "content" && appearanceRow === 0 && swatchIndex === i}
              class:selected={cfg.appearance.accent_color === color}
              style="background: {color}"
              onclick={() => { appearanceRow = 0; swatchIndex = i; setAccent(color); }}
              aria-label={color}
            ></button>
          {/each}
        </div>
      </div>

      <div class="field-group">
        <span class="field-label">Background image</span>
        <div class="row-field"
             class:focused={zone === "content" && appearanceRow === 1}>
          <span class="value truncate">
            {cfg.appearance.background_path || "None (default dark)"}
          </span>
          <div class="row-actions">
            <button class="btn-sm" onclick={() => { appearanceRow = 1; openBackgroundPicker(); }}>Choose…</button>
            {#if cfg.appearance.background_path}
              <button class="btn-sm" onclick={clearBackground}>Clear</button>
            {/if}
          </div>
        </div>
      </div>

    {:else if section === "Media"}
      <h2>Media</h2>
      <div class="field-group">
        <span class="field-label">Files opens at</span>
        <button
          class="row-field editable"
          class:focused={zone === "content" && contentIndex === 0}
          onclick={() => { contentIndex = 0; startRename("root", cfg.media.media_root); }}
        >
          <span class="value truncate">{cfg.media.media_root}</span>
          <span class="hint-inline">Enter to edit</span>
        </button>
      </div>

    {:else if section === "Apps"}
      <h2>Apps</h2>
      <p class="section-hint">Enter: edit name &nbsp; E: edit command &nbsp; Del: remove</p>
      <div class="tile-list">
        {#each cfg.apps.tiles as tile, i}
          <div
            class="tile-row"
            class:focused={zone === "content" && contentIndex === i}
          >
            <span class="tile-name">{tile.name}</span>
            <span class="tile-cmd truncate">{tile.command || "(no command)"}</span>
          </div>
        {/each}
        <button
          class="tile-row add"
          class:focused={zone === "content" && contentIndex === cfg.apps.tiles.length}
          onclick={() => { contentIndex = cfg.apps.tiles.length; addTile(); }}
        >
          + Add app
        </button>
      </div>

    {:else if section === "Controls"}
      <h2>Controls</h2>
      <p class="section-hint">Enter on an action, then press the key to bind it. Esc cancels a rebind.</p>
      <div class="controls-list">
        {#each ACTION_LABELS as item, i}
          <div
            class="row-field"
            class:focused={zone === "content" && contentIndex === i}
            data-content-index={i}
          >
            <span class="value">{item.label}</span>
            <span class="keys">
              {#if rebinding && rebindAction === item.action}
                <span class="listening">Press a key…</span>
              {:else}
                {#each currentKeysFor(item.action) as k}
                  <kbd>{keyLabel(k)}</kbd>
                {/each}
              {/if}
            </span>
          </div>
        {/each}
        <button
          class="row-field editable reset-row"
          class:focused={zone === "content" && contentIndex === ACTION_LABELS.length}
          data-content-index={ACTION_LABELS.length}
          onclick={() => { contentIndex = ACTION_LABELS.length; resetKeymap(); }}
        >
          Reset all to defaults
        </button>
      </div>

    {:else if section === "System"}
      <h2>System</h2>
      <div class="field-group">
        <button
          class="row-field editable"
          class:focused={zone === "content" && contentIndex === 0}
          onclick={() => { contentIndex = 0; toggleAutostart(); }}
        >
          <span class="value">Autostart on boot</span>
          <span class="toggle" class:on={autostartEnabled}>
            {autostartEnabled ? "ON" : "OFF"}
          </span>
        </button>
        <p class="note">Launches Hearth when you log into the desktop.</p>
      </div>

      <div class="field-group">
        <button
          class="row-field editable"
          class:focused={zone === "content" && contentIndex === 1}
          onclick={() => { contentIndex = 1; openTerminal(); }}
        >
          <span class="value">Open Terminal</span>
          <span class="hint-inline">{cfg.system.terminal}</span>
        </button>
      </div>
    {/if}
  </div>
</div>

{#if message}
  <div class="toast">{message}</div>
{/if}

{#if pickerOpen}
  <FilePicker
    extensions={["jpg", "jpeg", "png", "webp", "bmp", "gif"]}
    onselect={async (path) => {
      pickerOpen = false;
      await update((c) => (c.appearance.background_path = path));
    }}
    oncancel={() => (pickerOpen = false)}
  />
{/if}

{#if renameOpen}
  <RenameDialog
    initialName={renameInitial}
    onconfirm={confirmRename}
    oncancel={() => { renameOpen = false; renameTarget = null; editingTileIndex = -1; }}
  />
{/if}

{#if confirmOpen && editingTileIndex >= 0}
  <ConfirmDialog
    title="Remove App"
    message={`Remove "${cfg.apps.tiles[editingTileIndex]?.name}" from the launcher?`}
    confirmLabel="Remove"
    onconfirm={() => { const idx = editingTileIndex; confirmOpen = false; editingTileIndex = -1; deleteTile(idx); }}
    oncancel={() => { confirmOpen = false; editingTileIndex = -1; }}
  />
{/if}

<style>
  .settings {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
  }

  .sections {
    width: 240px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: var(--edge) 16px;
    background: var(--surface);
    border-right: 1px solid var(--border);
  }

  .section-item {
    text-align: left;
    padding: 14px 20px;
    background: transparent;
    border: 2px solid transparent;
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    font-size: 1.1rem;
    font-weight: 500;
    transition: color var(--transition), background var(--transition);
  }

  .section-item.current {
    color: var(--text);
  }

  .section-item.focused {
    border-color: var(--accent);
    background: var(--surface-2);
    color: var(--text);
    box-shadow: 0 0 12px var(--accent-glow);
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: var(--edge);
    display: flex;
    flex-direction: column;
    gap: 28px;
    min-width: 0;
  }

  h2 {
    color: var(--text);
  }

  .section-hint {
    color: var(--text-dim);
    font-size: 0.85rem;
    margin-top: -16px;
  }

  .note {
    color: var(--text-dim);
    font-size: 0.85rem;
    margin-top: 10px;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .field-label {
    color: var(--text-muted);
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .swatches {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
  }

  .swatch {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 3px solid transparent;
    transition: transform var(--transition), border-color var(--transition);
  }

  .swatch.selected {
    border-color: var(--text);
  }

  .swatch.focused {
    border-color: var(--text);
    transform: scale(1.15);
    box-shadow: 0 0 16px var(--accent-glow);
  }

  .row-field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 16px 20px;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    width: 100%;
    text-align: left;
    color: var(--text);
  }

  .row-field.editable {
    cursor: pointer;
  }

  .row-field.focused {
    border-color: var(--accent);
    box-shadow: 0 0 12px var(--accent-glow);
  }

  .value {
    font-size: 1rem;
    min-width: 0;
  }

  .row-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .btn-sm {
    padding: 6px 14px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-size: 0.85rem;
  }

  .hint-inline {
    color: var(--text-dim);
    font-size: 0.8rem;
    flex-shrink: 0;
  }

  .toggle {
    font-weight: 700;
    font-size: 0.85rem;
    padding: 4px 12px;
    border-radius: 6px;
    background: var(--surface-3);
    color: var(--text-dim);
    flex-shrink: 0;
  }

  .toggle.on {
    background: var(--accent);
    color: #fff;
  }

  .tile-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .tile-row {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 14px 20px;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    width: 100%;
    text-align: left;
    color: var(--text);
  }

  .tile-row.focused {
    border-color: var(--accent);
    box-shadow: 0 0 12px var(--accent-glow);
  }

  .tile-name {
    font-weight: 600;
    min-width: 140px;
  }

  .tile-cmd {
    color: var(--text-muted);
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 0.9rem;
    min-width: 0;
  }

  .tile-row.add {
    justify-content: center;
    color: var(--text-muted);
    font-weight: 500;
  }

  .controls-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .keys {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-shrink: 0;
  }

  .keys kbd {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 3px 9px;
    font-size: 0.85rem;
    color: var(--text);
    min-width: 26px;
    text-align: center;
  }

  .listening {
    color: var(--accent);
    font-size: 0.9rem;
    font-weight: 600;
  }

  .reset-row {
    justify-content: center;
    color: var(--text-muted);
    margin-top: 8px;
  }

  .toast {
    position: fixed;
    bottom: var(--edge);
    left: 50%;
    transform: translateX(-50%);
    background: var(--surface-2);
    border: 1px solid var(--accent);
    color: var(--text);
    padding: 12px 24px;
    border-radius: var(--radius-sm);
    font-size: 0.95rem;
    max-width: 70vw;
    text-align: center;
    z-index: 130;
    animation: fadeIn 150ms ease;
  }
</style>
