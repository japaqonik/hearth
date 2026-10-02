# Pi Launcher — Implementation Specification

Raspberry Pi 5 media center app launcher with embedded file manager.  
Stack: **Tauri 2 (Rust backend) + Svelte 5 (frontend) + WebKitGTK**

---

## 1. Project Overview

Pi Launcher is a fullscreen application launcher designed to run on a Raspberry Pi 5
connected to a TV. It is controlled entirely by a remote keyboard — no mouse required.
It provides a home screen with app shortcuts, an embedded file manager for browsing
movie files, and basic system controls (background selection, settings, power).

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│                   WebKitGTK Window                  │
│  ┌───────────────────────────────────────────────┐  │
│  │              Svelte Frontend                  │  │
│  │  ┌──────────┐  ┌────────────┐  ┌──────────┐  │  │
│  │  │ Home     │  │ File       │  │ Settings │  │  │
│  │  │ Screen   │  │ Manager    │  │ Panel    │  │  │
│  │  └──────────┘  └────────────┘  └──────────┘  │  │
│  └────────────────────┬──────────────────────────┘  │
│                       │ Tauri IPC (invoke/listen)   │
│  ┌────────────────────▼──────────────────────────┐  │
│  │              Rust Backend (Tauri)             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────┐  │  │
│  │  │ Process  │  │   File   │  │  Settings  │  │  │
│  │  │ Launcher │  │  System  │  │  Store     │  │  │
│  │  └──────────┘  └──────────┘  └────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Key Principles

- **Frontend owns UI state**, Rust owns system state and I/O
- All system calls go through Tauri `invoke()` commands — never direct JS system access
- UI is a single-page app with view transitions, not multiple windows
- All interactive elements must be keyboard-focusable and navigable with arrow keys + Enter

---

## 3. Directory Structure

```
pi-launcher/
├── SPEC.md                    ← this file
├── src-tauri/                 ← Rust backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs            ← Tauri app entry point
│       ├── commands/
│       │   ├── mod.rs
│       │   ├── launcher.rs    ← process spawning (chromium, etc.)
│       │   ├── filesystem.rs  ← directory listing, file info
│       │   ├── settings.rs    ← read/write config file
│       │   └── power.rs       ← shutdown, reboot, suspend
│       └── models/
│           ├── mod.rs
│           ├── file_entry.rs  ← FileEntry struct (serialized to frontend)
│           └── config.rs      ← Config struct
├── src/                       ← Svelte frontend
│   ├── app.html
│   ├── app.css                ← global styles, CSS variables, animations
│   ├── App.svelte             ← root component, view router
│   ├── stores/
│   │   ├── navigation.ts      ← keyboard focus state machine
│   │   ├── settings.ts        ← reactive settings store
│   │   └── filemanager.ts     ← current path, selected index, history stack
│   ├── views/
│   │   ├── HomeScreen.svelte
│   │   ├── FileManager.svelte
│   │   └── Settings.svelte
│   ├── components/
│   │   ├── AppGrid.svelte     ← launcher icon grid
│   │   ├── AppTile.svelte     ← single launcher tile
│   │   ├── FileList.svelte    ← file/folder list in file manager
│   │   ├── FileEntry.svelte   ← single file row
│   │   ├── BottomBar.svelte   ← key hint bar + options mode toggle (File Manager)
│   │   ├── Topbar.svelte      ← clock, background btn, settings btn, power btn
│   │   ├── PowerMenu.svelte   ← shutdown/reboot/cancel overlay
│   │   ├── BackgroundPicker.svelte
│   │   └── SettingsPanel.svelte
│   └── lib/
│       ├── tauri.ts           ← typed wrappers around invoke()
│       ├── keyboard.ts        ← global keydown handler, focus grid logic
│       └── utils.ts           ← file size formatting, date formatting, etc.
├── package.json
├── svelte.config.js
└── vite.config.ts
```

---

## 4. Frontend Views

### 4.1 Home Screen

The default view. Contains:

- **AppGrid** — 2×N grid of app tiles (configurable in settings)
- **Topbar** — always visible at the top

