# Hearth

A fullscreen media center launcher for Linux, designed for TV use with keyboard/remote navigation. No mouse required.

Built with [Tauri 2](https://tauri.app) (Rust backend) + [Svelte 5](https://svelte.dev) (frontend) running on WebKitGTK.

## Features

- Fullscreen app launcher with keyboard navigation
- Embedded file manager for browsing and playing media
- Launches browser, media player, and any configured application
- Fully configurable keybindings (remap any navigation key, in-app or via config)
- Power menu: minimize, close, or shut down the system
- Dark TV-optimized UI with configurable accent color and background image
- Bundled Manrope font, default wallpaper, and a flame logo — no network dependencies at runtime
- Config stored in `~/.config/hearth/config.toml`

## Requirements

- Linux with Wayland or X11
- WebKitGTK 4.1

## Building from source

### Prerequisites

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# System libraries (Debian/Ubuntu)
sudo apt install -y build-essential libwebkit2gtk-4.1-dev \
  libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev

# Tauri CLI
cargo install tauri-cli --version "^2"
```

### Run in development

```bash
npm install
cargo tauri dev
```

### Build a .deb package

```bash
npm install
cargo tauri build
```

The installer is written to:

```
src-tauri/target/release/bundle/deb/hearth_<version>_<arch>.deb
```

Install it with apt (resolves runtime dependencies automatically):

```bash
sudo apt install ./src-tauri/target/release/bundle/deb/hearth_*.deb
# installs the binary to /usr/bin/hearth
```

### Deploying to a Raspberry Pi

Build **on the Pi** (native arm64) rather than cross-compiling — Tauri's native
GTK/WebKit dependencies make cross-compilation painful, and a native build on
the device is simpler:

```bash
# on the Pi
git clone <repo-url> ~/hearth && cd ~/hearth
# install prerequisites (see above), then:
npm install
cargo tauri build
sudo apt install ./src-tauri/target/release/bundle/deb/hearth_*.deb
hearth
```

### Platform note — Raspberry Pi rendering

On the Pi's GPU, WebKitGTK's DMABUF renderer causes rendering corruption
(horizontal-stripe artifacts). The app automatically sets
`WEBKIT_DISABLE_DMABUF_RENDERER=1` at startup on Linux to force a stable
rendering path, so no manual configuration is needed.

## Project Structure

```
src/                    Svelte frontend
  components/           UI components (Topbar, AppTile, Logo, dialogs, ...)
  views/                Full views (HomeScreen, FileManager, Settings)
  stores/               Svelte stores (navigation, settings, filemanager)
  lib/                  Helpers (tauri IPC wrappers, keyboard actions, utils)
  assets/fonts/         Bundled Manrope variable font
src-tauri/              Rust backend
  src/commands/         Tauri commands (launcher, filesystem, settings, power, autostart)
  src/models/           Shared data types (Config, FileEntry, ...)
  icons/                App icons (flame mark)
SPEC.md                 Full implementation specification
```

## Implementation Phases

- **Phase 1** ✅ — Core shell: app grid, keyboard nav, launch apps, config
- **Phase 2** ✅ — File manager: directory browsing, media playback
- **Phase 3** ✅ — Settings panel, file operations, background picker, autostart
- **Phase 4** — Polish, thumbnails, .deb packaging

### File manager

The file manager supports:
- Browsing from the configured media root (home by default), folders listed first
- Opening media (video/audio via VLC, images and other files via the system default)
- Copy, cut, paste (with automatic rename on collision)
- Rename
- Delete to the system trash (XDG trash — restore/empty via a terminal or system tools)
- Toggle hidden files

### Settings

- **Appearance** — accent color (applied live), background image via in-app picker
- **Media** — media root path (where Files opens)
- **Apps** — add/remove/edit launcher tiles
- **Controls** — remap navigation keys (press-to-rebind), reset to defaults
- **System** — autostart on boot (XDG `.desktop`), open a terminal emulator

Deferred for later (see SPEC.md): in-app trash view, copy/move progress bar,
light theme / UI scale, kiosk-session autostart.

## Keyboard Shortcuts

Navigation keys are configurable in Settings → Controls (or in `config.toml`).
The defaults are:

| Key | Action |
|-----|--------|
| Arrow keys | Navigate tiles / file list |
| Enter | Activate tile / open file |
| Escape | Go back / close overlay |
| Backspace / Left | Go up one directory (file manager) |
| M | Toggle options bar (file manager) |

In the file manager options bar (press `M`):

| Key | Action |
|-----|--------|
| H | Toggle hidden files |
| C | Copy |
| X | Cut |
| V | Paste |
| R | Rename |
| Del | Delete to trash |
| Esc | Close options bar |