App tiles defined in config (see Section 7). Initial set:

| Tile       | Icon       | Action                        |
|------------|------------|-------------------------------|
| Browser    | 🌐         | launch `chromium-browser`     |
| Files      | 📁         | open File Manager view        |
| Settings   | ⚙️         | open Settings view            |

Keyboard navigation on Home Screen:

- Arrow keys move focus between tiles in the grid
- Enter activates focused tile
- The Topbar buttons (background, settings, power) are reachable by pressing Up from the top row

### 4.2 File Manager

Activated from the Files tile. A general-purpose file browser — not limited to video.
Works like a smart TV file browser: shows everything, handles what it can, gracefully
declines what it can't.

Contains:

- **Breadcrumb bar** — current path, truncated from left if too long
- **FileList** — scrollable list of directory entries
- **Preview sidebar** (optional phase 2) — thumbnail/metadata for supported media

Behavior:

- Opens at the configured `media_root` path (default: `~`)
- Directories are listed before files, both sorted alphabetically (case-insensitive)
- **All files are shown** — no extension filtering on listing (mirrors smart TV behavior)
- Hidden files (dot-prefixed) are hidden by default, togglable via the options bar
- Selecting a directory navigates into it
- Selecting a file: the backend determines how to handle it based on its extension:
  - **Known video formats** (`.mkv .mp4 .avi .mov .m4v .ts .iso`): launch configured video player
  - **Known audio formats** (`.mp3 .flac .ogg .aac .wav .m4a`): launch configured audio player (VLC handles these too)
  - **Known image formats** (`.jpg .jpeg .png .gif .webp .bmp`): launch configured image viewer
  - **Unknown/unsupported format**: show an inline notification in the bottom bar —
    `"Unsupported file type — no app configured for .xyz"` — do not navigate away
- The list of known formats and their associated player commands is configurable in settings
- Backspace or Left arrow goes up one directory level
- History stack allows navigating back through previously visited directories

Keyboard navigation in File Manager:

- Up/Down move selection
- Enter opens directory or launches file
- Backspace / Left goes up one level
- Escape returns to Home Screen
- Page Up / Page Down scroll by 10 items

#### Bottom Bar (context-sensitive key hint + options menu)

A persistent bar at the bottom of the File Manager view. It has two modes:

**Normal mode** (always visible) — shows active key hints:
```
[↑↓] Navigate   [Enter] Open   [Esc] Back   [M] More options
```

**Options mode** (toggled by pressing `M`) — bottom bar switches to show file operation keys:
```
[H] Show hidden   [C] Copy   [X] Cut   [V] Paste   [R] Rename   [Del] Delete   [Esc] Close
```
Pressing Escape or `M` again in options mode returns to normal mode.

Design notes:
- The bar is always rendered at the bottom, never overlaps the file list
- In options mode, the file list remains visible and focused item does not change
- Active/available keys are highlighted; unavailable ones (e.g. Paste when clipboard is empty) are dimmed
- This is a Phase 3+ feature — in Phase 2 render the normal mode bar as a static hint display only, with no options mode yet

#### Delete behavior — move to XDG trash

Delete never permanently removes a file. Instead it moves the file to the
freedesktop XDG trash at `~/.local/share/Trash/`, writing the required
`.trashinfo` metadata (original path + deletion date) so the file is proper,
restorable trash recognized by all standard Linux tools.

- Phase 3 (now): delete = move to trash only. No in-app trash view.
- The user reclaims space externally — e.g. via `trash-cli` from a terminal
  (`trash-empty`, `trash-list`, `trash-restore`) or a system file manager.

#### Deferred: in-app Trash view (future enhancement)

Not built yet. Recorded for later. A dedicated Trash view inside the file
manager would:
- Read `~/.local/share/Trash/files` and the matching `.trashinfo` metadata
- Show each item's original location and deletion date
- Offer **Restore** (move back to original path), **Delete permanently**, and **Empty Trash**
- Rule: delete inside the trash view = permanent removal (with confirmation);
  delete in a normal folder = move to trash

This may never be needed if terminal access + `trash-cli` covers the workflow.

#### Deferred: copy/move progress bar (future enhancement)

Not built yet. Recorded for later. Currently `copy_entry` and `move_entry`
run synchronously on a blocking thread, so copying or moving a large file
freezes the UI until the operation completes. For large media files this is
a noticeable hang.

Future improvement:
- Rewrite copy/move in Rust to copy in chunks rather than one blocking call
- Emit progress events (bytes copied / total) via Tauri's event system
  (`app.emit(...)` on the Rust side, `listen(...)` on the frontend)
- Add a progress bar component (modal or inline in the bottom bar) that shows
  percentage and allows cancellation
- Applies to copy (`V` on a copied item) and cut+paste across filesystems
  (same-filesystem moves are instant via `rename` and need no progress)

#### Related: Terminal launch (see Settings / Apps)

A configurable terminal app (e.g. `lxterminal` on RPi OS, `gnome-terminal` on
Ubuntu) can be added as an app tile or settings action. Combined with
`trash-cli`, this lets an aware user fully manage the trash and the system
without leaving the launcher, potentially removing the need for an in-app
trash view.

### 4.3 Settings Panel

Slide-in overlay (not a full view swap). Contains sections:

- **Appearance** — theme (dark/light/auto), accent color picker, UI scale
- **Media** — media root path, video player command, file extensions filter
- **Apps** — edit app tiles (name, command, icon); includes optional Terminal launcher
- **System** — hostname display, autostart on boot toggle

Settings are saved to `~/.config/pi-launcher/config.toml` on every change.

### 4.4 Power Menu

Modal overlay triggered by the power button in the Topbar. Three options:

- Shutdown (`systemctl poweroff`)
- Reboot (`systemctl reboot`)
- Cancel

---

## 5. Rust Backend Commands

All Tauri commands are defined in `src-tauri/src/commands/`.
Each is registered in `main.rs` via `tauri::Builder`.

### 5.1 launcher.rs

```rust
// Launch any application by command string
#[tauri::command]
async fn launch_app(command: String, args: Vec<String>) -> Result<(), String>

// Get list of running PIDs for a command name (to detect if already running)
#[tauri::command]
async fn is_app_running(name: String) -> Result<bool, String>
```

Notes:
- Use `std::process::Command` with `spawn()` (non-blocking, detached)
- Chromium should be launched with `--kiosk` flag optionally, configurable
- Do not `wait()` on the child process — fire and forget

### 5.2 filesystem.rs

```rust
#[derive(Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: Option<u64>,       // None for directories
    pub modified: Option<u64>,   // Unix timestamp
    pub extension: Option<String>,
}

// List directory contents, sorted (dirs first, then files, both alphabetical)
#[tauri::command]
async fn list_directory(
    path: String,
    show_hidden: bool,
) -> Result<Vec<FileEntry>, String>

// Open a file — dispatches to the correct app based on extension.
// Returns Ok(()) if a handler was found and launched.
// Returns Err(message) if the extension is unknown/unconfigured — frontend
// displays the message in the bottom bar without navigating away.
#[tauri::command]
async fn open_file(path: String, config: Config) -> Result<(), String>

// Check if a path exists and is accessible
#[tauri::command]
async fn path_exists(path: String) -> Result<bool, String>

// File operations — Phase 3+
#[tauri::command]
async fn rename_entry(from: String, to: String) -> Result<(), String>

#[tauri::command]
async fn delete_entry(path: String) -> Result<(), String>

#[tauri::command]
async fn copy_entry(from: String, to: String) -> Result<(), String>

#[tauri::command]
async fn move_entry(from: String, to: String) -> Result<(), String>
```

Notes:
- Dirs always listed before files, both sorted alphabetically (case-insensitive)
- Returns error string on permission denied or path not found (frontend handles display)
- Use `std::fs::read_dir` with metadata; keep it simple, no async file I/O needed at this scale

### 5.3 settings.rs

```rust
#[tauri::command]
async fn load_settings() -> Result<Config, String>

#[tauri::command]
async fn save_settings(config: Config) -> Result<(), String>
```

Config file path: `~/.config/pi-launcher/config.toml`  
Create with defaults if missing.

### 5.4 power.rs

**Status: stub — power functionality is deferred to a separate project.**

The power button in the Topbar is rendered but wired to a no-op command.
Sleep/suspend logic will be implemented later and plugged in here.

```rust
// Stub — does nothing, returns Ok so the frontend does not show an error
#[tauri::command]
async fn power_action() -> Result<(), String> {
    Ok(())
}
```

When the sleep project is ready, this module will be replaced with:

```rust
// Future implementation
#[tauri::command]
async fn suspend() -> Result<(), String>

#[tauri::command]
async fn shutdown() -> Result<(), String>

#[tauri::command]
async fn reboot() -> Result<(), String>
```

Notes for future implementation:
- Use `std::process::Command::new("systemctl")` with `suspend` / `poweroff` / `reboot`
- Requires either a polkit rule or `/etc/sudoers.d/pi-launcher` entry for passwordless execution
- Recommended: polkit rule scoped to the pi-launcher process

---

## 6. Frontend State Management

### 6.1 Navigation Store (`stores/navigation.ts`)

Manages which view is active and which element has focus.

```typescript
type View = 'home' | 'filemanager' | 'settings' | 'power_menu'

interface NavigationState {
  currentView: View
  previousView: View | null
  focusedTileIndex: number   // index in current grid
}
```

### 6.2 File Manager Store (`stores/filemanager.ts`)

```typescript
interface FileManagerState {
  currentPath: string
  entries: FileEntry[]
  selectedIndex: number
  history: string[]          // navigation history stack
  loading: boolean
  error: string | null
}
```

### 6.3 Settings Store (`stores/settings.ts`)

Reactive store loaded from backend on startup. Any write immediately calls `save_settings`.

---

## 7. Configuration Schema

Stored as TOML at `~/.config/pi-launcher/config.toml`:

```toml
[appearance]
theme = "dark"               # "dark" | "light" | "auto"
accent_color = "#e50914"     # CSS hex color
ui_scale = 1.0               # float, 0.8–1.5
background_path = ""         # path to image, empty = default gradient

[media]
media_root = "~"                              # resolved to /home/rpac at runtime
show_hidden = false

# File type handlers — extension lists map to a player command + optional extra args.
# The file path is always appended as the last argument when launching.
# Add or override any entry to support additional formats.
[media.handlers.video]
extensions = ["mkv", "mp4", "avi", "mov", "m4v", "ts", "iso", "webm"]
command = "vlc"
args = ["--fullscreen", "--play-and-exit"]

[media.handlers.audio]
extensions = ["mp3", "flac", "ogg", "aac", "wav", "m4a", "opus"]
command = "vlc"
args = []

[media.handlers.image]
extensions = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"]
command = "eog"                               # GNOME image viewer; change to whatever is installed
args = []

[apps]
[[apps.tiles]]
name = "Browser"
command = "chromium-browser"
args = ["--start-maximized"]   # Alt+F4 to close and return to launcher
icon = "browser"               # maps to an SVG icon name

[[apps.tiles]]
name = "Files"
command = "__filemanager__"  # internal action, not a real command
icon = "folder-open"

[[apps.tiles]]
name = "Settings"
command = "__settings__"
icon = "settings"

[system]
autostart = false
hostname = ""                # populated at runtime
```

---

## 8. Keyboard Navigation Model

All keyboard handling goes through a single global `keydown` listener in `keyboard.ts`.
Focus is managed programmatically — no reliance on browser tab order.

### Focus Grid Logic

The app uses a virtual focus model: a `focusedIndex` integer tracked in the store.
On render, the component with matching index gets a `.focused` CSS class and calls
`element.scrollIntoView({ block: 'nearest' })`.

```
Home Screen grid (2 columns):
  Index: 0  1
         2  3
         4  5

Arrow keys: Right +1, Left -1, Down +cols, Up -cols
Clamp at boundaries (do not wrap).
```

### Key Bindings Summary

| Key          | Home Screen         | File Manager              | Settings / Menus     |
|--------------|---------------------|---------------------------|----------------------|
| Arrow keys   | Move tile focus     | Up/Down move selection    | Move option focus    |
| Enter        | Activate tile       | Open dir / launch file    | Confirm option       |
| Backspace    | —                   | Go up one directory       | Close panel          |
| Escape       | Open power menu     | Return to Home Screen     | Close panel/overlay  |
| Left         | Move focus left     | Go up one directory       | —                    |
| Page Up/Down | —                   | Scroll 10 items           | Scroll               |
| Home / End   | —                   | Jump to first / last item | —                    |

---

## 9. UI Design Guidelines

### Visual Style

- **Dark theme by default** — suits TV viewing in a dim room
- Background: deep dark (`#0d0d0d`) or user-supplied image with dark overlay
- Cards/tiles: slightly lighter surface (`#1a1a1a`), 12px border radius
- Focused element: accent-colored border (2–3px) + subtle glow (`box-shadow`)
- Typography: system font stack, large sizes (tile labels ~18px, file list ~16px)
- Icons: SVG inline or icon font (Lucide Icons recommended — tree-shakeable, MIT)

### Animations

Keep animations minimal for performance:
- View transitions: simple CSS opacity fade (150ms), no slide animations
- Focus movement: instant, no transition on the focused border
- File list load: fade in the list container (100ms)
- Avoid: complex transforms, large blurs, heavy gradients on frequently repainted elements

### TV-Specific Considerations

- Minimum touch/focus target size: 80×80px for tiles
- Overscan margin: 40px padding on all screen edges (configurable)
- Contrast ratio: minimum 7:1 for all text (WCAG AAA — important for TV distance)
- Font size: minimum 16px for secondary text, 20px+ for primary
- Cursor: always hidden (`cursor: none` on body)

---

## 10. Tauri Configuration (`tauri.conf.json` key settings)

```json
{
  "app": {
    "windows": [{
      "fullscreen": true,
      "decorations": false,
      "resizable": false,
      "title": "Pi Launcher"
    }]
  },
  "bundle": {
    "identifier": "com.pilauncher.app"
  },
  "security": {
    "csp": "default-src 'self'; img-src 'self' asset: https://asset.localhost"
  }
}
```

Key points:
- `fullscreen: true` — takes over the display completely
- `decorations: false` — no window title bar or borders
- CSP allows local asset loading for background images from the filesystem
  via Tauri's `asset:` protocol

---

## 11. Build & Deployment

### Development Setup

```bash
# Prerequisites on Raspberry Pi OS Trixie (Wayland/Labwc)
# NOTE: use webkit2gtk-4.1, NOT 4.0 — 4.0 is X11-only, 4.1 supports Wayland
sudo apt install -y curl build-essential libwebkit2gtk-4.1-dev \
  libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev \
  vlc chromium

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Node.js (via nvm or apt)
# Install Tauri CLI
cargo install tauri-cli

# Project init
npm create tauri-app@latest pi-launcher -- --template svelte-ts
cd pi-launcher
npm install
```

### Running in Development

```bash
cargo tauri dev
```

### Production Build

```bash
cargo tauri build
# Output: src-tauri/target/release/bundle/deb/pi-launcher_*.deb
```

### Autostart on Boot

If `autostart` is enabled in settings, create/remove a `.desktop` file:

```ini
# ~/.config/autostart/pi-launcher.desktop
[Desktop Entry]
Type=Application
Name=Pi Launcher
Exec=/usr/bin/pi-launcher
X-GNOME-Autostart-enabled=true
```

---

## 12. Implementation Phases

### Phase 1 — Core Shell (MVP)
- [ ] Tauri + Svelte project scaffolding
- [ ] Fullscreen window, dark theme, global CSS variables
- [ ] Topbar component (clock, settings icon, power icon — power is visual stub only)
- [ ] Home Screen with static app grid (3 hardcoded tiles)
- [ ] Keyboard navigation between tiles
- [ ] `launch_app` Rust command — launch Chromium (`--start-maximized`)
- [ ] `launch_app` Rust command — launch VLC (`--fullscreen --play-and-exit`) with file path
- [ ] Config file load/save (settings Rust commands)

### Phase 2 — File Manager
- [ ] `list_directory` Rust command
- [ ] FileManager view with keyboard navigation
- [ ] Directory traversal (enter + back)
- [ ] Launch video player with selected file
- [ ] Breadcrumb bar
- [ ] Filter by media extensions
- [ ] Bottom bar in normal mode (static key hint display only)

### Phase 3 — Settings & Customization
- [ ] Settings panel (slide-in overlay)
- [ ] Background image selection + preview
- [ ] Accent color picker
- [ ] Media root path configuration
- [ ] App tile editor (add/remove/reorder)
- [ ] Bottom bar options mode (`M` key toggle)
- [ ] Show/hide hidden files toggle from options bar
- [ ] File operations: copy, cut, paste, rename, delete (Rust commands + UI)

### Phase 4 — Polish
- [ ] Smooth view transitions
- [ ] Error states (permission denied, empty directory, app not found)
- [ ] File metadata display (size, date)
- [ ] Video thumbnail generation (optional — ffmpegthumbnailer)
- [ ] Autostart toggle
- [ ] Package as `.deb` for easy install

---

## 13. Dependencies Summary

### Rust (Cargo.toml)
```toml
[dependencies]
tauri = { version = "2", features = ["shell-open"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
toml = "0.8"
dirs = "5"          # for resolving ~/.config paths
```

### JavaScript (package.json)
```json
{
  "dependencies": {
    "@tauri-apps/api": "^2.0.0"
  },
  "devDependencies": {
    "svelte": "^5.0.0",
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "vite": "^6.0.0",
    "typescript": "^5.0.0",
    "lucide-svelte": "^0.468.0"
  }
}
```

---

## 14. Resolved Decisions

All open questions resolved. These are now fixed requirements.

1. **Video player — VLC**
   - Launch command: `vlc --fullscreen --play-and-exit`
   - `--play-and-exit` ensures VLC quits automatically when the file finishes
   - To return to launcher immediately: `Q` or `Ctrl+Q` closes VLC (standard VLC shortcut)
   - No custom quit-and-return mechanism needed — VLC exits and the launcher window
     is already waiting underneath (Wayland/Labwc handles window focus return)

2. **Chromium — maximized, not kiosk**
   - Launch args: `["--start-maximized"]`
   - Return shortcut: `Alt+F4` closes Chromium (standard); launcher regains focus
   - Optionally display a reminder overlay before launching ("Press Alt+F4 to return")
   - Do not use `--kiosk` — it prevents closing without a mouse

3. **Power button — stub for now**
   - Power button in Topbar renders visually but performs no action in Phase 1–3
   - Placeholder Rust command `power_stub()` returns Ok(()) immediately
   - Sleep/suspend functionality will be implemented as a separate project
   - Power menu overlay (shutdown/reboot/cancel) is deferred — remove from Phase 1 scope

4. **Display server — Wayland (Labwc compositor)**
   - Debian Trixie on RPi 5 uses Wayland by default since RPi OS Bookworm (2023)
   - Compositor: Labwc (replaced Wayfire/Mutter in late 2024)
   - Required WebKitGTK package: `libwebkit2gtk-4.1-dev` (Wayland-compatible)
   - Do NOT install `webkit2gtk-4.0` — that is the X11-only version

5. **Media storage — home directory as root, mounted devices via symlinks**
   - Default `media_root`: `/home/rpac` (or `~`, resolved at runtime)
   - User can navigate the full home directory tree through the file manager
   - External/mounted devices: create symlinks inside home dir pointing to mount points
     e.g. `ln -s /media/rpac/MyDrive ~/MyDrive`
   - The file manager follows symlinks transparently — no special handling needed
   - Automount detection is out of scope for Phase 1–2
